#!/usr/bin/env bash
# Contract for the automatic production-only Watchtower release chain.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
workflow="${root}/.github/workflows/platform-delivery.yml"
promotion="${root}/.github/workflows/reusable-promote.yml"

production_block="$(sed -n '/^  production:/,$p' "${workflow}")"
for required in \
  'needs: manifest' \
  "if: \${{ !cancelled() && needs.manifest.result == 'success' }}" \
  "manifest-run-id: \${{ format('{0}', github.run_id) }}" \
  'apply: true'; do
  [[ "${production_block}" == *"${required}"* ]] || {
    echo "production Watchtower chain is missing: ${required}" >&2
    exit 1
  }
done

if rg -qi 'coolify|staging' "${workflow}" "${promotion}"; then
  echo "production delivery retains a retired staging or Coolify path" >&2
  exit 1
fi
rg -Fq 'BESKID_SMOKE_RETRIES' "${promotion}"
rg -Fq './scripts/ci/post-deploy-smoke.sh production' "${promotion}"

echo "automatic production Watchtower contract OK"
