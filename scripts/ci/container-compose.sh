#!/usr/bin/env bash
# Run Compose validation with Podman on developer machines and Docker in GHA.
# Runtime deployment is performed by Coolify; this wrapper is deliberately
# limited to local/CI configuration validation.
set -euo pipefail

engine="${BESKID_COMPOSE_ENGINE:-}"
if [[ -z "${engine}" ]]; then
  if [[ "${GITHUB_ACTIONS:-}" == "true" ]]; then
    engine="docker"
  else
    engine="podman"
  fi
fi

case "${engine}" in
  podman|docker) ;;
  *) echo "BESKID_COMPOSE_ENGINE must be podman or docker" >&2; exit 2 ;;
esac

if [[ "${engine}" == "podman" ]]; then
  command -v podman-compose >/dev/null 2>&1 || {
    echo "podman-compose is required for local Compose validation" >&2
    exit 127
  }
  exec podman-compose "$@"
fi

command -v docker >/dev/null 2>&1 || {
  echo "docker is required for GitHub Actions Compose validation" >&2
  exit 127
}
exec docker compose "$@"
