#!/usr/bin/env bash
# Rust quality gate for compiler/ (Dagger: clippy + workspace tests).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

bash ./scripts/ci/init-compiler-submodule.sh

DAGGER_VERSION="$(tr -d '[:space:]' < beskid_infra/dagger/.dagger-version)"

echo "==> Install Dagger module deps"
(
  cd beskid_infra/dagger
  npm ci
)

echo "==> compiler-rust-gate (Dagger ${DAGGER_VERSION})"
dagger -m beskid_infra/dagger call compiler-rust-gate --source=.
