#!/usr/bin/env bash
# Verifies the root package-manager contract used by local setup and CI.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "${ROOT}"

test -f pnpm-workspace.yaml
test -f pnpm-lock.yaml
test ! -e bun.lock

corepack enable
test "$(pnpm --version)" = "10.17.1"

test "$(node -p "require('./site/platform-spec/package.json').packageManager")" = "pnpm@10.17.1"
test "$(node -p "require('./pckg/package.json').packageManager")" = "pnpm@10.17.1"

auth_sync_output="$(bash scripts/sync-beskid-packages.sh site/auth 2>&1)"
grep -Fq "Skip site/auth (Bun runtime migration is pending)" <<<"${auth_sync_output}"
