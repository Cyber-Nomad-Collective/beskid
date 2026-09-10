#!/usr/bin/env bash
# Advance production tags from already-published immutable platform images.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMMIT_SHA="${APPVEYOR_REPO_COMMIT:-$(git -C "${ROOT}" rev-parse HEAD)}"

# shellcheck source-path=SCRIPTDIR
# shellcheck source=lib/appveyor-event-policy.sh
source "${ROOT}/scripts/ci/lib/appveyor-event-policy.sh"
# shellcheck source-path=SCRIPTDIR
# shellcheck source=lib/appveyor-platform-images.sh
source "${ROOT}/scripts/ci/lib/appveyor-platform-images.sh"

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

beskid_registry_session_install_traps
beskid_registry_login "${REGISTRY_USERNAME}" "${REGISTRY_PASSWORD}"

for lane in "${BESKID_PLATFORM_LANES[@]}"; do
  immutable_ref="$(beskid_platform_immutable_ref "${lane}" "${COMMIT_SHA}")"
  production_ref="$(beskid_platform_production_ref "${lane}")"
  docker pull "${immutable_ref}"
  docker image tag "${immutable_ref}" "${production_ref}"
  docker push "${production_ref}"
done

echo "Promoted immutable platform images for ${COMMIT_SHA}; Watchtower owns deployment reconciliation."
