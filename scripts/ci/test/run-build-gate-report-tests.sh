#!/usr/bin/env bash
# Self-tests for build-gate-report.sh. Zero-dependency.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "${ROOT}"
# shellcheck source=lib/assert.sh
source "${ROOT}/scripts/ci/test/lib/assert.sh"

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT
JIN="${TMP}/junit"; mkdir -p "${JIN}"
OUT="${TMP}/out"

# Fixture: one passing gate, one failing gate.
cat > "${JIN}/platform-smoke.xml" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="platform-smoke" tests="1" failures="0">
    <testcase name="root-frozen-install" classname="platform-smoke" time="0.5"></testcase>
  </testsuite>
</testsuites>
EOF

cat > "${JIN}/site-build-auth.xml" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="site-build-auth" tests="2" failures="1">
    <testcase name="auth-frozen-install" classname="site-build-auth" time="0.4"></testcase>
    <testcase name="auth-test" classname="site-build-auth" time="1.2">
      <failure message="step failed"><![CDATA[running tests...
AssertionError: expected 200 got 500]]></failure>
    </testcase>
  </testsuite>
</testsuites>
EOF

bash "${ROOT}/scripts/ci/build-gate-report.sh" "${JIN}" "${OUT}"

MD="$(cat "${OUT}/gate-report.md")"
XML="$(cat "${OUT}/gate-report.junit.xml")"

assert_file_exists "${OUT}/gate-report.md" "markdown report exists"
assert_file_exists "${OUT}/gate-report.junit.xml" "consolidated junit exists"

assert_contains "${MD}" "## platform-smoke — PASS" "md has passing gate section"
assert_contains "${MD}" "## site-build-auth — FAIL" "md has failing gate section"
assert_contains "${MD}" "| auth-test | FAIL |" "md lists failing step"
assert_contains "${MD}" "AssertionError" "md includes failure log fragment"
assert_contains "${MD}" "2 passed, 1 failed" "md has totals (1 pass smoke + 1 pass auth = 2, 1 fail auth)"

assert_contains "${XML}" '<testsuite name="platform-smoke"' "xml keeps platform-smoke suite"
assert_contains "${XML}" '<testsuite name="site-build-auth"' "xml keeps site-build-auth suite"

echo "== empty dir path =="
mkdir -p "${TMP}/empty"
bash "${ROOT}/scripts/ci/build-gate-report.sh" "${TMP}/empty" "${OUT}-empty"
assert_file_exists "${OUT}-empty/gate-report.md" "empty dir still produces md"
assert_contains "$(cat "${OUT}-empty/gate-report.junit.xml")" 'tests="0"' "empty dir junit has 0 tests"

finish_tests
