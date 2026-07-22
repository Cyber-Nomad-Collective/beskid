#!/usr/bin/env bash
# Contract for the single automatic staging -> production promotion chain.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
workflow="${root}/.github/workflows/platform-delivery.yml"

production_block="$(sed -n '/^  production:/,$p' "${workflow}")"
for required in \
  'needs: [manifest, staging]' \
  "if: \${{ !cancelled() && needs.manifest.result == 'success' && needs.staging.result == 'success' }}" \
  'environment: production' \
  "manifest-run-id: \${{ format('{0}', github.run_id) }}" \
  'apply: true'; do
  if [[ "${production_block}" != *"${required}"* ]]; then
    echo "automatic production promotion is missing required contract: ${required}" >&2
    exit 1
  fi
done

if [[ -e "${root}/.github/workflows/promote-production.yml" ]]; then
  echo "manual production promotion workflow must be removed" >&2
  exit 1
fi

echo "automatic production promotion contract OK"
