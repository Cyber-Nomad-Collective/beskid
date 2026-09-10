#!/usr/bin/env bash
# Prepare one native AppVeyor lane and initialize only its required gitlinks.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LANE="${BESKID_CI_LANE:-}"
PNPM_VERSION="10.17.1"

# shellcheck source=lib/appveyor-rust-toolchain.sh
source "${ROOT}/scripts/ci/lib/appveyor-rust-toolchain.sh"

require_command() {
  local command_name="$1"
  command -v "${command_name}" >/dev/null 2>&1 || {
    echo "AppVeyor lane ${LANE:-unset} requires ${command_name}" >&2
    return 1
  }
}

require_native_lane() {
  local expected_os="$1"
  case "${expected_os}:$(uname -s)" in
    linux:Linux|macos:Darwin) ;;
    *)
      echo "AppVeyor lane ${LANE} is running on the wrong worker: $(uname -s)" >&2
      return 1
      ;;
  esac
}

activate_node() {
  local major=''
  if command -v node >/dev/null 2>&1; then
    major="$(node -p 'process.versions.node.split(".")[0]')"
  fi
  if [[ "${major}" != "24" ]]; then
    if [[ -s "${NVM_DIR:-${HOME}/.nvm}/nvm.sh" ]]; then
      # shellcheck disable=SC1090,SC1091
      source "${NVM_DIR:-${HOME}/.nvm}/nvm.sh"
      nvm install 24
      nvm use 24
    else
      echo "Node 24 is required and nvm is unavailable" >&2
      return 1
    fi
  fi
  corepack enable
  corepack prepare "pnpm@${PNPM_VERSION}" --activate
  [[ "$(node -p 'process.versions.node.split(".")[0]')" == "24" ]]
  [[ "$(pnpm --version)" == "${PNPM_VERSION}" ]]
}

install_linux_native_tools() {
  require_command sudo
  sudo apt-get update
  sudo apt-get install -y --no-install-recommends \
    build-essential clang curl git jq lld llvm mold pkg-config libssl-dev
  LLVM_NM="$(command -v llvm-nm)"
  export LLVM_NM
}

install_macos_native_tools() {
  require_command brew
  brew list llvm >/dev/null 2>&1 || brew install llvm
  LLVM_NM="$(brew --prefix llvm)/bin/llvm-nm"
  export LLVM_NM
}

init_compiler_tree() {
  bash "${ROOT}/scripts/ci/init-compiler-submodule.sh"
}

cd "${ROOT}"
case "${LANE}" in
  linux-platform)
    require_native_lane linux
    init_compiler_tree
    bash scripts/ci/init-submodules.sh \
      beskid_distrib beskid_infra beskid_nexus beskid_tracker \
      beskid_templates \
      beskid_web_common pckg
    activate_node
    activate_appveyor_rust_toolchain
    install_linux_native_tools
    pnpm install --frozen-lockfile
    require_command docker
    docker buildx version
    ;;
  linux-compiler)
    require_native_lane linux
    init_compiler_tree
    bash scripts/ci/init-submodules.sh beskid_vscode
    activate_node
    activate_appveyor_rust_toolchain
    install_linux_native_tools
    if ! command -v bun >/dev/null 2>&1; then
      npm install --global bun@1.3.14
    fi
    [[ "$(bun --version)" == "1.3.14" ]]
    ;;
  macos-compiler)
    require_native_lane macos
    init_compiler_tree
    activate_appveyor_rust_toolchain
    rustup target add aarch64-apple-darwin
    install_macos_native_tools
    ;;
  vscode-extension)
    require_native_lane linux
    init_compiler_tree
    bash scripts/ci/init-submodules.sh beskid_vscode
    activate_node
    activate_appveyor_rust_toolchain
    install_linux_native_tools
    if ! command -v bun >/dev/null 2>&1; then
      npm install --global bun@1.3.14
    fi
    [[ "$(bun --version)" == "1.3.14" ]]
    ;;
  zed-extension)
    require_native_lane linux
    bash scripts/ci/init-submodules.sh beskid_bsol beskid_treesitter
    activate_node
    activate_appveyor_rust_toolchain
    install_linux_native_tools
    rustup target add wasm32-wasip2
    ;;
  *)
    echo "Unsupported Bash AppVeyor lane: ${LANE:-unset}" >&2
    exit 2
    ;;
esac
