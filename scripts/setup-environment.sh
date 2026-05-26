#!/usr/bin/env bash
# Bootstrap a Beskid superrepo checkout with git-repo (preferred) or git submodules.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
# shellcheck source=lib/output.sh
source "${SCRIPT_DIR}/lib/output.sh"

BESKID_MANIFEST_URL="${BESKID_MANIFEST_URL:-https://github.com/Cyber-Nomad-Collective/beskid.git}"
BESKID_MANIFEST_BRANCH="${BESKID_MANIFEST_BRANCH:-main}"
BESKID_MANIFEST_FILE="${BESKID_MANIFEST_FILE:-manifests/default.xml}"
BESKID_USE_REPO="${BESKID_USE_REPO:-1}"
BESKID_WITH_BSHARP="${BESKID_WITH_BSHARP:-0}"
BESKID_SKIP_JS_INSTALL="${BESKID_SKIP_JS_INSTALL:-0}"
REPO_INSTALL_DIR="${REPO_INSTALL_DIR:-${HOME}/.local/bin}"

usage() {
  cat <<'EOF'
Usage: scripts/setup-environment.sh [options]

Prepares the Beskid superrepo: installs Google's repo tool, syncs projects from
manifests/default.xml (or git submodules when BESKID_USE_REPO=0), then optionally
runs bun install at the monorepo root.

Environment:
  BESKID_MANIFEST_URL      Manifest git URL (default: Cyber-Nomad-Collective/beskid)
  BESKID_MANIFEST_BRANCH   Branch for repo init (default: main)
  BESKID_MANIFEST_FILE     Manifest path in that repo (default: manifests/default.xml)
  BESKID_USE_REPO          1 = repo sync, 0 = git submodule update (default: 1)
  BESKID_WITH_BSHARP       1 = also sync references/bsharp (default: 0)
  BESKID_SKIP_JS_INSTALL   1 = skip bun install (default: 0)
  REPO_INSTALL_DIR         Where to install repo (default: ~/.local/bin)
  REPO_VERBOSE             1 = full repo version output from install-repo-tool.sh

Options:
  -h, --help    Show this help
  --submodules  Use git submodule update instead of repo
  --bsharp      Sync optional references/bsharp (repo: -g bsharp)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h | --help)
      usage
      exit 0
      ;;
    --submodules)
      BESKID_USE_REPO=0
      shift
      ;;
    --bsharp)
      BESKID_WITH_BSHARP=1
      shift
      ;;
    *)
      fail "Unknown option: $1"
      usage >&2
      exit 2
      ;;
  esac
done

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "Missing required command: $1"
    exit 1
  fi
}

echo "Beskid environment setup"
note "Root: ${ROOT}"

section "Prerequisites"
require_cmd git
require_cmd curl
ok "git, curl"

cd "${ROOT}"

sync_with_git_submodules() {
  section "Git submodules"
  note "sync + update (compiler, pckg, beskid_vscode, beskid_templates, beskid_tracker)"
  git submodule sync --recursive
  git submodule update --init --recursive compiler pckg beskid_vscode beskid_templates beskid_tracker
  if [[ "${BESKID_WITH_BSHARP}" == "1" ]]; then
    git submodule update --init references/bsharp
  fi
  ok "Submodules updated"
}

if [[ "${BESKID_USE_REPO}" == "1" ]]; then
  export PATH="${REPO_INSTALL_DIR}:${PATH}"
  "${SCRIPT_DIR}/install-repo-tool.sh" || true
  if ! command -v repo >/dev/null 2>&1; then
    fail "repo is not available. Fix PATH (see above), open a new shell, and re-run."
    exit 1
  fi

  repo_ok=1
  section "Repo manifest"
  note "URL: ${BESKID_MANIFEST_URL}"
  note "Branch: ${BESKID_MANIFEST_BRANCH} · Manifest: ${BESKID_MANIFEST_FILE}"

  if [[ ! -d "${ROOT}/.repo" ]]; then
    note "repo init …"
    if ! repo init \
      -u "${BESKID_MANIFEST_URL}" \
      -b "${BESKID_MANIFEST_BRANCH}" \
      -m "${BESKID_MANIFEST_FILE}" \
      --no-clone-bundle 2>&1; then
      repo_ok=0
    else
      ok "repo init"
    fi
  else
    ok ".repo present (skipped init)"
  fi

  if [[ "${repo_ok}" == "1" ]]; then
    jobs="$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)"
    sync_args=(sync -c -j"${jobs}")
    if [[ "${BESKID_WITH_BSHARP}" == "1" ]]; then
      sync_args+=(-g bsharp)
      note "repo sync (jobs=${jobs}, group bsharp) …"
    else
      note "repo sync (jobs=${jobs}) …"
    fi
    if repo "${sync_args[@]}"; then
      ok "repo sync"
    else
      repo_ok=0
    fi
  fi

  if [[ "${repo_ok}" != "1" ]]; then
    if [[ -f "${ROOT}/${BESKID_MANIFEST_FILE}" ]] && [[ -d "${ROOT}/.git" ]]; then
      warn "repo failed — falling back to git submodules"
      note "Manifest may not be on ${BESKID_MANIFEST_BRANCH} at ${BESKID_MANIFEST_URL} yet"
      sync_with_git_submodules
    else
      fail "repo sync failed and no local git checkout to fall back"
      exit 1
    fi
  fi
else
  sync_with_git_submodules
fi

check_optional() {
  local name="$1"
  if command -v "$1" >/dev/null 2>&1; then
    local ver
    ver="$("$1" --version 2>/dev/null | head -1 || "$1" -V 2>/dev/null | head -1 || echo "present")"
    ok "${name} — ${ver}"
  else
    note "${name} — not on PATH (optional)"
  fi
}

section "Toolchain (optional)"
check_optional bun
check_optional cargo
check_optional dotnet
check_optional python3
check_optional gh

if [[ "${BESKID_SKIP_JS_INSTALL}" != "1" ]] && command -v bun >/dev/null 2>&1; then
  if [[ -f "${ROOT}/package.json" ]]; then
    section "JavaScript"
    note "bun install (monorepo root) …"
    (cd "${ROOT}" && bun install)
    ok "bun install"
  fi
else
  section "JavaScript"
  note "Skipped bun install (install bun or set BESKID_SKIP_JS_INSTALL=0)"
fi

section "Done"
ok "Environment ready"
note "compiler/     ${ROOT}/compiler"
note "pckg/         ${ROOT}/pckg"
note "beskid_vscode/ ${ROOT}/beskid_vscode"
note "Website dev:  cd site/website && bun dev"

if [[ "${BESKID_USE_REPO}" == "1" ]] && ! path_contains_dir "${REPO_INSTALL_DIR}"; then
  echo ""
  warn "Tip: add ${REPO_INSTALL_DIR} to PATH in your shell profile so \`repo\` works outside this script"
fi
