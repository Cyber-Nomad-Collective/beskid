#!/usr/bin/env bash
# Convert legacy NODE_AUTH_TOKEN Docker ARG usage into ephemeral BuildKit mounts.
set -euo pipefail

[[ $# -eq 2 ]] || { echo "usage: $0 <source-Dockerfile> <output-Dockerfile>" >&2; exit 2; }
source_file="$1"
output_file="$2"
[[ -f "${source_file}" ]] || { echo "Dockerfile not found: ${source_file}" >&2; exit 1; }

awk '
  /^[[:space:]]*ARG[[:space:]]+NODE_AUTH_TOKEN([=[:space:]]|$)/ { removed_arg++; next }
  /^[[:space:]]*ENV[[:space:]]+NODE_AUTH_TOKEN=\$\{NODE_AUTH_TOKEN\}[[:space:]]*$/ { removed_env++; next }
  /^[[:space:]]*RUN[[:space:]].*bun install/ {
    # Preserve any existing RUN flags (e.g. --mount=type=cache for the Bun
    # install cache) by inserting the ephemeral secret mount + token export
    # after the flag block but before the shell command.
    match($0, /^[[:space:]]*RUN[[:space:]]+/)
    head = substr($0, 1, RLENGTH)
    rest = substr($0, RLENGTH + 1)
    flags = ""
    while (match(rest, /^--[^[:space:]]+[[:space:]]+/)) {
      flags = flags substr(rest, 1, RLENGTH)
      rest = substr(rest, RLENGTH + 1)
    }
    print head flags "--mount=type=secret,id=NODE_AUTH_TOKEN,target=/run/secrets/NODE_AUTH_TOKEN,required=true export NODE_AUTH_TOKEN=\"$(cat /run/secrets/NODE_AUTH_TOKEN)\"; " rest
    mounted++
    next
  }
  { print }
  END {
    if (removed_arg != 1 || removed_env != 1 || mounted < 1) {
      print "unsafe Dockerfile token pattern: expected one ARG, one ENV, and at least one bun install RUN" > "/dev/stderr"
      exit 1
    }
  }
' "${source_file}" >"${output_file}"

if rg -n 'ARG[[:space:]]+NODE_AUTH_TOKEN|ENV[[:space:]]+NODE_AUTH_TOKEN' "${output_file}"; then
  echo "generated Dockerfile still persists NODE_AUTH_TOKEN" >&2
  exit 1
fi

echo "secure Dockerfile: ${output_file}"

