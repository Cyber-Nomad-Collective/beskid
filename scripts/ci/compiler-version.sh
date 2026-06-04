#!/usr/bin/env bash
# Resolve rolling CLI/LSP semver (Dagger port of compiler/ci/version.py).
# Prints the version string to stdout.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

bash ./scripts/ci/init-compiler-submodule.sh
bash ./scripts/ci/init-beskid-infra-submodule.sh

: "${GITHUB_REF:?GITHUB_REF is required}"
: "${GITHUB_REF_NAME:?GITHUB_REF_NAME is required}"
: "${GITHUB_EVENT_NAME:?GITHUB_EVENT_NAME is required}"

GITHUB_RUN_NUMBER="${GITHUB_RUN_NUMBER:-}"

(
  cd beskid_infra/dagger
  npm ci --silent --include=dev
)

dagger -m beskid_infra/dagger call compute-cli-version \
  --source="${ROOT}/compiler" \
  --github-ref="${GITHUB_REF}" \
  --github-ref-name="${GITHUB_REF_NAME}" \
  --github-event-name="${GITHUB_EVENT_NAME}" \
  --github-run-number="${GITHUB_RUN_NUMBER}"
