#!/usr/bin/env bash
# Production-only delivery contract suite. External registry and host access are
# deliberately excluded; those credentials exist only in CI and on the host.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"

for script in \
  build-release-manifest.sh \
  validate-release-manifest.sh \
  post-deploy-smoke.sh \
  sign-image.sh \
  prepare-secure-dockerfile.sh \
  validate-promotion-source.sh; do
  bash -n "${root}/scripts/ci/${script}"
done

bash "${root}/scripts/ci/test/production-watchtower-contract.test.sh"
bash "${root}/scripts/ci/test/delivery-contract.test.sh"
bash "${root}/scripts/ci/test/post-deploy-smoke.test.sh"
bash "${root}/scripts/ci/test/platform-delivery-fail-closed.test.sh"
bash "${root}/scripts/ci/test/automatic-production-promotion.test.sh"
bash "${root}/scripts/ci/test/image-preparation-contract.test.sh"
bash "${root}/scripts/ci/security-policy-gate.sh"

echo "production Watchtower CI/CD contracts OK"
