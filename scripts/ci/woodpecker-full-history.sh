#!/usr/bin/env bash
# Give the checkout full commit history before any step resolves the release candidate or walks
# ancestry. Woodpecker's git plugin clones with --depth=1 (and --filter=tree:0) even when depth: 0 is
# set, so release-user-observation.mjs and woodpecker-fetch-handoffs.sh would see a one-commit history
# and reject every candidate older than HEAD. Trees are refetched with the commits; blobs stay lazy.
#
# Usage: woodpecker-full-history.sh [<repository>]   (default: the current directory)
set -euo pipefail
repo="${1:-.}"
if [[ "$(git -C "$repo" rev-parse --is-shallow-repository)" == true ]]; then
  git -C "$repo" fetch --quiet --unshallow --refetch --filter=blob:none --no-tags origin
fi
