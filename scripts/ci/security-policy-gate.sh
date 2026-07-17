#!/usr/bin/env bash
# Offline CI supply-chain policy for the authoritative delivery path.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}"

authoritative=(
  .github/workflows/platform-delivery.yml
  .github/workflows/promote-production.yml
  .github/workflows/reusable-image.yml
  .github/workflows/reusable-promote.yml
  .github/workflows/reusable-quality.yml
  .github/workflows/reusable-release-manifest.yml
)

for workflow in "${authoritative[@]}"; do
  [[ -f "${workflow}" ]] || { echo "missing authoritative workflow: ${workflow}" >&2; exit 1; }
done

# Project delivery is orchestrated only from the superrepo. Inspect its tracked
# paths rather than the working tree: initialized submodules are gitlinks here,
# and their upstream workflow metadata is not an authoritative Beskid lane.
# This keeps the local gate identical to the non-recursive GitHub checkout.
nested_workflows="$(git ls-files -- \
  site beskid_tracker beskid_nexus pckg compiler/corelib beskid_bsol \
  | rg '/\.github/workflows/' \
  | rg -v '^compiler/vendor/' || true)"
if [[ -n "${nested_workflows}" ]]; then
  printf 'nested project workflows bypass the authoritative pipeline:\n%s\n' "${nested_workflows}" >&2
  exit 1
fi

# Local workflow/action references are trusted from the checked-out commit.
# Every third-party action must use a full commit SHA.
if rg -n '^\s*uses:\s*[^./][^@[:space:]]+@(v[0-9]|main|master|stable|latest)([[:space:]]|$)' \
  "${authoritative[@]}"; then
  echo "authoritative workflows contain a floating third-party action" >&2
  exit 1
fi

if rg -n 'build-args:.*NODE_AUTH_TOKEN|NODE_AUTH_TOKEN=.*build-arg' \
  .github/workflows/reusable-image.yml; then
  echo "package credentials must use BuildKit secret mounts, not build args" >&2
  exit 1
fi

if rg -n 'ghcr\.io/cyber-nomad-collective/beskid-[^@[:space:]]+:\$\{[^}]+:-' \
  beskid_infra/compose; then
  echo "mutable Beskid image defaults remain in deployment templates" >&2
  exit 1
fi

for script in scripts/ci/*.sh scripts/ci/test/*.sh; do
  bash -n "${script}"
done

echo "CI security policy OK"
