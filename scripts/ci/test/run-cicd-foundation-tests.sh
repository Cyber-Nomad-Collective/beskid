#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"

node --test "${root}/scripts/ci/test/license-policy.test.mjs"
node "${root}/scripts/ci/check-license-policy.mjs" --root "${root}"

for script in \
  build-release-artifact.sh \
  build-release-platform.sh \
  build-release-state.sh \
  compiler-rust-gate.sh \
  corelib-publish.sh \
  open-vsx-publish.sh \
  publish-release-stream.sh; do
  bash -n "${root}/scripts/ci/${script}"
done

bash "${root}/scripts/ci/test/editor-authoring-version.test.sh"
bash "${root}/scripts/ci/test/build-release-state.test.sh"
bash "${root}/scripts/ci/test/build-release-platform.test.sh"
bash "${root}/scripts/ci/test/render-ci-failure.test.sh"
bash "${root}/scripts/ci/test/shared-ui-nexus-gate-contract.test.sh"
bash "${root}/scripts/ci/test/platform-stylesheet-contract.test.sh"
bash "${root}/scripts/ci/test/image-preparation-contract.test.sh"
bash "${root}/scripts/ci/test/rust-linker-toolchain-contract.test.sh"

# CoreLib workspace member aliases intentionally differ from registry package
# names; the quality gate must validate each member's package declaration.
CORELIB_QUALITY_ONLY=1 "${root}/scripts/ci/corelib-gate.sh"
bash "${root}/scripts/ci/test/corelib-gate-report.test.sh"
bash "${root}/scripts/ci/test/corelib-publish-contract.test.sh"

echo "build and release foundation tests OK"
