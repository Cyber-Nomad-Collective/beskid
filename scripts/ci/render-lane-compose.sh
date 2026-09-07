#!/usr/bin/env bash
# Apply lane-owned Compose identity and persistent-volume bindings after image
# digests have been rendered. Production adopts known external Docker volumes;
# staging intentionally retains project-scoped volumes from the shared template.
set -euo pipefail

[[ $# -eq 3 ]] || { echo "usage: $0 <staging|production> <compose.yml> <output.yml>" >&2; exit 2; }
lane="$1"
compose="$2"
output="$3"
case "${lane}" in staging|production) ;; *) echo "lane must be staging or production" >&2; exit 2 ;; esac
[[ -f "${compose}" ]] || { echo "compose file not found: ${compose}" >&2; exit 1; }

script_dir="$(cd "$(dirname "$0")" && pwd)"
lane_config="${script_dir}/../../beskid_infra/config/coolify-${lane}.json"
[[ -f "${lane_config}" ]] || { echo "lane configuration not found: ${lane_config}" >&2; exit 1; }

volume_map="$(mktemp)"
seen_map="$(mktemp)"
trap 'rm -f "${volume_map}" "${seen_map}"' EXIT

jq -e '
  (.external_volumes // {}) as $volumes
  | ($volumes | type) == "object"
  and all($volumes | to_entries[];
    (.key | test("^[A-Za-z0-9._-]+$"))
    and (.value | type == "string" and test("^[A-Za-z0-9._-]+$") and length > 0))
' "${lane_config}" >/dev/null || {
  echo "invalid external_volumes contract in ${lane_config}" >&2
  exit 1
}
jq -r '(.external_volumes // {}) | to_entries[] | [.key, .value] | @tsv' \
  "${lane_config}" >"${volume_map}"

awk -v lane="${lane}" -v mappings="${volume_map}" -v seen_file="${seen_map}" '
  BEGIN {
    while ((getline line < mappings) > 0) {
      split(line, fields, "\t")
      external[fields[1]] = fields[2]
      seen[fields[1]] = 0
    }
    close(mappings)
    in_volumes = 0
    suppress_body = 0
  }
  !renamed && /^name:[[:space:]]*/ {
    print "name: beskid-platform-" lane
    renamed = 1
    next
  }
  /^volumes:[[:space:]]*$/ {
    in_volumes = 1
    suppress_body = 0
    print
    next
  }
  in_volumes && /^  [A-Za-z0-9._-]+:[[:space:]]*$/ {
    key = $0
    sub(/^  /, "", key)
    sub(/:[[:space:]]*$/, "", key)
    print
    suppress_body = 0
    if (key in external) {
      print "    name: " external[key]
      print "    external: true"
      seen[key]++
      suppress_body = 1
    }
    next
  }
  in_volumes && suppress_body && /^    / { next }
  { print }
  END {
    if (!renamed) {
      print "Compose project name is missing" > "/dev/stderr"
      exit 1
    }
    for (key in external) print key "\t" seen[key] > seen_file
  }
' "${compose}" >"${output}"

while IFS=$'\t' read -r key count; do
  [[ "${count}" == "1" ]] || {
    echo "external volume ${key} matched ${count} Compose volume declarations; expected one" >&2
    exit 1
  }
done <"${seen_map}"

echo "rendered ${lane} Compose: ${output}"
