#!/usr/bin/env bash
# Static contract for Corelib report retention in GitHub Actions.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
# shellcheck source=lib/assert.sh
source "${ROOT}/scripts/ci/test/lib/assert.sh"

WORKFLOW="$(cat "${ROOT}/.github/workflows/corelib.yml")"
assert_contains "${WORKFLOW}" "CORELIB_REPORT_DIR: \${{ runner.temp }}/corelib-build-report" \
  "the Corelib gate receives a runner-local report directory"
assert_contains "${WORKFLOW}" "BESKID_COMPILER_TRACE: \"1\"" \
  "the Corelib gate enables compiler trace evidence"
assert_contains "${WORKFLOW}" "run-ci-reported-command.sh" \
  "the Corelib gate uses the shared structured diagnostic wrapper"
assert_contains "${WORKFLOW}" "if: always()" \
  "the report summary runs after failures"
assert_contains "${WORKFLOW}" "Summarize Corelib build report" \
  "the report summary has a stable step name"
assert_contains "${WORKFLOW}" 'GITHUB_STEP_SUMMARY' \
  "the report remains available in the GitHub job summary"
assert_contains "${WORKFLOW}" 'No report files were emitted; see the gate log.' \
  "a missing report cannot hide the original gate result"
if [[ "${WORKFLOW}" == *"actions/upload-artifact"* ]]; then
  echo "  FAIL - the Corelib workflow must not consume Actions artifact quota"
  _TESTS_RUN=$((_TESTS_RUN + 1))
  _TESTS_FAIL=$((_TESTS_FAIL + 1))
else
  echo "  ok   - the Corelib workflow does not consume Actions artifact quota"
  _TESTS_RUN=$((_TESTS_RUN + 1))
fi

finish_tests
