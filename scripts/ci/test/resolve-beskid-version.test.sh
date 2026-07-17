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
  '0.2.7' \
  "$(GITHUB_REF=refs/tags/v0.2.7 GITHUB_REF_NAME=v0.2.7 bash "${resolver}")" \
  'a SemVer tag resolves without its v prefix'

assert_fails \
  'a non-SemVer tag is rejected' \
  env GITHUB_REF=refs/tags/v0.2 GITHUB_REF_NAME=v0.2 bash "${resolver}"

assert_equals \
  '0.2.7' \
  "$(GITHUB_REF=refs/tags/v0.2.7 GITHUB_REF_NAME=v0.2.7 bash "${legacy_resolver}")" \
  'the legacy CLI resolver delegates to the canonical resolver'

printf 'Beskid version resolver tests OK\n'
