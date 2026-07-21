#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
resolver="${root}/scripts/ci/resolve-beskid-version.sh"
legacy_resolver="${root}/scripts/ci/compute-cli-version.sh"

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
  "$(GITHUB_REF=refs/heads/main GITHUB_RUN_NUMBER=481 bash "${resolver}")" \
  'main mints the global version directly from its GitHub run number'

assert_equals \
  '0.4.481' \
  "$(GITHUB_REF=refs/heads/main GITHUB_RUN_NUMBER=481 bash "${legacy_resolver}")" \
  'the legacy CLI resolver delegates to the canonical global resolver'

assert_fails \
  'main requires a GitHub run number' \
  env -u GITHUB_RUN_NUMBER GITHUB_REF=refs/heads/main bash "${resolver}"

assert_fails \
  'a non-numeric GitHub run number is rejected' \
  env GITHUB_REF=refs/heads/main GITHUB_RUN_NUMBER=481a bash "${resolver}"

assert_fails \
  'a leading-zero GitHub run number is rejected to preserve SemVer validity' \
  env GITHUB_REF=refs/heads/main GITHUB_RUN_NUMBER=00 bash "${resolver}"

assert_fails \
  'a tag cannot mint a distributed version' \
  env GITHUB_REF=refs/tags/v0.4.481 GITHUB_REF_NAME=v0.4.481 GITHUB_RUN_NUMBER=481 bash "${resolver}"

assert_fails \
  'a feature branch cannot mint a distributed version' \
  env GITHUB_REF=refs/heads/feature GITHUB_RUN_NUMBER=481 bash "${resolver}"

printf 'Beskid version resolver tests OK\n'
