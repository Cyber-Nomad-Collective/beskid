#!/usr/bin/env bash
# Local pre-push checks for aggregate web CI (docs site + root workspace install).
# Delegates to Dagger platform-smoke.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "==> Init beskid_infra submodule"
git submodule update --init beskid_infra

if ! command -v dagger >/dev/null 2>&1; then
  echo "dagger CLI is required (see beskid_infra/dagger/README.md)" >&2
  exit 1
fi

echo "==> Install Dagger module deps"
(
  cd beskid_infra/dagger
  npm ci --include=dev
)

echo "==> platform-smoke (Dagger)"
dagger -m beskid_infra/dagger call platform-smoke --source=.

echo "validate-ci-local: OK"
