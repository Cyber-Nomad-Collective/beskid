#!/usr/bin/env bash
# Install Google's git-repo launcher into a bin directory on PATH.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/output.sh
source "${SCRIPT_DIR}/lib/output.sh"

REPO_VERSION="${REPO_VERSION:-stable}"
REPO_INSTALL_DIR="${REPO_INSTALL_DIR:-${HOME}/.local/bin}"
REPO_DOWNLOAD_URL="${REPO_DOWNLOAD_URL:-https://storage.googleapis.com/git-repo-downloads/repo}"
REPO_VERBOSE="${REPO_VERBOSE:-0}"

mkdir -p "${REPO_INSTALL_DIR}"
dest="${REPO_INSTALL_DIR}/repo"

repo_launcher_line() {
  if [[ ! -x "${dest}" ]]; then
    return 1
  fi
  "${dest}" version 2>/dev/null | awk '/repo launcher version/ { print; exit }' || true
}

notify_repo_path() {
  local on_path=0
  local resolved=""

  if command -v repo >/dev/null 2>&1; then
    on_path=1
    resolved="$(command -v repo)"
  fi

  section "PATH"
  if [[ "${on_path}" == "1" ]]; then
    ok "repo is on PATH → ${resolved}"
    if [[ "${resolved}" != "${dest}" ]] && [[ -x "${dest}" ]]; then
      note "Also installed at ${dest} (another copy wins on PATH)"
    fi
    return 0
  fi

  if [[ ! -x "${dest}" ]]; then
    fail "repo binary missing at ${dest}"
    return 1
  fi

  warn "repo is installed but not on PATH"
  note "Binary: ${dest}"
  if path_contains_dir "${REPO_INSTALL_DIR}"; then
    note "${REPO_INSTALL_DIR} is in PATH, but \`repo\` was not found (check permissions or a broken install)"
  else
    note "${REPO_INSTALL_DIR} is not on PATH"
    echo ""
    note "For this shell:"
    note "  export PATH=\"${REPO_INSTALL_DIR}:\${PATH}\""
    note "For future shells, add that line to ~/.zshrc, ~/.bashrc, or ~/.profile"
  fi
  return 1
}

section "Google git-repo"
if [[ -x "${dest}" ]]; then
  line="$(repo_launcher_line)"
  if [[ -n "${line}" ]]; then
    ok "Already installed (${dest})"
    note "${line}"
  else
    ok "Already installed (${dest})"
  fi
  if [[ "${REPO_VERBOSE}" == "1" ]]; then
    "${dest}" version 2>/dev/null || true
  fi
else
  note "Downloading (${REPO_VERSION}) → ${dest}"
  curl -fsSL "${REPO_DOWNLOAD_URL}" -o "${dest}"
  chmod a+rx "${dest}"
  line="$(repo_launcher_line)"
  ok "Installed ${dest}"
  [[ -n "${line}" ]] && note "${line}"
  if [[ "${REPO_VERBOSE}" == "1" ]]; then
    "${dest}" version 2>/dev/null || true
  fi
fi

notify_repo_path || true
