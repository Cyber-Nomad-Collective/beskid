#!/usr/bin/env bash
# Move release payloads between jobs and workflows through a durable prerelease.
# Each workflow attempt owns a unique tag, while the final immutable and rolling
# releases remain the public distribution surface.
# Usage:
#   github-release-handoff.sh init <repo> <tag> <target-sha> <title>
#   github-release-handoff.sh upload <repo> <tag> <file>...
#   github-release-handoff.sh download <repo> <tag> <directory>
set -euo pipefail

operation="${1:?operation}"
repo="${2:?repository}"
tag="${3:?tag}"
shift 3

case "${operation}" in
  init)
    target="${1:?target SHA}"
    title="${2:?title}"
    if existing_target="$(gh release view "${tag}" --repo "${repo}" --json targetCommitish --jq .targetCommitish 2>/dev/null)"; then
      if [[ "${existing_target}" != "${target}" ]]; then
        echo "handoff release ${tag} targets ${existing_target}, expected ${target}" >&2
        exit 1
      fi
      echo "Reusing handoff release ${tag} at ${target}."
    else
      gh release create "${tag}" --repo "${repo}" --target "${target}" --prerelease --latest=false \
        --title "${title}" --notes 'Retry-safe compiler release handoff. Final assets are published on immutable and rolling release streams.'
    fi
    ;;
  upload)
    [[ "$#" -gt 0 ]] || { echo 'at least one handoff asset is required' >&2; exit 1; }
    for asset in "$@"; do
      [[ -f "${asset}" ]] || { echo "handoff asset is missing: ${asset}" >&2; exit 1; }
    done
    gh release upload "${tag}" --repo "${repo}" --clobber "$@"
    ;;
  download)
    directory="${1:?download directory}"
    mkdir -p "${directory}"
    gh release download "${tag}" --repo "${repo}" --dir "${directory}" --clobber
    ;;
  *)
    echo "unsupported GitHub Release handoff operation: ${operation}" >&2
    exit 2
    ;;
esac
