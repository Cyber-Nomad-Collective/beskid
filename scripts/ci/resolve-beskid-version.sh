#!/usr/bin/env bash
# Mint the canonical globally distributed Beskid release SemVer.
#
# Only a release build of main may mint this value. The supplied build number
# is the sole build identity, making the emitted version exactly
# 0.4.<build-number>; tags, commit counts, and crate manifests never
# influence a distributed version.
#
# Usage: resolve-beskid-version.sh <build-number> [stable|unstable]
# Env fallback: RELEASE_BUILD_NUMBER, RELEASE_CHANNEL, RELEASE_SOURCE_REF
# Prints MAJOR.MINOR.PATCH for stable or MAJOR.MINOR.PATCH-unstable.
set -euo pipefail

build_number="${1:-${RELEASE_BUILD_NUMBER:-}}"
release_channel="${2:-${RELEASE_CHANNEL:-stable}}"
source_ref="${RELEASE_SOURCE_REF:-refs/heads/main}"

if [[ "${source_ref}" != "refs/heads/main" ]]; then
  echo "Global release version may only be minted from refs/heads/main (got ${source_ref:-<empty>})" >&2
  exit 1
fi

if [[ ! "${build_number}" =~ ^(0|[1-9][0-9]*)$ ]]; then
  echo "build number must be a canonical non-negative integer for the global release version" >&2
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

printf '0.4.%s%s' "${build_number}" "${suffix}"
