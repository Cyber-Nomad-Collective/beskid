#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SCRIPT="${ROOT}/scripts/ci/build-release-state.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

write_result() {
  local path="$1" target="$2" cli="$3" lsp="$4"
  jq -n \
    --arg target "${target}" \
    --arg cli_status "${cli}" \
    --arg lsp_status "${lsp}" \
    --arg cli_asset "beskid-${target}" \
    --arg lsp_asset "beskid_lsp-${target}" \
    '{schema_version:1,target:$target,builds:{cli:{status:$cli_status,asset:$cli_asset},lsp:{status:$lsp_status,asset:$lsp_asset}}}' >"${path}"
}

write_result "${TMP}/linux.json" linux success success
write_result "${TMP}/macos.json" macos success failed
write_result "${TMP}/windows.json" windows failed failed
write_result "${TMP}/macos-ok.json" macos success success
write_result "${TMP}/windows-ok.json" windows success success
mkdir -p "${TMP}/gate/stages" "${TMP}/gate/failures"
cat >"${TMP}/gate/stages/rust.json" <<'EOF'
{"component":"compiler","stage":"rust-gate","status":"failed"}
EOF
cat >"${TMP}/gate/stages/lsp.json" <<'EOF'
{"component":"lsp","stage":"command-contract-gate","status":"success"}
EOF
cat >"${TMP}/gate/failures/rust.json" <<'EOF'
{"component":"compiler","stage":"rust-gate","identifier":"compiler::parser::case","location":{"file":"compiler/src/parser.rs","line":4,"column":2},"reason":"failed","log_path":"raw-logs/rust.log"}
EOF

"${SCRIPT}" stable 0.4.9 compiler-sha superrepo-sha success "${TMP}/stable.json" \
  "${TMP}/linux.json" "${TMP}/macos-ok.json" "${TMP}/windows-ok.json"
jq -e '
  .schema_version == 1 and .channel == "stable" and .version == "0.4.9" and
  .publishable == true and (.complete_platforms | length) == 3 and
  .tests.successful == ["compiler-rust-gate", "lsp-command-contract-gate"] and
  .tests.failed == [] and .provenance.compiler_commit == "compiler-sha" and
  .provenance.superrepo_commit == "superrepo-sha"
' "${TMP}/stable.json" >/dev/null

if "${SCRIPT}" stable 0.4.9 compiler-sha superrepo-sha failure "${TMP}/bad-stable.json" \
  "${TMP}/linux.json" "${TMP}/linux.json" "${TMP}/linux.json"; then
  echo 'stable state unexpectedly accepted a failed gate' >&2
  exit 1
fi

"${SCRIPT}" unstable 0.4.10-unstable compiler-sha superrepo-sha failure "${TMP}/unstable.json" \
  "${TMP}/linux.json" "${TMP}/macos.json" "${TMP}/windows.json"
jq -e '
  .publishable == true and .complete_platforms == ["linux"] and
  .tests.successful == [] and
  .tests.failed == ["compiler-rust-gate", "lsp-command-contract-gate"] and
  (.available_artifacts | length) == 3 and (.missing_artifacts | length) == 3 and
  .failed_platform_builds == ["macos:lsp", "windows:cli", "windows:lsp"]
' "${TMP}/unstable.json" >/dev/null

GATE_REPORT_DIR="${TMP}/gate" \
  "${SCRIPT}" unstable 0.4.10-unstable compiler-sha superrepo-sha failure "${TMP}/evidence.json" \
  "${TMP}/linux.json" "${TMP}/macos.json" "${TMP}/windows.json"
jq -e '
  .tests.successful == ["lsp:command-contract-gate"] and
  .tests.failed == ["compiler:rust-gate"] and
  .diagnostics[0].identifier == "compiler::parser::case" and
  .diagnostics[0].log_path == "gate-evidence/raw-logs/rust.log"
' "${TMP}/evidence.json" >/dev/null

if "${SCRIPT}" unstable 0.4.10-unstable compiler-sha superrepo-sha failure "${TMP}/empty.json" \
  "${TMP}/macos.json" "${TMP}/windows.json"; then
  echo 'unstable state unexpectedly accepted zero complete platform pairs' >&2
  exit 1
fi

echo 'build release state tests OK'
