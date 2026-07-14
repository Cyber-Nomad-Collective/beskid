#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
builder="${root}/scripts/ci/build-beskid-release-manifest.sh"
tmpdir="$(mktemp -d)"
trap 'rm -rf "${tmpdir}"' EXIT

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

commit='0123456789abcdef0123456789abcdef01234567'
linux_url='https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/v0.2.7/beskid-x86_64-unknown-linux-gnu.tar.gz'
macos_url='https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/v0.2.7/beskid-aarch64-apple-darwin.tar.gz'
linux_sha='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
macos_sha='bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

"${builder}" 0.2.7 "${commit}" "${tmpdir}/first.json" \
  "x86_64-unknown-linux-gnu|${linux_url}|${linux_sha}" \
  "aarch64-apple-darwin|${macos_url}|${macos_sha}"
"${builder}" 0.2.7 "${commit}" "${tmpdir}/second.json" \
  "aarch64-apple-darwin|${macos_url}|${macos_sha}" \
  "x86_64-unknown-linux-gnu|${linux_url}|${linux_sha}"

cmp "${tmpdir}/first.json" "${tmpdir}/second.json"

assert_equals '1' "$(jq -r '.schema' "${tmpdir}/first.json")" 'schema is 1'
assert_equals '0.2.7' "$(jq -r '.version' "${tmpdir}/first.json")" 'version is preserved'
assert_equals "${commit}" "$(jq -r '.commit' "${tmpdir}/first.json")" 'commit is preserved'
assert_equals \
  'aarch64-apple-darwin,x86_64-unknown-linux-gnu' \
  "$(jq -r '[.bundles[].target] | join(",")' "${tmpdir}/first.json")" \
  'bundles are sorted deterministically by target'
assert_equals "${linux_url}" \
  "$(jq -r '.bundles[] | select(.target == "x86_64-unknown-linux-gnu") | .url' "${tmpdir}/first.json")" \
  'bundle URL is preserved'
assert_equals "${macos_sha}" \
  "$(jq -r '.bundles[] | select(.target == "aarch64-apple-darwin") | .sha256' "${tmpdir}/first.json")" \
  'bundle SHA-256 is preserved'

printf 'Beskid release manifest builder tests OK\n'
