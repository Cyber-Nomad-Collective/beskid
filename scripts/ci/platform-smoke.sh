#!/usr/bin/env bash
# Platform smoke: aggregate web-workspace checks for site/website.
#
# Ported from the Dagger function platformSmoke() in
# beskid_infra/dagger/src/platform-gates.ts so it runs directly on a Blacksmith
# runner instead of inside a Dagger container (which exited 127 on a missing
# command). Run from the superrepo root; assumes beskid_web_common submodule is
# already initialised (the calling workflow does this via setup-beskid-web).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}"

# Ensure beskid_web_common is present (idempotent with setup-beskid-web).
if [[ ! -d beskid_web_common/packages ]]; then
  ./scripts/ci/init-submodules.sh beskid_web_common
fi

echo "==> bun install --frozen-lockfile (root)"
bun install --frozen-lockfile

# NOTE: site/website prebuild + verify:platform-spec-git-meta removed.
# The platform-spec is fully detached from the website (normative content lives
# in site/spec-content, validated by spec-core). The website prebuild now only
# handles book nav + CLI version sync, which runs via the website's own build.

echo "==> verify root lockfile"
if [[ -f package.json && -f bun.lock ]]; then
  bun install --frozen-lockfile
else
  echo "skip root (no package.json or bun.lock)"
fi

echo "platform-smoke OK"
