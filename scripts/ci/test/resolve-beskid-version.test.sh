#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
resolver="${root}/scripts/ci/resolve-beskid-version.sh"

assert_equals() {
  local expected="$1"
  local actual="$2"
  local description="$3"

  if [[ "${actual}" != "${expected}" ]]; then
    printf 'FAIL: %s\nexpected: %s\nactual:   %s\n' \
      "${description}" "${expected}" "${actual}" >&2
    exit 1
  fi
}

assert_fails() {
  local description="$1"
  shift

  if "$@" >/dev/null 2>&1; then
    printf 'FAIL: %s unexpectedly succeeded\n' "${description}" >&2
    exit 1
  fi
}

assert_equals \
  '0.4.481' \
  "$(bash "${resolver}" 481 stable)" \
  'main mints the global version directly from its supplied build number'

assert_equals \
  '0.4.481-unstable' \
  "$(bash "${resolver}" 481 unstable)" \
  'unstable appends exactly the channel prerelease suffix'

assert_fails \
  'main requires a build number' \
  env -u RELEASE_BUILD_NUMBER bash "${resolver}"

assert_fails \
  'a non-numeric build number is rejected' \
  bash "${resolver}" 481a

assert_fails \
  'a leading-zero build number is rejected to preserve SemVer validity' \
  bash "${resolver}" 00

assert_fails \
  'a tag cannot mint a distributed version' \
  env RELEASE_SOURCE_REF=refs/tags/v0.4.481 bash "${resolver}" 481

assert_fails \
  'a feature branch cannot mint a distributed version' \
  env RELEASE_SOURCE_REF=refs/heads/feature bash "${resolver}" 481

assert_fails \
  'an unsupported release channel is rejected' \
  bash "${resolver}" 481 preview

printf 'Beskid version resolver tests OK\n'
