#!/usr/bin/env bash
# Contract: release identity travels through same-run outputs or GitHub Releases,
# never GitHub Actions artifacts.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
image="${root}/.github/workflows/reusable-image.yml"
manifest="${root}/.github/workflows/reusable-release-manifest.yml"
platform="${root}/.github/workflows/platform-delivery.yml"
promote="${root}/.github/workflows/reusable-promote.yml"
compiler="${root}/.github/workflows/compiler.yml"
compiler_release="${root}/.github/workflows/compiler-release.yml"
handoff_cleanup="${root}/.github/workflows/compiler-handoff-cleanup.yml"
tracker_delivery="${root}/.github/workflows/tracker-platform-delivery.yml"
open_vsx="${root}/.github/workflows/publish-open-vsx.yml"
distribute="${root}/.github/workflows/distribute.yml"

if rg -q 'actions/(upload|download)-artifact@' "${root}/.github/workflows"; then
  echo 'a workflow still uses GitHub Actions artifact storage' >&2
  exit 1
fi

if rg -Fq 'schedule:' "${compiler_release}"; then
  echo 'compiler handoff cleanup schedule would emit spurious Compiler release workflow_run events' >&2
  exit 1
fi
[[ -f "${handoff_cleanup}" ]] || {
  echo 'compiler handoff cleanup does not have an isolated scheduled workflow' >&2
  exit 1
}

if rg -q 'gh run download' "${compiler_release}" "${open_vsx}" "${distribute}"; then
  echo 'compiler release transport still downloads GitHub Actions artifacts' >&2
  exit 1
fi

for required in \
  'handoff_tag:' \
  'handoff_tag=compiler-handoff-${GITHUB_RUN_ID}' \
  'github-release-handoff.sh init' \
  'github-release-handoff.sh upload' \
  'github-release-handoff.sh download' \
  'github-release-handoff.sh finalize' \
  'github-release-handoff.sh cleanup'; do
  rg -Fq "${required}" "${compiler_release}" || {
    echo "compiler release is missing quota-independent handoff contract: ${required}" >&2
    exit 1
  }
done

rg -Fq 'github-release-handoff.sh cleanup' "${handoff_cleanup}" || {
  echo 'scheduled compiler handoff workflow does not invoke age-based cleanup' >&2
  exit 1
}
cleanup_line="$(rg -n 'github-release-handoff.sh cleanup' "${compiler_release}" | tail -n 1 | cut -d: -f1)"
init_line="$(rg -n 'github-release-handoff.sh init' "${compiler_release}" | cut -d: -f1)"
state_upload_line="$(rg -n 'github-release-handoff.sh upload' "${compiler_release}" | tail -n 1 | cut -d: -f1)"
finalize_line="$(rg -n 'github-release-handoff.sh finalize' "${compiler_release}" | cut -d: -f1)"
rg -Fq "if: steps.state.outputs.publishable == 'true'" "${compiler_release}" || {
  echo 'compiler release can publicize a non-publishable handoff' >&2
  exit 1
}
[[ "${cleanup_line}" -lt "${init_line}" ]] || {
  echo 'compiler release does not clean expired handoffs before initializing the current handoff' >&2
  exit 1
}
[[ "${state_upload_line}" -lt "${finalize_line}" ]] || {
  echo 'compiler release finalizes its draft before retaining aggregate state and report' >&2
  exit 1
}

rg -Fq 'run-ci-reported-command.sh' "${compiler}" || {
  echo 'compiler diagnostics must remain visible in GitHub job summaries' >&2
  exit 1
}
rg -Fq 'run-ci-reported-command.sh' "${tracker_delivery}" || {
  echo 'tracker delivery diagnostics must remain visible in GitHub job summaries' >&2
  exit 1
}

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
