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
    '{schema_version:1,target:$target,
      builds:{cli:{status:$cli_status,asset:$cli_asset,log_path:($target + "-cli.log")},lsp:{status:$lsp_status,asset:$lsp_asset,log_path:($target + "-lsp.log")}},
      diagnostics:(if $lsp_status == "failed" then [{identifier:"compiler::lsp",location:{file:"unavailable",line:0,column:0},reason:"failed",log_path:($target + "-lsp.log")}] else [] end)}' >"${path}"
}

write_result "${TMP}/linux.json" linux success success
write_result "${TMP}/macos.json" macos success failed
write_result "${TMP}/windows.json" windows failed failed
write_result "${TMP}/macos-ok.json" macos success success
write_result "${TMP}/windows-ok.json" windows success success
mkdir -p "${TMP}/gate/stages" "${TMP}/gate/failures"
cat >"${TMP}/gate/failures/rust.json" <<'EOF'
{"component":"compiler","stage":"rust-gate","identifier":"compiler::parser::case","location":{"file":"compiler/src/parser.rs","line":4,"column":2},"reason":"failed","log_path":"raw-logs/rust.log"}
EOF

if "${SCRIPT}" stable 0.4.9 compiler-sha superrepo-sha success "${TMP}/stable.json" \
  "${TMP}/linux.json" "${TMP}/macos-ok.json" "${TMP}/windows-ok.json"; then
  echo 'stable state accepted a literal success without compiler/Corelib reports' >&2
  exit 1
fi

compiler_sha=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
superrepo_sha=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
printf 'compiler rust gate passed\n' >"${TMP}/gate/rust.log"
printf 'corelib matrix passed\n' >"${TMP}/gate/corelib.log"
for entry in 'compiler rust-gate rust.log' 'corelib matrix corelib.log'; do
  read -r component stage log <<<"${entry}"
  jq -n --arg component "$component" --arg stage "$stage" \
    --arg raw_log "$log" --arg raw_log_sha256 "$(shasum -a 256 "${TMP}/gate/$log" | awk '{print $1}')" \
    --arg compiler "$compiler_sha" --arg superrepo "$superrepo_sha" \
    '{schema_version:1,component:$component,stage:$stage,status:"success",exit_code:0,version:"0.4.9",source:{compiler_commit:$compiler,superrepo_commit:$superrepo},raw_log:$raw_log,raw_log_sha256:$raw_log_sha256,platform:"linux",command:"fixture gate"}' \
    >"${TMP}/gate/stages/${component}.json"
done
GATE_REPORT_DIR="${TMP}/gate" "${SCRIPT}" stable 0.4.9 "$compiler_sha" "$superrepo_sha" success "${TMP}/qualified.json" \
  "${TMP}/linux.json" "${TMP}/macos-ok.json" "${TMP}/windows-ok.json"
jq -e '
  .publishable == true and .tests.successful == ["compiler:rust-gate", "corelib:matrix"] and
  .tests.failed == [] and (.tests.results | length) == 2 and
  all(.tests.results[]; .source.compiler_commit == "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" and
    .source.superrepo_commit == "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" and
    (.raw_log_sha256 | test("^[0-9a-f]{64}$")))
' "${TMP}/qualified.json" >/dev/null

mv "${TMP}/gate/stages/corelib.json" "${TMP}/corelib-report.json"
ln -s "${TMP}/corelib-report.json" "${TMP}/gate/stages/corelib.json"
if GATE_REPORT_DIR="${TMP}/gate" "${SCRIPT}" stable 0.4.9 "$compiler_sha" "$superrepo_sha" success "${TMP}/symlink.json" \
  "${TMP}/linux.json" "${TMP}/macos-ok.json" "${TMP}/windows-ok.json"; then
  echo 'stable state accepted a symlinked Corelib report' >&2
  exit 1
fi
rm "${TMP}/gate/stages/corelib.json"
mv "${TMP}/corelib-report.json" "${TMP}/gate/stages/corelib.json"

printf 'tampered\n' >>"${TMP}/gate/corelib.log"
if GATE_REPORT_DIR="${TMP}/gate" "${SCRIPT}" stable 0.4.9 "$compiler_sha" "$superrepo_sha" success "${TMP}/tampered.json" \
  "${TMP}/linux.json" "${TMP}/macos-ok.json" "${TMP}/windows-ok.json"; then
  echo 'stable state accepted a Corelib log differing from its SHA-256' >&2
  exit 1
fi
printf 'corelib matrix passed\n' >"${TMP}/gate/corelib.log"

jq '.source.compiler_commit = "cccccccccccccccccccccccccccccccccccccccc"' \
  "${TMP}/gate/stages/corelib.json" >"${TMP}/gate/stages/corelib-stale.json"
mv "${TMP}/gate/stages/corelib-stale.json" "${TMP}/gate/stages/corelib.json"
if GATE_REPORT_DIR="${TMP}/gate" "${SCRIPT}" stable 0.4.9 "$compiler_sha" "$superrepo_sha" success "${TMP}/stale.json" \
  "${TMP}/linux.json" "${TMP}/macos-ok.json" "${TMP}/windows-ok.json"; then
  echo 'stable state accepted a Corelib report for another compiler commit' >&2
  exit 1
fi
rm "${TMP}/gate/stages/compiler.json" "${TMP}/gate/stages/corelib.json"
cat >"${TMP}/gate/stages/rust.json" <<'EOF'
{"component":"compiler","stage":"rust-gate","status":"failed"}
EOF
cat >"${TMP}/gate/stages/lsp.json" <<'EOF'
{"component":"lsp","stage":"command-contract-gate","status":"success"}
EOF

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
  .tests.failed == [] and .tests.gate_result == "failure" and
  (.available_artifacts | length) == 3 and (.missing_artifacts | length) == 3 and
  .failed_platform_builds == ["macos:lsp", "windows:cli", "windows:lsp"]
' "${TMP}/unstable.json" >/dev/null

GATE_REPORT_DIR="${TMP}/gate" \
HANDOFF_RELEASE_URL="https://github.com/org/compiler/releases/download/compiler-handoff-42" \
  "${SCRIPT}" unstable 0.4.10-unstable compiler-sha superrepo-sha failure "${TMP}/evidence.json" \
  "${TMP}/linux.json" "${TMP}/macos.json" "${TMP}/windows.json"
jq -e '
  .tests.successful == ["lsp:command-contract-gate"] and
  .tests.failed == ["compiler:rust-gate"] and
  (.tests.results | length) == 2 and
  (.diagnostics | map(select(.identifier == "compiler::parser::case" and .log_path == "gate-evidence/raw-logs/rust.log")) | length) == 1 and
  (.diagnostics | map(select(.identifier == "compiler::lsp" and .log_path == "https://github.com/org/compiler/releases/download/compiler-handoff-42/macos-lsp.log")) | length) == 1 and
  (.platforms[] | select(.target == "macos") | .builds.lsp.log_path) == "https://github.com/org/compiler/releases/download/compiler-handoff-42/macos-lsp.log"
' "${TMP}/evidence.json" >/dev/null

bash "${ROOT}/scripts/ci/render-compiler-release-notes.sh" "${TMP}/evidence.json" cli >"${TMP}/notes.md"
grep -F -- '- compiler:rust-gate' "${TMP}/notes.md" >/dev/null

if "${SCRIPT}" unstable 0.4.10-unstable compiler-sha superrepo-sha failure "${TMP}/empty.json" \
  "${TMP}/macos.json" "${TMP}/windows.json"; then
  echo 'unstable state unexpectedly accepted zero complete platform pairs' >&2
  exit 1
fi

echo 'build release state tests OK'
