#!/usr/bin/env bash
# Contract: a release manifest and any promotion require every quality and image lane.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
workflow="${root}/.github/workflows/platform-delivery.yml"
image_workflow="${root}/.github/workflows/reusable-image.yml"
manifest_workflow="${root}/.github/workflows/reusable-release-manifest.yml"
promotion_workflow="${root}/.github/workflows/reusable-promote.yml"
image_content="$(<"${image_workflow}")"
manifest_content="$(<"${manifest_workflow}")"
promotion_content="$(<"${promotion_workflow}")"

manifest_block="$(sed -n '/^  manifest:/,/^  production:/p' "${workflow}")"
for required in \
  'needs: [corelib, openspec, conformance, integration, security, shared-ui-nexus, image-site, image-learn, image-tracker, image-nexus, image-pckg]' \
  "needs.corelib.result == 'success'" \
  "needs.openspec.result == 'success'" \
  "needs.conformance.result == 'success'" \
  "needs.integration.result == 'success'" \
  "needs.security.result == 'success'" \
  "needs.shared-ui-nexus.result == 'success'" \
  "needs.image-site.result == 'success'" \
  "needs.image-learn.result == 'success'" \
  "needs.image-tracker.result == 'success'" \
  "needs.image-nexus.result == 'success'" \
  "needs.image-pckg.result == 'success'"; do
  if [[ "${manifest_block}" != *"${required}"* ]]; then
    echo "platform delivery manifest is missing fail-closed dependency: ${required}" >&2
    exit 1
  fi
done

if [[ "$(grep -c "github.event_name != 'workflow_dispatch' || !inputs.unstable" "${workflow}" || true)" != "0" ]]; then
  echo "platform delivery must not allow unstable runs to skip quality gates" >&2
  exit 1
fi

if [[ "${image_content}" != *'value: ${{ jobs.image.outputs.record }}'* ]] ||
   [[ "${image_content}" != *'id: record'* ]] ||
   [[ "${image_content}" == *'Upload image manifest record'* ]]; then
  echo "image lanes must return their manifest record as a reusable-workflow output" >&2
  exit 1
fi

if [[ "${manifest_content}" != *'records-jsonl:'* ]] ||
   [[ "${manifest_content}" != *'manifest-base64:'* ]] ||
   [[ "${manifest_content}" == *'actions/download-artifact'* ]] ||
   [[ "${manifest_content}" == *'actions/upload-artifact'* ]]; then
  echo "release manifest must use inline records and outputs, not artifact storage" >&2
  exit 1
fi

if [[ "${promotion_content}" != *'manifest-base64:'* ]] ||
   [[ "${promotion_content}" == *'actions/download-artifact'* ]]; then
  echo "promotion must consume the inline immutable manifest rather than an artifact" >&2
  exit 1
fi

production_block="$(sed -n '/^  production:/,$p' "${workflow}")"
if [[ "${promotion_content}" == *$'  actions: read'* ]] &&
   [[ "${production_block}" != *$'      actions: read'* ]]; then
  echo "production must grant the reusable promotion workflow its declared actions permission" >&2
  exit 1
fi

report_block="$(sed -n '/- name: Upload vulnerability report/,/- uses: sigstore\/cosign-installer/p' "${image_workflow}")"
if [[ "${report_block}" != *'continue-on-error: true'* ]]; then
	echo "vulnerability report upload must remain best-effort after a successful image push" >&2
	exit 1
fi

echo "platform delivery fail-closed contract OK"
