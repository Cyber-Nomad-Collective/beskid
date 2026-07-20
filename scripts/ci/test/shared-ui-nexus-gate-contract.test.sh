#!/usr/bin/env bash
# Contract tests for shared-ui-nexus-gate wiring (CYB-93).
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
# shellcheck source=lib/assert.sh
source "${root}/scripts/ci/test/lib/assert.sh"

gate="${root}/scripts/ci/shared-ui-nexus-gate.sh"
workflow="${root}/.github/workflows/platform-delivery.yml"
pkg="${root}/package.json"
validate="${root}/validate-ci-local.sh"
doc="${root}/docs/orchestrate/shared-ui-nexus-gate.md"

assert_file_exists "${gate}" "shared-ui-nexus-gate.sh exists"
bash -n "${gate}"

# Authoritative runners only — reject bare `bun test` (package `bun --cwd … test` is OK).
if rg -n '(^|[[:space:]])bun test([[:space:]]|$)' "${gate}" | rg -v 'bun --cwd' >/dev/null 2>&1; then
  echo "  FAIL - gate must not invoke bare bun test" >&2
  exit 1
fi
_TESTS_RUN=$((_TESTS_RUN + 1))
echo "  ok   - gate avoids bare bun test"

gate_src="$(cat "${gate}")"
assert_contains "${gate_src}" 'bun run --cwd="${WEB_COMMON}" test' "gate invokes shared UI package test"
assert_contains "${gate_src}" 'bun run --cwd="${NEXUS_WEB}" test:unit' "gate invokes Nexus unit runner"
assert_contains "${gate_src}" 'bun run --cwd="${NEXUS_WEB}" test:e2e' "gate invokes Nexus Playwright E2E"
assert_contains "${gate_src}" 'test:e2e:install' "gate installs Playwright Chromium"
# Reject the broken Bun space form that can exit 0 without running scripts.
if rg -n 'bun --cwd[[:space:]]+"\$\{' "${gate}" >/dev/null 2>&1; then
  echo "  FAIL - use bun run --cwd=DIR (equals), not bun --cwd DIR run …" >&2
  exit 1
fi
_TESTS_RUN=$((_TESTS_RUN + 1))
echo "  ok   - gate uses bun --cwd= equals form"

assert_file_exists "${workflow}" "platform-delivery.yml exists"
workflow_src="$(cat "${workflow}")"
assert_contains "${workflow_src}" 'gate-name: shared-ui-nexus' "platform-delivery defines shared-ui-nexus quality job"
assert_contains "${workflow_src}" 'bash scripts/ci/shared-ui-nexus-gate.sh' "platform-delivery runs shared-ui-nexus-gate.sh"
assert_contains "${workflow_src}" 'submodules: beskid_web_common beskid_nexus' "shared-ui-nexus job initializes web_common + nexus"

assert_file_exists "${pkg}" "root package.json exists"
pkg_src="$(cat "${pkg}")"
assert_contains "${pkg_src}" '"gate:shared-ui-nexus"' "root package.json exposes gate:shared-ui-nexus"
assert_contains "${pkg_src}" '"test:shared-ui"' "root package.json exposes test:shared-ui"
assert_contains "${pkg_src}" '"test:nexus:unit"' "root package.json exposes test:nexus:unit"
assert_contains "${pkg_src}" '"test:nexus:e2e"' "root package.json exposes test:nexus:e2e"

assert_file_exists "${validate}" "validate-ci-local.sh exists"
assert_contains "$(cat "${validate}")" 'shared-ui-nexus-gate.sh' "validate-ci-local.sh runs shared-ui-nexus-gate"

assert_file_exists "${doc}" "local/CI parity doc exists"
assert_contains "$(cat "${doc}")" 'Local and CI' "parity doc mentions Local and CI"

finish_tests
