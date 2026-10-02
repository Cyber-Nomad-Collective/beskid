#!/usr/bin/env bash
# Run a native release command only for an exact stable vX.Y.Z tag.
set -euo pipefail

tag="${1:?tag}"
shift
root="$(cd "$(dirname "$0")/../.." && pwd)"

if [[ "${tag#v}" == "${tag}" ]] || ! node "${root}/scripts/ci/release-version.mjs" "${tag#v}" --stable-only >/dev/null; then
  echo "Ignoring non-release tag ${tag}"
  exit 1
fi

if [[ "${1:-}" == "--check-only" ]]; then
  exit 0
fi

[[ $# -gt 0 ]] || { echo 'release command is required' >&2; exit 2; }
"$@"
