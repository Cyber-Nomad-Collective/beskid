#!/usr/bin/env bash
# Init beskid_infra for Dagger CI (module lives in beskid_infra/dagger).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

bash ./scripts/ci/init-submodules.sh beskid_infra

if [[ ! -f beskid_infra/dagger/package.json ]]; then
  echo "beskid_infra/dagger missing after submodule init" >&2
  exit 1
fi
