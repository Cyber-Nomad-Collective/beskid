#!/usr/bin/env bash
# Hydrate the trusted root checkout without changing its checked-out commit.
set -euo pipefail

root="${1:-$(cd "$(dirname "$0")/../.." && pwd)}"
official_origin="https://github.com/Cyber-Nomad-Collective/beskid.git"
origin="$(git -C "${root}" config --get remote.origin.url || true)"
[[ "${origin%/}" == "${official_origin}" ]] || { echo 'source origin is not the official Beskid repository' >&2; exit 2; }
head_before="$(git -C "${root}" rev-parse HEAD)"
if [[ "$(git -C "${root}" rev-parse --is-shallow-repository)" == true ]]; then
  git -C "${root}" fetch --unshallow --no-tags origin
fi
[[ "$(git -C "${root}" rev-parse HEAD)" == "${head_before}" ]] || { echo 'history hydration changed the checked-out HEAD' >&2; exit 2; }
if [[ -n "${CI_COMMIT_SHA:-}" ]]; then
  [[ "${CI_COMMIT_SHA}" == "${head_before}" ]] || { echo 'pipeline source does not match checkout' >&2; exit 2; }
fi
