#!/usr/bin/env bash
# Contract: immutable release identity travels through same-run outputs, never Actions artifacts.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
image="${root}/.github/workflows/reusable-image.yml"
manifest="${root}/.github/workflows/reusable-release-manifest.yml"
platform="${root}/.github/workflows/platform-delivery.yml"
promote="${root}/.github/workflows/reusable-promote.yml"

for workflow in "${image}" "${manifest}" "${promote}"; do
  if rg -q 'actions/(upload|download)-artifact@' "${workflow}"; then
    echo "authoritative release transport still uses Actions artifacts: ${workflow}" >&2
    exit 1
  fi
done

for required in \
  'image-record:' \
  'value: ${{ jobs.image.outputs.image-record }}' \
  'image-record: ${{ steps.record.outputs.image-record }}' \
  'id: record'; do
  rg -Fq "${required}" "${image}" || {
    echo "reusable image workflow is missing output contract: ${required}" >&2
    exit 1
  }
done

for lane in site auth learn tracker nexus pckg; do
  rg -Fq "${lane}-record:" "${manifest}" || {
    echo "manifest workflow is missing required ${lane} record input" >&2
    exit 1
  }
  rg -Fq "${lane}-record: \${{ needs.image-${lane}.outputs.image-record }}" "${platform}" || {
    echo "platform manifest does not consume image-${lane} output" >&2
    exit 1
  }
done

rg -Fq 'select(.name == $name and .repository == ("ghcr.io/cyber-nomad-collective/" + $name))' "${manifest}" || {
  echo 'manifest workflow must retain each validated image record rather than emit a boolean' >&2
  exit 1
}

if rg -q 'image-platform-spec|beskid-platform-spec|platform-spec-record' "${platform}" "${manifest}"; then
  echo "retired platform-spec image remains in delivery orchestration" >&2
  exit 1
fi

for required in \
  'manifest-base64: ${{ needs.manifest.outputs.manifest-base64 }}' \
  'manifest-sha256: ${{ needs.manifest.outputs.manifest-sha256 }}'; do
  count="$(rg -F -c "${required}" "${platform}")"
  [[ "${count}" == 2 ]] || {
    echo "staging and production must both consume ${required}; found ${count}" >&2
    exit 1
  }
done

for required in \
  'manifest-base64:' \
  'manifest-sha256:' \
  'Verify release manifest output checksum'; do
  rg -Fq "${required}" "${promote}" || {
    echo "promotion workflow is missing output verification contract: ${required}" >&2
    exit 1
  }
done

checksum_line="$(rg -n 'Verify release manifest output checksum' "${promote}" | cut -d: -f1)"
secret_line="$(rg -n 'sync-runtime-env.sh' "${promote}" | cut -d: -f1)"
[[ -n "${checksum_line}" && -n "${secret_line}" && "${checksum_line}" -lt "${secret_line}" ]] || {
  echo "manifest checksum must be verified before secrets and Coolify mutation" >&2
  exit 1
}

publish_block="$(sed -n '/^  publish-packages:/,$p' "${platform}")"
[[ "${publish_block}" == *'needs: production'* ]] || {
  echo "package publication must remain after production" >&2
  exit 1
}

echo "zero-artifact delivery contract OK"
