#!/usr/bin/env bash
# Render a Compose file with exact OCI digests from a validated release manifest.
#
# Every image the manifest delivers is pinned to its immutable digest and must
# match exactly one Compose service. A Beskid image that a Compose service
# references but the manifest did NOT deliver is resolved by service class:
#   - core service (no `profiles:`)      -> hard error. The platform cannot ship
#                                            without an immutable core image.
#   - optional service (has `profiles:`) -> the service block is dropped from the
#                                            rendered Compose so an undelivered
#                                            optional lane never deploys a mutable
#                                            tag. Operators can only enable a
#                                            profile for an image that was actually
#                                            delivered and pinned.
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
    beskid_prefix = "ghcr.io/cyber-nomad-collective/beskid-"
    in_services = 0
    buffering = 0
  }

  # Repository portion of an `image:` value, without tag, digest or expansion.
  function repo_of(value,   repo) {
    repo = value
    sub(/^[[:space:]]*image:[[:space:]]*/, "", repo)
    sub(/[@:].*$/, "", repo)
    return repo
  }

  # Emit or discard the buffered service block, pinning its image when delivered.
  function flush_block(   i) {
    if (block_repo != "" && index(block_repo, beskid_prefix) == 1) {
      if (block_repo in exact) {
        seen[block_repo]++
        block_lines[block_image_idx] = block_image_indent "image: " exact[block_repo]
      } else if (block_has_profiles) {
        # Optional lane the manifest did not deliver: omit it entirely.
        reset_block()
        return
      } else {
        print "core Compose service \"" block_name "\" references undelivered image " block_repo > "/dev/stderr"
        exit 1
      }
    }
    for (i = 0; i < block_n; i++) print block_lines[i]
    reset_block()
  }

  function reset_block() {
    block_n = 0; block_repo = ""; block_has_profiles = 0; block_image_idx = -1; block_name = ""
  }

  /^services:[[:space:]]*$/ { in_services = 1; print; next }

  # A zero-indent line closes the services section and any open block.
  in_services && /^[^[:space:]]/ {
    if (buffering) { flush_block(); buffering = 0 }
    in_services = 0
    print
    next
  }

  # Service header (exactly two leading spaces).
  in_services && /^  [A-Za-z0-9._-]+:[[:space:]]*$/ {
    if (buffering) flush_block()
    buffering = 1
    reset_block()
    block_name = $0; sub(/^[[:space:]]*/, "", block_name); sub(/:.*$/, "", block_name)
    block_lines[block_n++] = $0
    next
  }

  # Body lines of a buffered service block.
  in_services && buffering {
    if ($0 ~ /^    profiles:/) block_has_profiles = 1
    if ($0 ~ /^[[:space:]]*image:[[:space:]]*/ && block_image_idx < 0) {
      block_repo = repo_of($0)
      block_image_idx = block_n
      block_image_indent = $0; sub(/image:.*/, "", block_image_indent)
    }
    block_lines[block_n++] = $0
    next
  }

  { print }

  END {
    if (buffering) flush_block()
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
