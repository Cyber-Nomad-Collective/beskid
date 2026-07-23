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

for pkg in site/platform-spec site/auth site/website site/learn; do
  test -f "${pkg}/package.json"
  test "$(node -p "require('./${pkg}/package.json').packageManager")" = "pnpm@10.17.1"
done
test ! -e site/auth/bun.lock
grep -Fxq "  - site/auth" pnpm-workspace.yaml
grep -Fxq "  - site/learn" pnpm-workspace.yaml

auth_sync_output="$(bash scripts/sync-beskid-packages.sh site/auth 2>&1)"
grep -Fq "site/auth" <<<"${auth_sync_output}"
if grep -Fq "Bun runtime migration is pending" <<<"${auth_sync_output}"; then
	echo "site/auth must no longer use the temporary Bun migration skip" >&2
	exit 1
fi

echo "pnpm workspace contract OK"
