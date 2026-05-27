#!/usr/bin/env bash
# Install Google's repo tool into ~/.local/bin (or BESKID_LOCAL_BIN).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/output.sh
source "${SCRIPT_DIR}/lib/output.sh"

REPO_BIN="${BESKID_LOCAL_BIN:-${HOME}/.local/bin}/repo"
REPO_URL="${BESKID_REPO_TOOL_URL:-https://storage.googleapis.com/git-repo-downloads/repo}"

section "repo tool"

if [[ -x "${REPO_BIN}" ]]; then
  ok "repo already installed at ${REPO_BIN}"
else
  mkdir -p "$(dirname "${REPO_BIN}")"
  note "Downloading repo → ${REPO_BIN}"
  curl -fsSL "${REPO_URL}" -o "${REPO_BIN}"
  chmod +x "${REPO_BIN}"
  ok "Installed repo"
fi

if ! path_contains_dir "$(dirname "${REPO_BIN}")"; then
  warn "Add to PATH: export PATH=\"$(dirname "${REPO_BIN}"):\$PATH\""
fi

if command -v "${REPO_BIN}" >/dev/null 2>&1; then
  if [[ "${REPO_VERBOSE:-}" == "1" ]]; then
    "${REPO_BIN}" version || true
  else
    "${REPO_BIN}" version 2>/dev/null | head -n1 || true
  fi
fi
