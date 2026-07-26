#!/usr/bin/env bash
# Contract: a release manifest and any promotion require every quality and image lane.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
workflow="${root}/.github/workflows/platform-delivery.yml"

manifest_block="$(sed -n '/^  manifest:/,/^  staging:/p' "${workflow}")"
for required in \
  'needs: [openspec, conformance, integration, security, shared-ui-nexus, image-site, image-auth, image-learn, image-platform-spec, image-tracker, image-nexus, image-pckg]' \
  "needs.openspec.result == 'success'" \
  "needs.conformance.result == 'success'" \
  "needs.integration.result == 'success'" \
  "needs.security.result == 'success'" \
  "needs.shared-ui-nexus.result == 'success'" \
  "needs.image-site.result == 'success'" \
  "needs.image-auth.result == 'success'" \
  "needs.image-learn.result == 'success'" \
  "needs.image-platform-spec.result == 'success'" \
  "needs.image-tracker.result == 'success'" \
  "needs.image-nexus.result == 'success'" \
  "needs.image-pckg.result == 'success'"; do
  if [[ "${manifest_block}" != *"${required}"* ]]; then
    echo "platform delivery manifest is missing fail-closed dependency: ${required}" >&2
    exit 1
  fi
done

echo "platform delivery fail-closed contract OK"
