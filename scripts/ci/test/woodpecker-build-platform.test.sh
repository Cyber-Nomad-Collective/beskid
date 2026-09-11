#!/usr/bin/env bash
set -euo pipefail

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
  test -n "${CARGO_TARGET_X86_64_PC_WINDOWS_MSVC_LINKER:-}"
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
mkdir -p "${output}/${bundle_root}/native-runtime-kit/beskid-runtime/abi-5/${target}/release"
touch "${output}/${bundle_root}/beskid_cli" \
  "${output}/${bundle_root}/beskid_lsp" \
  "${output}/${bundle_root}/beskid-up" \
  "${output}/${bundle_root}/native-runtime-kit/beskid-runtime/abi-5/${target}/release/abi.json"
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

mkdir -p "${TMP}/Visual Studio/VC/Auxiliary/Build" \
  "${TMP}/Visual Studio/VC/Tools/MSVC/14.44/bin/Hostx64/x64"
printf '14.44\r\n' >"${TMP}/Visual Studio/VC/Auxiliary/Build/Microsoft.VCToolsVersion.default.txt"
touch "${TMP}/Visual Studio/VC/Tools/MSVC/14.44/bin/Hostx64/x64/link.exe"
cat >"${TMP}/vswhere.sh" <<EOF
#!/usr/bin/env bash
printf '%s\\r\\n' '${TMP}/Visual Studio'
EOF
chmod +x "${TMP}/vswhere.sh"

assert_platform() {
  local platform="$1" target="$2" cli="$3" lsp="$4" bundle="$5"
  local output="${TMP}/output-${platform}"
  FAKE_INIT_LOG="${TMP}/init-${platform}.log" \
    WOODPECKER_VSWHERE="${TMP}/vswhere.sh" \
    WOODPECKER_INIT_SUBMODULES_SCRIPT="${TMP}/init-submodules.sh" \
    WOODPECKER_RELEASE_PLATFORM_SCRIPT="${TMP}/build-release-platform.sh" \
    bash "${SCRIPT}" "${platform}" 1.2.3 "${output}" >"${TMP}/${platform}.log"
  output="$(cd "${output}" && pwd -P)"

  test "$(cat "${TMP}/init-${platform}.log")" = 'compiler beskid_bsol'
  test -f "${output}/${cli}"
  test -f "${output}/${lsp}"
  test -f "${output}/${bundle}"
  test -f "${output}/SHA256SUMS"
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
  beskid-1.2.3-x86_64-unknown-linux-gnu.tar.gz
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

echo 'Woodpecker platform wrapper tests OK'
