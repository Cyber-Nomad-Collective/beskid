#!/usr/bin/env bash
# Advance production tags from already-published immutable platform images.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REGISTRY="cr.beskid-lang.org"
NAMESPACE="${REGISTRY}/beskid"
COMMIT_SHA="${APPVEYOR_REPO_COMMIT:-$(git -C "${ROOT}" rev-parse HEAD)}"
LOGGED_IN=false

# shellcheck source-path=SCRIPTDIR
# shellcheck source=lib/appveyor-event-policy.sh
source "${ROOT}/scripts/ci/lib/appveyor-event-policy.sh"

[[ "${COMMIT_SHA}" =~ ^[0-9a-f]{40}$ ]] || {
  echo "APPVEYOR_REPO_COMMIT must be a full lowercase Git commit SHA" >&2
  exit 2
}

if ! appveyor_is_trusted_main_push; then
  echo "Platform image promotion is disabled for this AppVeyor event."
  exit 0
fi

if [[ -z "${REGISTRY_USERNAME:-}" ]] || [[ -z "${REGISTRY_PASSWORD:-}" ]]; then
  echo "REGISTRY_USERNAME and REGISTRY_PASSWORD are required for trusted main promotion" >&2
  exit 3
fi

cleanup_registry_session() {
  local status=$?
  if [[ "${LOGGED_IN}" == "true" ]]; then
    docker logout "${REGISTRY}" >/dev/null 2>&1 || true
  fi
  return "${status}"
}
trap cleanup_registry_session EXIT

printf '%s' "${REGISTRY_PASSWORD}" | \
  docker login "${REGISTRY}" --username "${REGISTRY_USERNAME}" --password-stdin
LOGGED_IN=true

for lane in site learn tracker nexus pckg; do
  immutable_ref="${NAMESPACE}/${lane}:sha-${COMMIT_SHA}"
  production_ref="${NAMESPACE}/${lane}:production"
  docker pull "${immutable_ref}"
  docker image tag "${immutable_ref}" "${production_ref}"
  docker push "${production_ref}"
done

echo "Promoted immutable platform images for ${COMMIT_SHA}; Watchtower owns deployment reconciliation."
