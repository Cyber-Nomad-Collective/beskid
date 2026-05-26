#!/usr/bin/env bash
# Local pre-push checks for aggregate web CI (docs site + root workspace install).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "==> Init beskid_web_common submodule"
git submodule update --init beskid_web_common

echo "==> bun install (root workspace)"
bun install --frozen-lockfile

echo "==> site/website prebuild"
(
	cd site/website
	bun run prebuild
)

echo "==> site/website platform-spec git-meta verify"
(
	cd site/website
	bun run verify:platform-spec-git-meta -- --require-git
)

echo "validate-ci-local: OK"
