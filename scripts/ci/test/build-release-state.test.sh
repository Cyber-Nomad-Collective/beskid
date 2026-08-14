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
cat >"${TMP}/gate/triggering-run-jobs.json" <<'EOF'
{"jobs":[
  {"id":11,"name":"Rust gate","conclusion":"success","html_url":"https://example.test/jobs/11","steps":[]},
  {"id":12,"name":"Windows ABI-v5 runtime-kit matrix","conclusion":"failure","html_url":"https://example.test/jobs/12","steps":[{"name":"Build and smoke exact Windows runtime-kit matrix","conclusion":"failure"}]},
  {"id":13,"name":"Linux ABI-v5 runtime-kit matrix","conclusion":"success","html_url":"https://example.test/jobs/13","steps":[{"name":"Build and smoke exact Linux runtime-kit matrix","conclusion":"success"}]},
  {"id":14,"name":"macOS ABI-v5 runtime-kit matrix","conclusion":"success","html_url":"https://example.test/jobs/14","steps":[{"name":"Build and smoke exact macOS runtime-kit matrix","conclusion":"success"}]},
  {"id":15,"name":"Unrelated job","conclusion":"failure","html_url":"https://example.test/jobs/15","steps":[]}
]}
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
  .tests.successful == ["compiler:abi-v5-runtime-kit-linux", "compiler:abi-v5-runtime-kit-macos", "lsp:command-contract-gate"] and
  .tests.failed == ["compiler:abi-v5-runtime-kit-windows", "compiler:rust-gate"] and
  (.tests.results | map(select(.stage == "abi-v5-runtime-kit-windows" and .status == "failed" and .platform == "Windows" and .job_id == 12 and .job_url == "https://example.test/jobs/12")) | length) == 1 and
  (.diagnostics | map(select(.stage == "abi-v5-runtime-kit-windows" and .identifier == "unavailable" and .log_path == "https://example.test/jobs/12")) | length) == 1 and
  (.diagnostics | map(select(.identifier == "compiler::parser::case" and .log_path == "gate-evidence/raw-logs/rust.log")) | length) == 1
' "${TMP}/evidence.json" >/dev/null

bash "${ROOT}/scripts/ci/render-compiler-release-notes.sh" "${TMP}/evidence.json" cli >"${TMP}/notes.md"
grep -F -- '- compiler:abi-v5-runtime-kit-windows' "${TMP}/notes.md" >/dev/null
grep -F -- '[GitHub Actions log](https://example.test/jobs/12)' "${TMP}/notes.md" >/dev/null

if "${SCRIPT}" unstable 0.4.10-unstable compiler-sha superrepo-sha failure "${TMP}/empty.json" \
  "${TMP}/macos.json" "${TMP}/windows.json"; then
  echo 'unstable state unexpectedly accepted zero complete platform pairs' >&2
  exit 1
fi

echo 'build release state tests OK'
