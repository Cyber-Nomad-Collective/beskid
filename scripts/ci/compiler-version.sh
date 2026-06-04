#!/usr/bin/env bash
# Resolve rolling CLI/LSP semver (Dagger port of compiler/ci/version.py).
# Prints the version string to stdout.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

bash ./scripts/ci/init-compiler-submodule.sh

: "${GITHUB_REF:?GITHUB_REF is required}"
: "${GITHUB_REF_NAME:?GITHUB_REF_NAME is required}"
: "${GITHUB_EVENT_NAME:?GITHUB_EVENT_NAME is required}"

GITHUB_RUN_NUMBER="${GITHUB_RUN_NUMBER:-}"

DAGGER_VERSION="$(tr -d '[:space:]' < beskid_infra/dagger/.dagger-version)"

(
  cd beskid_infra/dagger
  npm ci --silent
)

dagger -m beskid_infra/dagger call compiler-release compute-cli-version \
  --source="${ROOT}" \
  --github-ref="${GITHUB_REF}" \
  --github-ref-name="${GITHUB_REF_NAME}" \
  --github-event-name="${GITHUB_EVENT_NAME}" \
  --github-run-number="${GITHUB_RUN_NUMBER}"
