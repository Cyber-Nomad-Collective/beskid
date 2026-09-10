#!/usr/bin/env bash
# Build all platform images, then publish immutable tags only from a trusted main push.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMMIT_SHA="${APPVEYOR_REPO_COMMIT:-$(git -C "${ROOT}" rev-parse HEAD)}"
PUBLISH=false

# shellcheck source-path=SCRIPTDIR
# shellcheck source=lib/appveyor-event-policy.sh
source "${ROOT}/scripts/ci/lib/appveyor-event-policy.sh"
# shellcheck source-path=SCRIPTDIR
# shellcheck source=lib/appveyor-platform-images.sh
source "${ROOT}/scripts/ci/lib/appveyor-platform-images.sh"

if appveyor_is_trusted_main_push; then
  PUBLISH=true
fi

[[ "${COMMIT_SHA}" =~ ^[0-9a-f]{40}$ ]] || {
  echo "APPVEYOR_REPO_COMMIT must be a full lowercase Git commit SHA" >&2
  exit 2
}

build_image() {
  local lane="$1"
  local context="$2"
  local dockerfile="$3"
  shift 3
  docker buildx build \
    --load \
    --provenance=mode=min \
    --sbom=true \
    --file "${dockerfile}" \
    --tag "$(beskid_platform_immutable_ref "${lane}" "${COMMIT_SHA}")" \
    "$@" \
    "${context}"
}

cd "${ROOT}"
docker buildx version
build_image site . site/website/Dockerfile \
  --build-arg BESKID_RELEASE_CHANNEL=stable
build_image learn . site/learn/Dockerfile \
  --build-arg BESKID_RELEASE_CHANNEL=stable
build_image tracker beskid_tracker beskid_tracker/Dockerfile \
  --build-context web_common=./beskid_web_common
build_image nexus beskid_nexus beskid_nexus/Dockerfile \
  --build-context openspec=./openspec \
  --build-context web_common=./beskid_web_common
build_image pckg . pckg/Dockerfile

if [[ "${PUBLISH}" != "true" ]]; then
  echo "Platform images validated locally; publication is disabled for this AppVeyor event."
  exit 0
fi

if [[ -z "${REGISTRY_USERNAME:-}" ]] || [[ -z "${REGISTRY_PASSWORD:-}" ]]; then
  echo "REGISTRY_USERNAME and REGISTRY_PASSWORD are required for trusted main publication" >&2
  exit 3
fi

beskid_registry_session_install_traps
beskid_registry_login "${REGISTRY_USERNAME}" "${REGISTRY_PASSWORD}"

for lane in "${BESKID_PLATFORM_LANES[@]}"; do
  immutable_ref="$(beskid_platform_immutable_ref "${lane}" "${COMMIT_SHA}")"
  docker push "${immutable_ref}"
  immutable_digest="$(docker image inspect --format '{{index .RepoDigests 0}}' "${immutable_ref}")"
  bash "${ROOT}/scripts/ci/appveyor-image-manifest.sh" record \
    "${lane}" "${immutable_ref}" "${immutable_digest}"
done

echo "Published immutable platform images for ${COMMIT_SHA}; Watchtower owns deployment reconciliation."
