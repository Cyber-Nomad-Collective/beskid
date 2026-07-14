#!/usr/bin/env bash
# Keyless signing hook. The caller must provision cosign and id-token: write.
set -euo pipefail

[[ $# -eq 1 ]] || { echo "usage: $0 <repository@sha256:digest>" >&2; exit 2; }
command -v cosign >/dev/null 2>&1 || {
  echo "cosign is required when image signing is enabled" >&2
  exit 1
}
COSIGN_EXPERIMENTAL=1 cosign sign --yes "$1"

