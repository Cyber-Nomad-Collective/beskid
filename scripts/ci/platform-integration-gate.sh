#!/usr/bin/env bash
# Cross-site integration gate used before any image publication.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}"

bash scripts/ci/platform-smoke.sh
if [[ -n "${NODE_AUTH_TOKEN:-}" ]]; then
  bash scripts/ci/site-build-gate.sh auth "${NODE_AUTH_TOKEN}"
  bash scripts/ci/site-build-gate.sh website "${NODE_AUTH_TOKEN}"
  bash scripts/ci/site-build-gate.sh platform-spec "${NODE_AUTH_TOKEN}"
else
  echo "NODE_AUTH_TOKEN unset: running credential-independent site tests; CI remains responsible for authenticated frozen installs/builds."
  pnpm --dir site/auth test
  pnpm --dir site/website test
  pnpm --dir site/platform-spec test
fi
bash scripts/ci/test/run-cicd-foundation-tests.sh
