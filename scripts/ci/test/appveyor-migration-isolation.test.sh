#!/usr/bin/env bash
# Prove the migration contract is independent from the caller's AppVeyor/registry environment.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"

REGISTRY_USERNAME=registry-admin \
REGISTRY_PASSWORD='real-shaped-registry-password-42' \
APPVEYOR_REPO_BRANCH=ambient-branch \
APPVEYOR_PULL_REQUEST_NUMBER=918 \
APPVEYOR_REPO_TAG=True \
APPVEYOR_FORCED_BUILD=True \
APPVEYOR_SCHEDULED_BUILD=True \
APPVEYOR_RE_BUILD=True \
APPVEYOR_RE_RUN_INCOMPLETE=True \
  bash "${ROOT}/scripts/ci/test/appveyor-migration-contract.test.sh"

printf 'AppVeyor migration isolation test OK\n'
