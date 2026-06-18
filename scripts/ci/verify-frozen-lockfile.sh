#!/usr/bin/env bash
# Verify that bun.lock matches package.json for one or more directories.
#
# Extracts the per-image lockfile verification that was inline in
# .github/workflows/container-images.yml (and restores the pre-Dagger
# scripts/ci/verify-frozen-lockfile.sh). Each given directory with both a
# package.json and a bun.lock is checked with `bun install --frozen-lockfile`;
# directories missing either file are skipped.
#
# Usage: verify-frozen-lockfile.sh <dir>[,<dir>...] [<dir>[,<dir>...] ...]
# Example: verify-frozen-lockfile.sh "beskid_nexus/gitnexus,beskid_nexus/gitnexus-web"
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}"

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <dir>[,<dir>...] [<dir>[,<dir>...] ...]" >&2
  exit 1
fi

# Collect comma-separated dir lists from all args into a flat list.
dirs=()
for arg in "$@"; do
  IFS=',' read -r -a parts <<< "$arg"
  dirs+=("${parts[@]}")
done

for d in "${dirs[@]}"; do
  if [[ -f "$d/package.json" && -f "$d/bun.lock" ]]; then
    echo "==> verify frozen lockfile: $d"
    (cd "$d" && bun install --frozen-lockfile >/dev/null)
  else
    echo "skip $d (no package.json or bun.lock)"
  fi
done

echo "All lockfiles match package.json"
