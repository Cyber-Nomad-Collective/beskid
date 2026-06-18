#!/usr/bin/env bash
# Site build gate for the auth hub and the platform-spec app.
#
# Ported from the Dagger function siteBuildGate() in
# beskid_infra/dagger/src/platform-gates.ts so it runs directly on a Blacksmith
# runner. Run from the superrepo root.
#
# Usage: site-build-gate.sh <auth|platform-spec> [NODE_AUTH_TOKEN]
set -euo pipefail

APP="${1:-}"
NODE_AUTH_TOKEN="${2:-}"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}"

if [[ "$APP" == "auth" ]]; then
  [[ -n "$NODE_AUTH_TOKEN" ]] && export NODE_AUTH_TOKEN
  echo "==> auth: bun install --frozen-lockfile"
  (cd site/auth && bun install --frozen-lockfile)
  echo "==> auth: bun run test"
  (cd site/auth && bun run test)
  echo "==> auth: bun run build (SKIP_ENV_VALIDATION=1)"
  (cd site/auth && SKIP_ENV_VALIDATION=1 bun run build)
  echo "==> auth: bun run verify:client-bundle"
  (cd site/auth && bun run verify:client-bundle)
  echo "==> auth: bun run test:bundle"
  (cd site/auth && bun run test:bundle)
elif [[ "$APP" == "platform-spec" ]]; then
  [[ -n "$NODE_AUTH_TOKEN" ]] && export NODE_AUTH_TOKEN
  echo "==> spec-core: bun install + test (beskid_web_common)"
  (cd beskid_web_common && bun install --frozen-lockfile)
  (cd beskid_web_common && bun run --filter '@cyber-nomad-collective/spec-core' test)
  echo "==> platform-spec: bun install --frozen-lockfile"
  (cd site/platform-spec && bun install --frozen-lockfile)
  echo "==> platform-spec: bun run test"
  (cd site/platform-spec && bun run test)
  echo "==> platform-spec: bun run build (SKIP_ENV_VALIDATION=1)"
  (cd site/platform-spec && SKIP_ENV_VALIDATION=1 bun run build)
  echo "==> platform-spec: bun run verify:client-bundle"
  (cd site/platform-spec && bun run verify:client-bundle)
else
  echo "Usage: $0 <auth|platform-spec> [NODE_AUTH_TOKEN]" >&2
  exit 1
fi

echo "site-build-gate OK (${APP})"
