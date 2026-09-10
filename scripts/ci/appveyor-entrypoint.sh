#!/usr/bin/env bash
# Native Linux/macOS AppVeyor dispatcher. All build logic remains in scripts/ci.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LANE="${BESKID_CI_LANE:-}"

run_linux_platform_lane() {
  bash scripts/ci/openspec-gate.sh
  bash scripts/ci/conformance-gate.sh
  bash scripts/ci/security-policy-gate.sh
  CORELIB_REPORT_DIR="${APPVEYOR_BUILD_FOLDER:-${ROOT}}/.appveyor-reports/corelib" \
    bash scripts/ci/corelib-gate.sh
  bash scripts/ci/shared-ui-nexus-gate.sh
  pnpm --dir beskid_tracker run reconcile:plan
  pnpm install --dir beskid_tracker --frozen-lockfile
  pnpm --dir beskid_tracker test
  pnpm --dir beskid_tracker check
  bash scripts/ci/platform-integration-gate.sh
  bash scripts/ci/appveyor-package-publish.sh rehearse
  bash scripts/ci/appveyor-platform-publish.sh
  bash scripts/ci/appveyor-package-publish.sh publish
  bash scripts/ci/appveyor-image-manifest.sh finalize
  bash scripts/ci/appveyor-platform-promote.sh
}

run_appveyor_lane() {
  # Source installation so nvm/toolchain exports remain active for the gate.
  # shellcheck disable=SC1091
  source "${ROOT}/scripts/ci/appveyor-install.sh"

  cd "${ROOT}"
  case "${LANE}" in
    linux-platform)
      run_linux_platform_lane
      ;;
    linux-compiler)
      bash scripts/ci/compiler-rust-gate.sh
      bash scripts/ci/lsp-command-contract-gate.sh
      BESKID_RUNTIME_PREFIX="${ROOT}/compiler/target/native-runtime-kit-linux-matrix" \
        bash compiler/scripts/stage-native-runtime-kit-matrix.sh
      ;;
    macos-compiler)
      BESKID_RUNTIME_PREFIX="${ROOT}/compiler/target/native-runtime-kit-macos-matrix" \
        bash compiler/scripts/stage-native-runtime-kit-matrix.sh
      ;;
    vscode-extension)
      bash scripts/ci/lsp-command-contract-gate.sh
      BESKID_VSCODE_RUN_EXTENSION_HOST=0 bash scripts/ci/vscode-gate.sh
      ;;
    zed-extension)
      bash scripts/ci/test/editor-authoring-version.test.sh
      bash scripts/ci/test/zed-extension-package.test.sh
      bash scripts/ci/test/zed-language-assets.test.sh
      ;;
    *)
      echo "Unsupported Bash AppVeyor lane: ${LANE:-unset}" >&2
      exit 2
      ;;
  esac
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  run_appveyor_lane
fi
