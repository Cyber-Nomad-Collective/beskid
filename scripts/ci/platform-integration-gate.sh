#!/usr/bin/env bash
# Cross-site integration gate used before any image publication.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}"

bash scripts/ci/platform-smoke.sh
bash scripts/ci/site-build-gate.sh auth
bash scripts/ci/site-build-gate.sh website
bash scripts/ci/site-build-gate.sh platform-spec
bash scripts/ci/test/run-cicd-foundation-tests.sh
