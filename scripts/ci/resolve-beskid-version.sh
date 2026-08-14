#!/usr/bin/env bash
# Mint the canonical globally distributed Beskid release SemVer.
#
# Only the Compiler workflow running on main may mint this value. The GitHub
# run number is the sole build identity, making the emitted version exactly
# 0.4.<GITHUB_RUN_NUMBER>; tags, commit counts, and crate manifests never
# influence a distributed version.
#
# Usage: resolve-beskid-version.sh
# Env: GITHUB_REF, GITHUB_RUN_NUMBER
# Env: RELEASE_CHANNEL (stable by default, or unstable)
# Prints MAJOR.MINOR.PATCH for stable or MAJOR.MINOR.PATCH-unstable.
set -euo pipefail

github_ref="${GITHUB_REF:-}"
github_run_number="${GITHUB_RUN_NUMBER:-}"
release_channel="${RELEASE_CHANNEL:-stable}"

if [[ "${github_ref}" != "refs/heads/main" ]]; then
  echo "Global release version may only be minted from refs/heads/main (got ${github_ref:-<empty>})" >&2
  exit 1
fi

if [[ ! "${github_run_number}" =~ ^(0|[1-9][0-9]*)$ ]]; then
  echo "GITHUB_RUN_NUMBER must be a canonical non-negative integer for the global release version" >&2
  exit 1
fi

case "${release_channel}" in
  stable) suffix='' ;;
  unstable) suffix='-unstable' ;;
  *)
    echo "RELEASE_CHANNEL must be stable or unstable (got ${release_channel})" >&2
    exit 1
    ;;
esac

printf '0.4.%s%s' "${github_run_number}" "${suffix}"
