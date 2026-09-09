#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"

node --test "${root}/scripts/ci/test/license-policy.test.mjs"
node "${root}/scripts/ci/check-license-policy.mjs" --root "${root}"

for script in \
  build-release-manifest.sh \
  validate-release-manifest.sh \
  post-deploy-smoke.sh \
  sign-image.sh \
  prepare-secure-dockerfile.sh \
  validate-promotion-source.sh; do
  bash -n "${root}/scripts/ci/${script}"
done

"${root}/scripts/ci/test/run-distribute-workflow-contract-tests.sh"
bash "${root}/scripts/ci/test/release-version-contract.test.sh"
bash "${root}/scripts/ci/test/editor-authoring-version.test.sh"
bash "${root}/scripts/ci/test/build-release-state.test.sh"
bash "${root}/scripts/ci/test/build-release-platform.test.sh"
bash "${root}/scripts/ci/test/render-ci-failure.test.sh"
bash "${root}/scripts/ci/test/post-deploy-smoke.test.sh"
bash "${root}/scripts/ci/test/shared-ui-nexus-gate-contract.test.sh"
bash "${root}/scripts/ci/test/platform-stylesheet-contract.test.sh"
bash "${root}/scripts/ci/test/platform-delivery-fail-closed.test.sh"
bash "${root}/scripts/ci/test/release-manifest-active-lanes.test.sh"
bash "${root}/scripts/ci/test/github-release-handoff.test.sh"
bash "${root}/scripts/ci/test/image-preparation-contract.test.sh"

# CoreLib workspace member aliases intentionally differ from registry package
# names; the quality gate must validate each member's package declaration.
CORELIB_QUALITY_ONLY=1 "${root}/scripts/ci/corelib-gate.sh"
bash "${root}/scripts/ci/test/corelib-gate-report.test.sh"
bash "${root}/scripts/ci/test/corelib-workflow-report-contract.test.sh"
bash "${root}/scripts/ci/test/corelib-publish-contract.test.sh"

echo "CI/CD foundation tests OK"
