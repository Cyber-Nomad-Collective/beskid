#!/usr/bin/env bash
# Init selected git submodules in CI (shallow).
# Usage: ./scripts/ci/init-submodules.sh [path ...]
set -euo pipefail

if [[ $# -eq 0 ]]; then
  echo "Usage: init-submodules.sh <submodule-path> ..." >&2
  exit 1
fi

git -c protocol.version=2 submodule update --init --depth 1 "$@"
