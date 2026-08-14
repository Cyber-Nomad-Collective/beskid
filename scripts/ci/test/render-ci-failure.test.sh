#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SCRIPT="${ROOT}/scripts/ci/render-ci-failure.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

cat >"${TMP}/rust.log" <<'EOF'
test parser::rejects_bad_input ... FAILED
thread 'parser::rejects_bad_input' panicked at G:\a\beskid\beskid\compiler\crates\beskid_tests\src\parser.rs:42:7:
expected diagnostic, got none
note: run with `RUST_BACKTRACE=1`
EOF

"${SCRIPT}" compiler workspace-tests windows \
  'cargo test --workspace' "${TMP}/rust.log" raw-logs/rust.log "${TMP}/failure.json"

jq -e '
  .component == "compiler" and .stage == "workspace-tests" and
  .platform == "windows" and .test_case == "parser::rejects_bad_input" and
  .identifier == "compiler::parser::rejects_bad_input" and
  .location.file == "compiler/crates/beskid_tests/src/parser.rs" and
  .location.line == 42 and .location.column == 7 and
  (.reason | contains("expected diagnostic")) and .log_path == "raw-logs/rust.log"
' "${TMP}/failure.json" >/dev/null

cat >"${TMP}/beskid.log" <<'EOF'
FAILED core.collections.array
error: assertion failed at compiler/corelib/packages/foundation/src/Testing/Assert.bd:18:3
Lowering(MissingRuleOrFact at Main.bd#g21:n46 Block@1:1-1:9)
EOF
"${SCRIPT}" corelib beskid-tests linux 'beskid test --all-targets' \
  "${TMP}/beskid.log" raw-logs/beskid.log "${TMP}/beskid.json"
jq -e '
  .test_case == "core.collections.array" and
  .identifier == "corelib::core::collections::array" and
  .location.file == "compiler/corelib/packages/foundation/src/Testing/Assert.bd" and
  (.reason | contains("#g21:n46"))
' "${TMP}/beskid.json" >/dev/null

printf 'error: linker failed without a source location\n' >"${TMP}/link.log"
"${SCRIPT}" compiler native-link macos 'cargo build --release' \
  "${TMP}/link.log" raw-logs/link.log "${TMP}/link.json"
jq -e '.identifier == "unavailable" and .location.file == "unavailable"' \
  "${TMP}/link.json" >/dev/null

printf 'error: lint failed\n  --> crates/beskid_queries/src/lib.rs:9:4\n' >"${TMP}/relative.log"
"${SCRIPT}" compiler rust-gate linux 'cargo clippy --workspace' \
  "${TMP}/relative.log" raw-logs/relative.log "${TMP}/relative.json"
jq -e '.location.file == "compiler/crates/beskid_queries/src/lib.rs"' \
  "${TMP}/relative.json" >/dev/null

echo 'render CI failure tests OK'
