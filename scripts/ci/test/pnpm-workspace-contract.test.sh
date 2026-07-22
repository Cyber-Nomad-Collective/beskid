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
