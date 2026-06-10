#!/usr/bin/env bash
# Rust quality gate for compiler/ (Dagger: clippy + workspace tests).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

bash ./scripts/ci/init-compiler-submodule.sh
bash ./scripts/ci/init-beskid-infra-submodule.sh

DAGGER_VERSION="0.21.0"
if [[ -f beskid_infra/dagger/.dagger-version ]]; then
  DAGGER_VERSION="$(tr -d '[:space:]' < beskid_infra/dagger/.dagger-version)"
fi

echo "==> Install Dagger module deps"
(
  cd beskid_infra/dagger
  npm ci --include=dev
)

if ! command -v rg >/dev/null 2>&1; then
  echo "==> Install ripgrep (parity script)"
  sudo apt-get update -qq && sudo apt-get install -y ripgrep
fi

echo "==> corelib_tests bproj ↔ typecheck parity"
bash ./compiler/scripts/verify-corelib-tests-parity.sh

echo "==> compiler-rust-gate (Dagger ${DAGGER_VERSION})"
dagger -m beskid_infra/dagger call compiler-rust-gate --source=./compiler
