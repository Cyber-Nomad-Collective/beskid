#!/usr/bin/env bash
# Build all platform images, then publish only from a trusted main push.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REGISTRY="cr.beskid-lang.org"
NAMESPACE="${REGISTRY}/beskid"
COMMIT_SHA="${APPVEYOR_REPO_COMMIT:-$(git -C "${ROOT}" rev-parse HEAD)}"
PUBLISH=false
LOGGED_IN=false

# shellcheck source-path=SCRIPTDIR
# shellcheck source=lib/appveyor-event-policy.sh
source "${ROOT}/scripts/ci/lib/appveyor-event-policy.sh"

if appveyor_is_trusted_main_push; then
  PUBLISH=true
fi

[[ "${COMMIT_SHA}" =~ ^[0-9a-f]{40}$ ]] || {
  echo "APPVEYOR_REPO_COMMIT must be a full lowercase Git commit SHA" >&2
  exit 2
}

cleanup_registry_session() {
  local status=$?
  if [[ "${LOGGED_IN}" == "true" ]]; then
    docker logout "${REGISTRY}" >/dev/null 2>&1 || true
  fi
  return "${status}"
}
trap cleanup_registry_session EXIT

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
    --tag "${NAMESPACE}/${lane}:sha-${COMMIT_SHA}" \
    --tag "${NAMESPACE}/${lane}:production" \
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

printf '%s' "${REGISTRY_PASSWORD}" | \
  docker login "${REGISTRY}" --username "${REGISTRY_USERNAME}" --password-stdin
LOGGED_IN=true

for lane in site learn tracker nexus pckg; do
  docker push "${NAMESPACE}/${lane}:sha-${COMMIT_SHA}"
done
for lane in site learn tracker nexus pckg; do
  docker push "${NAMESPACE}/${lane}:production"
done

echo "Published platform images for ${COMMIT_SHA}; Watchtower owns deployment reconciliation."
