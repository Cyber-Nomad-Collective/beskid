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
assert_contains "${WORKFLOW}" "name: corelib-build-report" \
  "the report artifact has a stable name"
assert_contains "${WORKFLOW}" "path: \${{ runner.temp }}/corelib-build-report/corelib-build-report.md" \
  "the report artifact uploads only sanitized Markdown, never raw command logs"
assert_contains "${WORKFLOW}" "if: always()" \
  "the report upload runs after failures"
assert_contains "${WORKFLOW}" "if-no-files-found: warn" \
  "a cancellation cannot hide the original gate result behind upload failure"

finish_tests
