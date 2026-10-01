#!/usr/bin/env bash
set -euo pipefail
unset CI_PIPELINE_NUMBER CI_COMMIT_SHA

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SCRIPT="${ROOT}/scripts/ci/woodpecker-build-platform.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

cat >"${TMP}/init-submodules.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >"${FAKE_INIT_LOG}"
EOF
chmod +x "${TMP}/init-submodules.sh"

cat >"${TMP}/build-release-platform.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
target="$1"
cli_asset="$2"
lsp_asset="$3"
version="$4"
output="$6"
bundle_asset="$7"

if [[ "${target}" == x86_64-pc-windows-msvc ]]; then
  test -z "${CARGO_TARGET_X86_64_PC_WINDOWS_MSVC_LINKER:-}"
fi

mkdir -p "${output}/release-logs"
cat >"${output}/${cli_asset}" <<SCRIPT
#!/usr/bin/env bash
printf 'beskid %s\\n' '${version}'
SCRIPT
cat >"${output}/${lsp_asset}" <<SCRIPT
#!/usr/bin/env bash
printf 'beskid_lsp %s\\n' '${version}'
SCRIPT
chmod +x "${output}/${cli_asset}" "${output}/${lsp_asset}"

bundle_root="${bundle_asset%.tar.gz}"
extension=''; [[ "${target}" == x86_64-pc-windows-msvc ]] && extension=.exe
mkdir -p "${output}/${bundle_root}/bin" \
  "${output}/${bundle_root}/lib/beskid-runtime/abi-5/${target}/release" \
  "${output}/${bundle_root}/beskid_corelib/beskid_corelib" "${output}/${bundle_root}/beskid_corelib/packages"
touch "${output}/${bundle_root}/bin/beskid${extension}" \
  "${output}/${bundle_root}/bin/beskid_lsp${extension}" \
  "${output}/${bundle_root}/bin/beskid-up${extension}" \
  "${output}/${bundle_root}/lib/beskid-runtime/abi-5/${target}/release/abi.json" \
  "${output}/${bundle_root}/beskid_corelib/CoreLib.bws" \
  "${output}/${bundle_root}/beskid_corelib/.beskid-bundle.sha256" \
  "${output}/${bundle_root}/beskid_corelib/beskid_corelib/corelib.bproj"
printf '%064d\n' 0 >"${output}/${bundle_root}/beskid_corelib/.beskid-bundle.sha256"
printf '%s\n' "${version}" >"${output}/${bundle_root}/release-version.txt"
tar -czf "${output}/${bundle_asset}" -C "${output}" "${bundle_root}"
rm -rf "${output:?}/${bundle_root}"

jq -n --arg target "${target}" --arg cli "${cli_asset}" --arg lsp "${lsp_asset}" --arg bundle "${bundle_asset}" \
  --arg cli_status "${FAKE_CLI_STATUS:-success}" '
  {schema_version:1,target:$target,stage:"native-release-build",builds:{
    cli:{status:$cli_status,asset:$cli},
    lsp:{status:"success",asset:$lsp},
    bundle:{status:"success",asset:$bundle}},diagnostics:[]}' \
  >"${output}/platform-result-${target}.json"
EOF
chmod +x "${TMP}/build-release-platform.sh"

cat >"${TMP}/feature-evidence.mjs" <<'EOF'
import { writeFileSync } from "node:fs";
writeFileSync(`${process.argv[4]}/feature-evidence-v1.json`, '{"fixture":true}\n');
EOF

cat >"${TMP}/cli-gate.py" <<'EOF'
import argparse, hashlib, json, pathlib
parser = argparse.ArgumentParser()
parser.add_argument('binary', type=pathlib.Path)
parser.add_argument('--json', type=pathlib.Path)
parser.add_argument('--expected-sha256')
parser.add_argument('--corelib-root', type=pathlib.Path)
parser.add_argument('--expected-corelib-fingerprint')
args = parser.parse_args()
assert hashlib.sha256(args.binary.read_bytes()).hexdigest() == args.expected_sha256
assert args.corelib_root.is_dir()
assert args.corelib_root.joinpath('.beskid-bundle.sha256').read_text().strip() == args.expected_corelib_fingerprint
rows = [
    dict(path='parse', kind='leaf', status='pass', exit=0, expected_exit=0, control_bytes=[]),
    dict(path='graph --tui', kind='scenario', status='pass', exit=0, expected_exit=0, timed_out=False, rendered_project=True, transcript_base64='dHVp'),
    dict(path='analyze --plain PTY', kind='scenario', status='pass', exit=0, expected_exit=0, timed_out=False, line_output=True, summary_seen=True, transcript_base64='bGluZQ=='),
]
evidence = dict(schema='beskid.cli-surface.v1', binary=str(args.binary), binary_sha256=args.expected_sha256,
    corelib_fingerprint=args.expected_corelib_fingerprint,
    source_provenance=dict(status='unverified', commit=None, external_receipt_required=True), release_qualified=False,
    counts={'pass': 3, 'fail': 0, 'setup_skip': 0, 'uncovered': 0, 'inventory_only': 0}, rows=rows,
    contracts=dict(hi_unknown=dict(exit=2, unknown_subcommand=True, control_bytes=[]),
        new_tui_rejected=dict(exit=2, not_advertised=True, unexpected_argument=True, control_bytes=[]), graph_tui_advertised=True))
args.json.write_text(json.dumps(evidence) + '\n')
EOF
cat >"${TMP}/verify-corelib.mjs" <<'EOF'
import { readFileSync } from "node:fs";
if (process.argv[2] !== "--verify" || readFileSync(`${process.argv[4]}/.beskid-bundle.sha256`, "utf8").trim() !== "0".repeat(64)) process.exit(1);
EOF

assert_platform() {
  local platform="$1" target="$2" cli="$3" lsp="$4" bundle="$5"
  local output="${TMP}/output-${platform}${6:-}"
  FAKE_INIT_LOG="${TMP}/init-${platform}.log" \
    WOODPECKER_INIT_SUBMODULES_SCRIPT="${TMP}/init-submodules.sh" \
    WOODPECKER_RELEASE_PLATFORM_SCRIPT="${TMP}/build-release-platform.sh" \
    WOODPECKER_FEATURE_EVIDENCE_SCRIPT="${TMP}/feature-evidence.mjs" \
    WOODPECKER_CLI_SURFACE_GATE_SCRIPT="${TMP}/cli-gate.py" \
    WOODPECKER_CLI_SURFACE_CORELIB_VERIFIER="${TMP}/verify-corelib.mjs" \
    bash "${SCRIPT}" "${platform}" 1.2.3 "${output}" >"${TMP}/${platform}.log"
  output="$(cd "${output}" && pwd -P)"

  test "$(cat "${TMP}/init-${platform}.log")" = 'compiler beskid_bsol'
  test -f "${output}/${cli}"
  test -f "${output}/${lsp}"
  test -f "${output}/${bundle}"
  test -f "${output}/SHA256SUMS"
  test -f "${output}/feature-evidence-v1.json"
  if [[ "${platform}" == linux ]]; then
    test -f "${output}/cli-surface-evidence-v1.json"
    test -f "${output}/cli-surface-receipt-v1.json"
    jq -e '.status == "success" and .binary == "beskid-linux-amd64" and .corelib_fingerprint == ("0" * 64)' \
      "${output}/cli-surface-receipt-v1.json" >/dev/null
  else
    test ! -e "${output}/cli-surface-receipt-v1.json"
  fi
  test -f "${output}/bundle-contents.log"
  grep -Fq "WOODPECKER_OUTPUT_PATH=${output}" "${TMP}/${platform}.log"
  jq -e --arg platform "${platform}" --arg target "${target}" --arg output "${output}" '
    .schema_version == 1 and .platform == $platform and .target == $target and
    .version == "1.2.3" and .channel == "stable" and .output_path == $output and
    .platform_result_status == "success"' "${output}/woodpecker-build-result.json" >/dev/null
  grep -Fq "beskid 1.2.3" "${output}/artifact-version-smoke.log"
  grep -Fq "beskid_lsp 1.2.3" "${output}/artifact-version-smoke.log"
  (cd "${output}" && shasum -a 256 -c SHA256SUMS >/dev/null)
}

assert_platform linux x86_64-unknown-linux-gnu \
  beskid-linux-amd64 beskid_lsp-linux-amd64 \
  beskid-1.2.3-x86_64-unknown-linux-gnu.tar.gz ' with spaces'
assert_platform macos aarch64-apple-darwin \
  beskid-darwin-arm64 beskid_lsp-darwin-arm64 \
  beskid-1.2.3-aarch64-apple-darwin.tar.gz
assert_platform windows x86_64-pc-windows-msvc \
  beskid-windows-amd64.exe beskid_lsp-windows-amd64.exe \
  beskid-1.2.3-x86_64-pc-windows-msvc.tar.gz

if bash "${SCRIPT}" solaris 1.2.3 "${TMP}/unknown" >/dev/null 2>&1; then
  echo 'unsupported platform unexpectedly accepted' >&2
  exit 1
fi

if bash "${SCRIPT}" linux 1.2.3-rc.1 "${TMP}/prerelease" >/dev/null 2>&1; then
  echo 'prerelease version unexpectedly accepted by stable build wrapper' >&2
  exit 1
fi

if FAKE_INIT_LOG="${TMP}/failed-init.log" \
  FAKE_CLI_STATUS=failed \
  WOODPECKER_INIT_SUBMODULES_SCRIPT="${TMP}/init-submodules.sh" \
  WOODPECKER_RELEASE_PLATFORM_SCRIPT="${TMP}/build-release-platform.sh" \
  WOODPECKER_FEATURE_EVIDENCE_SCRIPT="${TMP}/feature-evidence.mjs" \
  bash "${SCRIPT}" linux 1.2.3 "${TMP}/failed-result" >/dev/null 2>&1; then
  echo 'failed structured platform result unexpectedly accepted' >&2
  exit 1
fi

mkdir -p "${TMP}/nonempty"
touch "${TMP}/nonempty/stale"
if bash "${SCRIPT}" linux 1.2.3 "${TMP}/nonempty" >/dev/null 2>&1; then
  echo 'non-empty output directory unexpectedly accepted' >&2
  exit 1
fi

if CI_PIPELINE_NUMBER=42 CI_COMMIT_SHA="$(git -C "${ROOT}" rev-parse HEAD)" \
  FAKE_INIT_LOG="${TMP}/ci-fake-init" \
  WOODPECKER_INIT_SUBMODULES_SCRIPT="${TMP}/init-submodules.sh" \
  WOODPECKER_RELEASE_PLATFORM_SCRIPT="${TMP}/build-release-platform.sh" \
  bash "${SCRIPT}" linux 1.2.3 "${TMP}/ci-fake-output" >"${TMP}/ci-fake.log" 2>&1; then
  echo 'pipeline accepted a test-only builder override' >&2
  exit 1
fi
test ! -e "${TMP}/ci-fake-init"
grep -q 'test-only' "${TMP}/ci-fake.log"

if CI_PIPELINE_NUMBER=42 CI_COMMIT_SHA="$(git -C "${ROOT}" rev-parse HEAD)" \
  WOODPECKER_CLI_SURFACE_GATE_SCRIPT="${TMP}/cli-gate.py" \
  bash "${SCRIPT}" linux 1.2.3 "${TMP}/ci-cli-override" >"${TMP}/ci-cli-override.log" 2>&1; then
  echo 'pipeline accepted a test-only CLI gate override' >&2
  exit 1
fi
grep -Fq 'WOODPECKER_CLI_SURFACE_GATE_SCRIPT is test-only and forbidden' "${TMP}/ci-cli-override.log"

echo 'Woodpecker platform wrapper tests OK'
