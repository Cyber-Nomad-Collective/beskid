#!/usr/bin/env bash
# Sync superrepo projects and install JS workspaces.
#
# Usage:
#   ./scripts/setup-environment.sh
#   ./scripts/setup-environment.sh --submodules
#   ./scripts/setup-environment.sh --submodules compiler pckg beskid_web_common
#   BESKID_SKIP_JS_INSTALL=1 ./scripts/setup-environment.sh --submodules
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUPERREPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
# shellcheck source=lib/output.sh
source "${SCRIPT_DIR}/lib/output.sh"

USE_SUBMODULES_ONLY=0
SUBMODULE_PATHS=()
SKIP_JS="${BESKID_SKIP_JS_INSTALL:-0}"

usage() {
  cat <<'EOF'
Usage: setup-environment.sh [options] [submodule-path ...]

Options:
  --submodules     Use git submodule update (skip repo init/sync)
  -h, --help       Show help

Environment:
  BESKID_SKIP_JS_INSTALL=1   Skip bun install at repo root
  BESKID_MANIFEST_URL        repo init -u URL (default: superrepo origin)
  BESKID_MANIFEST_BRANCH     Branch for manifests/default.xml (default: main)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --submodules) USE_SUBMODULES_ONLY=1 ;;
    -h | --help) usage; exit 0 ;;
    -*) die "Unknown option: $1" ;;
    *) SUBMODULE_PATHS+=("$1") ;;
  esac
  shift
done

cd "${SUPERREPO_ROOT}"

all_submodule_paths() {
  git config -f .gitmodules --get-regexp '^submodule\..*\.path' 2>/dev/null \
    | awk '{print $2}' \
    | sort -u
}

run_submodule_sync() {
  local paths=("$@")
  if [[ ${#paths[@]} -eq 0 ]]; then
    beskid_read_array paths all_submodule_paths
  fi
  if [[ ${#paths[@]} -eq 0 ]]; then
    warn "No submodules defined in .gitmodules"
    return 0
  fi
  section "Git submodules"
  note "Paths: ${paths[*]}"
  git submodule update --init --recursive "${paths[@]}"
  ok "Submodules ready"
}

run_repo_sync() {
  local manifest="${SUPERREPO_ROOT}/manifests/default.xml"
  if [[ ! -f "${manifest}" ]]; then
    note "No manifests/default.xml — using git submodules"
    run_submodule_sync "${SUBMODULE_PATHS[@]}"
    return 0
  fi

  section "repo sync"
  export PATH="${BESKID_LOCAL_BIN:-${HOME}/.local/bin}:${PATH}"
  "${SCRIPT_DIR}/install-repo-tool.sh"

  if [[ -d "${SUPERREPO_ROOT}/.repo" ]]; then
    note "Existing .repo — syncing"
    repo sync -j4
    ok "repo sync complete"
    return 0
  fi

  local url branch
  url="${BESKID_MANIFEST_URL:-$(git remote get-url origin 2>/dev/null || true)}"
  branch="${BESKID_MANIFEST_BRANCH:-main}"
  [[ -n "${url}" ]] || die "Set BESKID_MANIFEST_URL or add git origin for repo init"

  note "repo init -u ${url} -m manifests/default.xml -b ${branch}"
  if repo init -u "${url}" -m manifests/default.xml -b "${branch}"; then
    repo sync -j4
    ok "repo init + sync complete"
  else
    warn "repo init failed — falling back to git submodules"
    run_submodule_sync "${SUBMODULE_PATHS[@]}"
  fi
}

run_js_install() {
  if [[ "${SKIP_JS}" == "1" ]]; then
    note "Skipping bun install (BESKID_SKIP_JS_INSTALL=1)"
    return 0
  fi
  if ! command -v bun >/dev/null 2>&1; then
    warn "bun not on PATH — run: ./scripts/install-deps.sh --install --tool bun"
    return 0
  fi
  if [[ -z "${NODE_AUTH_TOKEN:-}" && -f "${SUPERREPO_ROOT}/.env" ]]; then
    # shellcheck disable=SC1091
    set -a
    source "${SUPERREPO_ROOT}/.env" 2>/dev/null || true
    set +a
  fi
  if [[ -z "${NODE_AUTH_TOKEN:-}" ]] && command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    note "NODE_AUTH_TOKEN unset — run ./scripts/setup-npm-auth.sh for GitHub Packages"
  fi
  section "Bun workspaces"
  (cd "${SUPERREPO_ROOT}" && bun install)
  ok "bun install complete"
}

run_beskid_package_sync() {
  if [[ "${BESKID_SKIP_PACKAGE_SYNC:-0}" == "1" ]]; then
    note "Skipping Beskid package sync (BESKID_SKIP_PACKAGE_SYNC=1)"
    return 0
  fi
  if [[ -z "${NODE_AUTH_TOKEN:-}" ]]; then
    note "NODE_AUTH_TOKEN unset — skip sync-beskid-packages (use published lockfile versions)"
    return 0
  fi
  section "Beskid GitHub Packages"
  "${SCRIPT_DIR}/sync-beskid-packages.sh"
}

section "Beskid environment setup"

if [[ "${USE_SUBMODULES_ONLY}" == "1" ]]; then
  run_submodule_sync "${SUBMODULE_PATHS[@]}"
else
  run_repo_sync
fi

run_js_install

run_beskid_package_sync

ok "Environment setup finished"
