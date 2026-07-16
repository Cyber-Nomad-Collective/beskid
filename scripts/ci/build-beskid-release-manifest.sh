#!/usr/bin/env bash
# Build the schema-1 bundle manifest consumed by beskid_up.
set -euo pipefail

usage() {
  echo "usage: $0 <version> <commit> <output.json> <target|url|sha256> [...]" >&2
}

(( $# >= 4 )) || { usage; exit 2; }
version="$1"
commit="$2"
output="$3"
shift 3

[[ "${version}" =~ ^[0-9]+\.[0-9]+\.[0-9]+([-.][0-9A-Za-z.-]+)?$ ]] || {
  echo "version must be SemVer: ${version}" >&2
  exit 1
}
[[ "${commit}" =~ ^[0-9a-f]{40}$ ]] || {
  echo "commit must be a 40-character lowercase SHA: ${commit}" >&2
  exit 1
}

records="$(mktemp)"
trap 'rm -f "${records}"' EXIT

for record in "$@"; do
  IFS='|' read -r target url sha256 extra <<<"${record}"
  [[ -n "${target}" && -n "${url}" && -n "${sha256}" && -z "${extra:-}" ]] || {
    echo "record must be target|url|sha256: ${record}" >&2
    exit 1
  }
  [[ "${sha256}" =~ ^[0-9a-fA-F]{64}$ ]] || {
    echo "record checksum must be SHA-256: ${target}" >&2
    exit 1
  }
  jq -n --arg target "${target}" --arg url "${url}" --arg sha256 "${sha256}" \
    '{target: $target, url: $url, sha256: $sha256}' >>"${records}"
done

bundles="$(jq -s 'sort_by(.target)' "${records}")"
if [[ "$(jq '[.[].target] | unique | length' <<<"${bundles}")" != "$(jq 'length' <<<"${bundles}")" ]]; then
  echo 'bundle targets must be unique' >&2
  exit 1
fi

jq -n \
  --arg version "${version}" \
  --arg commit "${commit}" \
  --argjson bundles "${bundles}" \
  '{schema: 1, version: $version, commit: $commit, bundles: $bundles}' >"${output}"
