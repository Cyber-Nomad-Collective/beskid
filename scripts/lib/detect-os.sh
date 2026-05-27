# Detect host OS/arch and preferred package managers for install-deps.sh
# shellcheck shell=bash

beskid_detect_platform() {
  local raw
  raw="$(uname -s 2>/dev/null || echo unknown)"

  case "${raw}" in
    Darwin) BESKID_OS="darwin" ;;
    Linux) BESKID_OS="linux" ;;
    MINGW* | MSYS* | CYGWIN* | Windows_NT) BESKID_OS="windows" ;;
    *) BESKID_OS="unknown" ;;
  esac

  case "$(uname -m 2>/dev/null)" in
    x86_64 | amd64) BESKID_ARCH="amd64" ;;
    arm64 | aarch64) BESKID_ARCH="arm64" ;;
    *) BESKID_ARCH="$(uname -m)" ;;
  esac

  export BESKID_OS BESKID_ARCH

  BESKID_PKG_MANAGERS=()
  case "${BESKID_OS}" in
    darwin)
      command -v brew >/dev/null 2>&1 && BESKID_PKG_MANAGERS+=("homebrew")
      ;;
    linux)
      command -v brew >/dev/null 2>&1 && BESKID_PKG_MANAGERS+=("homebrew")
      command -v apt-get >/dev/null 2>&1 && BESKID_PKG_MANAGERS+=("apt")
      command -v dnf >/dev/null 2>&1 && BESKID_PKG_MANAGERS+=("dnf")
      command -v pacman >/dev/null 2>&1 && BESKID_PKG_MANAGERS+=("pacman")
      command -v snap >/dev/null 2>&1 && BESKID_PKG_MANAGERS+=("snap")
      ;;
    windows)
      command -v winget.exe >/dev/null 2>&1 && BESKID_PKG_MANAGERS+=("winget")
      command -v scoop >/dev/null 2>&1 && BESKID_PKG_MANAGERS+=("scoop")
      command -v choco >/dev/null 2>&1 && BESKID_PKG_MANAGERS+=("choco")
      command -v brew >/dev/null 2>&1 && BESKID_PKG_MANAGERS+=("homebrew")
      ;;
  esac
  export BESKID_PKG_MANAGERS
}

beskid_platform_label() {
  echo "${BESKID_OS}/${BESKID_ARCH} (managers: ${BESKID_PKG_MANAGERS[*]:-none})"
}
