#!/usr/bin/env bash
# Site build gate for the auth hub, website, and the platform-spec app.
#
# Runs identically locally and in the reusable delivery workflows. Sourced
# gate-harness gives structured output, log-fragment
# capture, and JUnit emission (when GATE_JUNIT_DIR is set).
#
# Usage: site-build-gate.sh <auth|website|platform-spec> [NODE_AUTH_TOKEN]
set -euo pipefail

APP="${1:-}"
NODE_AUTH_TOKEN="${2:-}"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}"

# Path is resolved from the repository root above.
# shellcheck disable=SC1091
source "${ROOT}/scripts/ci/lib/gate-harness.sh"

if [[ "$APP" == "auth" ]]; then
  gate_init "site-build-auth"
  [[ -n "$NODE_AUTH_TOKEN" ]] && export NODE_AUTH_TOKEN
  gate_step "auth-frozen-install"  -- sh -c 'cd site/auth && bun install --frozen-lockfile'
  gate_step "auth-test"            -- sh -c 'cd site/auth && bun run test'
  gate_step "auth-build"           -- sh -c 'cd site/auth && SKIP_ENV_VALIDATION=1 bun run build'
  gate_step "auth-verify-bundle"   -- sh -c 'cd site/auth && bun run verify:client-bundle'
  gate_step "auth-test-bundle"     -- sh -c 'cd site/auth && bun run test:bundle'
elif [[ "$APP" == "website" ]]; then
  gate_init "site-build-website"
  [[ -n "$NODE_AUTH_TOKEN" ]] && export NODE_AUTH_TOKEN
  # Website is a root workspace member; install from the repo lockfile.
  gate_step "website-frozen-install" -- bun install --frozen-lockfile
  gate_step "website-catalog" -- sh -c 'test -f openspec/catalog.json && jq -e "(.entries | type == \"array\" and length > 0)" openspec/catalog.json >/dev/null'
  gate_step "website-build" -- sh -c 'BESKID_REQUIRE_OPENSPEC_CATALOG=1 bun run --cwd site/website build'
elif [[ "$APP" == "platform-spec" ]]; then
  gate_init "site-build-platform-spec"
  [[ -n "$NODE_AUTH_TOKEN" ]] && export NODE_AUTH_TOKEN
  # Platform-spec is a root workspace member; install from the repo lockfile.
  gate_step "pspec-frozen-install" -- bun install --frozen-lockfile
  gate_step "pspec-layouts"        -- sh -c 'cd site/platform-spec && bun run layouts:check'
  gate_step "pspec-test"           -- sh -c 'cd site/platform-spec && bun run test'
  gate_step "pspec-build"          -- sh -c 'cd site/platform-spec && SKIP_ENV_VALIDATION=1 bun run build'
  gate_step "pspec-verify-seed"    -- sh -c 'cd site/platform-spec && bun run verify:seed'
  gate_step "pspec-verify-bundle"  -- sh -c 'cd site/platform-spec && bun run verify:client-bundle'
else
  echo "Usage: $0 <auth|website|platform-spec> [NODE_AUTH_TOKEN]" >&2
  exit 1
fi

gate_summary
gate_emit_junit

if gate_overall_rc; then
  echo "site-build-gate OK (${APP})"
  exit 0
else
  echo "site-build-gate FAILED (${APP})" >&2
  exit 1
fi
