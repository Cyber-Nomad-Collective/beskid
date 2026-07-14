#!/usr/bin/env bash
# Render a Compose file with exact OCI digests from a validated release manifest.
set -euo pipefail

[[ $# -eq 3 ]] || { echo "usage: $0 <manifest.json> <compose.yml> <output.yml>" >&2; exit 2; }
manifest="$1"
compose="$2"
output="$3"
script_dir="$(cd "$(dirname "$0")" && pwd)"

"${script_dir}/validate-release-manifest.sh" "${manifest}"
[[ -f "${compose}" ]] || { echo "compose file not found: ${compose}" >&2; exit 1; }

map_file="$(mktemp)"
counts_file="$(mktemp)"
trap 'rm -f "${map_file}" "${counts_file}"' EXIT
jq -r '.images[] | [.repository, (.repository + "@" + .digest)] | @tsv' "${manifest}" >"${map_file}"

awk -v mappings="${map_file}" -v counts="${counts_file}" '
  BEGIN {
    while ((getline line < mappings) > 0) {
      split(line, fields, "\t")
      exact[fields[1]] = fields[2]
      seen[fields[1]] = 0
    }
    close(mappings)
  }
  {
    rendered = $0
    if ($0 ~ /^[[:space:]]*image:[[:space:]]*/) {
      indent = $0
      sub(/image:.*/, "", indent)
      value = $0
      sub(/^[[:space:]]*image:[[:space:]]*/, "", value)
      for (repository in exact) {
        if (index(value, repository) == 1) {
          rendered = indent "image: " exact[repository]
          seen[repository]++
        }
      }
    }
    print rendered
  }
  END {
    for (repository in seen) print repository "\t" seen[repository] > counts
  }
' "${compose}" >"${output}"

while IFS=$'\t' read -r repository count; do
  [[ "${count}" == "1" ]] || {
    echo "manifest image ${repository} matched ${count} Compose services; expected exactly one" >&2
    exit 1
  }
done <"${counts_file}"

if rg -n 'ghcr\.io/cyber-nomad-collective/beskid-[^@[:space:]]+:' "${output}"; then
  echo "mutable Beskid image reference remains in rendered Compose" >&2
  exit 1
fi

echo "rendered immutable Compose: ${output}"
