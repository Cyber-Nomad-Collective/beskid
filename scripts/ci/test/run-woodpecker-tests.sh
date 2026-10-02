#!/usr/bin/env bash
# Fast migration boundary tests; fixture publishers never contact registries.
set -euo pipefail
cd "$(dirname "$0")/../../.."
# Fixtures establish their own positive/negative pipeline contexts.
unset CI CI_SYSTEM_NAME CI_COMMIT_SHA CI_PIPELINE_NUMBER CI_COMMIT_BRANCH CI_PIPELINE_EVENT CI_COMMIT_TAG
for suite in \
  build-release-platform build-release-state build-release-artifact-bundle publish-release-stream \
  woodpecker-build-platform release-source-inventory compiler-rust-gate-timeout woodpecker-release-gates woodpecker-release-tag-guard woodpecker-workflow-contract woodpecker-standard-workflow \
  open-vsx-publish woodpecker-platform-images woodpecker-release \
  woodpecker-upload-handoff woodpecker-fetch-handoffs; do
  echo "Migration contract: ${suite}"
  bash "scripts/ci/test/${suite}.test.sh"
done
node --test scripts/ci/test/package-source-authority.test.mjs \
  scripts/ci/test/qualified-pckg-toolchain.test.mjs \
  scripts/ci/test/template-quality-gate.test.mjs \
  scripts/ci/test/release-version.test.mjs \
  scripts/ci/test/woodpecker-cli-surface-evidence.test.mjs \
  scripts/ci/test/woodpecker-release-evidence.test.mjs
