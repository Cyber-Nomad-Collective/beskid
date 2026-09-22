#!/usr/bin/env bash
# Run an offline compiler workspace check on the configured NixOS build box.
# The SSH alias stays in the developer's private SSH configuration; never add
# connection topology, keys, or credentials to this repository.
set -euo pipefail

if [[ "${1:-}" == "--help" ]]; then
  cat <<'USAGE'
Usage: BESKID_BUILDBOX_SSH=<ssh-alias> scripts/dev/run-nixos-buildbox.sh [beskid-root]

Streams a deterministic compiler/Corelib/BSOL source closure to the configured
build box, which performs `cargo check --locked --offline --workspace`.
USAGE
  exit 0
fi

source_root="${1:-.}"
source_root="$(cd "$source_root" && pwd)"
readonly source_root
readonly build_destination="${BESKID_BUILDBOX_SSH:?Set BESKID_BUILDBOX_SSH to a private SSH alias for the build box}"

if [[ ! -d "$source_root/compiler" || ! -d "$source_root/beskid_bsol" ]]; then
  echo "run-nixos-buildbox: expected compiler/ and beskid_bsol/ under $source_root" >&2
  exit 64
fi

# macOS bsdtar records Finder metadata unless these flags are present. Keep
# the archive stable and omit generated/cached agent material; Corelib's obj/
# directories are build caches, never compiler source.
archive_source() {
  tar --no-xattrs --no-mac-metadata \
    --exclude 'compiler/.git' \
    --exclude 'compiler/.gitnexus' \
    --exclude 'compiler/.claude' \
    --exclude 'compiler/.idea' \
    --exclude 'compiler/.opencode' \
    --exclude 'compiler/target' \
    --exclude 'compiler/corelib/**/obj' \
    --exclude 'beskid_bsol/.git' \
    --exclude '.DS_Store' \
    -cf - compiler beskid_bsol
}

(
  cd "$source_root"
  archive_source | gzip -n
) | ssh -o BatchMode=yes "$build_destination" 'beskid-build-v1 check'
