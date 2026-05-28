#!/usr/bin/env bash
# Keep arcusis/coolify out of .terraform.lock.hcl (installed via filesystem mirror; non-reproducible hashes).
set -euo pipefail

for lock in "$@"; do
  [[ -f "${lock}" ]] || continue
  if ! grep -q 'registry.terraform.io/arcusis/coolify' "${lock}"; then
    continue
  fi
  echo "Removing arcusis/coolify from ${lock} (use mirror install only)."
  awk '
    /^provider "registry\.terraform\.io\/arcusis\/coolify"/ { skip=1; next }
    skip && /^}$/ { skip=0; next }
    skip { next }
    { print }
  ' "${lock}" > "${lock}.tmp"
  mv "${lock}.tmp" "${lock}"
done
