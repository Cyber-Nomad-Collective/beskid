#!/usr/bin/env bash
# Self-tests for scripts/ci/lib/gate-harness.sh. Zero-dependency.
# Run: bash scripts/ci/test/run-gate-harness-tests.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "${ROOT}"

# shellcheck source=lib/assert.sh
source "${ROOT}/scripts/ci/test/lib/assert.sh"

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT
export GATE_LOG_DIR="${TMP}/logs"
export GATE_JUNIT_DIR="${TMP}/junit"

# shellcheck source=../lib/gate-harness.sh
source "${ROOT}/scripts/ci/lib/gate-harness.sh"

echo "== pass path =="
gate_init "demo-pass"
gate_step "true-step" -- true
gate_step "echo-step" -- sh -c 'echo hello'
gate_emit_junit
gate_summary
assert_eq "0" "$(gate_overall_rc >/dev/null; echo $?)" "overall rc passes when all steps pass"
assert_file_exists "${GATE_JUNIT_DIR}/demo-pass.xml" "junit emitted"

echo "== fail path =="
gate_init "demo-fail"
gate_step "ok-step" -- true
gate_step "bad-step" -- sh -c 'echo about to fail; exit 7'
gate_emit_junit
gate_summary
assert_eq "1" "$(gate_overall_rc >/dev/null; echo $?)" "overall rc fails when any step fails"

echo "== junit failure content =="
JUNIT="$(cat "${GATE_JUNIT_DIR}/demo-fail.xml")"
assert_contains "${JUNIT}" 'tests="2"' "junit records 2 testcases"
assert_contains "${JUNIT}" 'failures="1"' "junit records 1 failure"
assert_contains "${JUNIT}" '<failure' "junit has a failure element"
assert_contains "${JUNIT}" 'about to fail' "junit failure CDATA contains log tail"

echo "== no GATE_JUNIT_DIR -> no xml =="
unset GATE_JUNIT_DIR
gate_init "no-xml"
gate_step "s" -- true
gate_emit_junit
# Nothing should be written under TMP/junit for no-xml.
if [[ -f "${TMP}/junit/no-xml.xml" ]]; then
  _TESTS_RUN=$((_TESTS_RUN + 1))
  _TESTS_FAIL=$((_TESTS_FAIL + 1))
  echo "  FAIL - junit written despite GATE_JUNIT_DIR unset"
else
  _TESTS_RUN=$((_TESTS_RUN + 1))
  echo "  ok   - junit suppressed when GATE_JUNIT_DIR unset"
fi

finish_tests
