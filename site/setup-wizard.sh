#!/usr/bin/env bash
# Interactive Beskid superrepo setup (docs, full dev, infra).
set -euo pipefail

SITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUPERREPO_ROOT="$(cd "${SITE_DIR}/.." && pwd)"
SCRIPTS="${SUPERREPO_ROOT}/scripts"

# shellcheck source=../scripts/lib/output.sh
source "${SCRIPTS}/lib/output.sh"

PROFILE=""
INSTALL_DEPS=0
START_WEBSITE=0
COPY_WEBSITE_ENV=0
SETUP_AUTH=0
SUBMODULE_PATHS=()
DEPS_GROUP="beskid"

usage() {
  cat <<'EOF'
Beskid setup wizard — run from superrepo root via: just setup

Profiles:
  1  Docs & website (bun, beskid_web_common, site env)
  2  Full developer (toolchain + all submodules)
  3  Infra operator (tofu, bao, just, beskid_infra)
  4  Custom step-by-step
  q  Quit
EOF
}

pick_profile() {
  echo ""
  echo "Beskid setup wizard"
  echo "==================="
  usage
  echo ""
  read -r -p "Choose profile [1]: " choice
  choice="${choice:-1}"
  case "${choice}" in
    1 | docs)
      PROFILE=docs
      DEPS_GROUP="beskid"
      INSTALL_DEPS=1
      COPY_WEBSITE_ENV=1
      SUBMODULE_PATHS=(beskid_web_common)
      ;;
    2 | full)
      PROFILE=full
      DEPS_GROUP="beskid"
      INSTALL_DEPS=1
      SUBMODULE_PATHS=()
      ;;
    3 | infra)
      PROFILE=infra
      DEPS_GROUP="infra"
      INSTALL_DEPS=1
      SUBMODULE_PATHS=(beskid_infra)
      ;;
    4 | custom)
      PROFILE=custom
      custom_menu
      ;;
    q | Q) exit 0 ;;
    *) die "Invalid choice: ${choice}" ;;
  esac
}

custom_menu() {
  INSTALL_DEPS=0
  SUBMODULE_PATHS=()
  DEPS_GROUP="beskid"

  if confirm "Install toolchain (install-deps.sh)?"; then
    INSTALL_DEPS=1
    read -r -p "Dependency group [beskid]: " g
    DEPS_GROUP="${g:-beskid}"
  fi

  if confirm "Sync git submodules?"; then
    echo "Submodule paths (space-separated, empty = all):"
    read -r -a SUBMODULE_PATHS || true
  fi

  if confirm "Copy site/website/.env from .env.example if missing?"; then
    COPY_WEBSITE_ENV=1
  fi

  if confirm "Copy site/auth/.env from .env.example if missing?"; then
    SETUP_AUTH=1
  fi

  if ! confirm "Run bun install at repo root?"; then
    export BESKID_SKIP_JS_INSTALL=1
  fi

  if confirm "Start site dev server (bun dev) when done?"; then
    START_WEBSITE=1
  fi
}

ensure_superrepo() {
  [[ -d "${SUPERREPO_ROOT}/site/website" ]] \
    || die "Expected superrepo layout (site/website missing)"
  [[ -x "${SCRIPTS}/setup-environment.sh" ]] \
    || die "Missing ${SCRIPTS}/setup-environment.sh"
}

copy_env_if_missing() {
  local example="$1" target="$2"
  if [[ -f "${target}" ]]; then
    ok "Already exists: ${target#${SUPERREPO_ROOT}/}"
    return 0
  fi
  if [[ ! -f "${example}" ]]; then
    warn "No example env: ${example#${SUPERREPO_ROOT}/}"
    return 0
  fi
  cp "${example}" "${target}"
  ok "Created ${target#${SUPERREPO_ROOT}/}"
}

run_install_deps() {
  section "Toolchain"
  if [[ "${INSTALL_DEPS}" != "1" ]]; then
    note "Skipped (profile choice)"
    return 0
  fi
  if confirm "Install missing tools for group '${DEPS_GROUP}'?"; then
    "${SCRIPTS}/install-deps.sh" --install --group "${DEPS_GROUP}"
  else
    "${SCRIPTS}/install-deps.sh" --check --group "${DEPS_GROUP}" || true
  fi
}

run_env_setup() {
  section "Repository sync"
  local -a args=(--submodules)
  if [[ ${#SUBMODULE_PATHS[@]} -gt 0 ]]; then
    args+=("${SUBMODULE_PATHS[@]}")
  fi
  "${SCRIPTS}/setup-environment.sh" "${args[@]}"
}

run_site_env() {
  section "Site configuration"
  if [[ "${COPY_WEBSITE_ENV}" == "1" || "${PROFILE}" == "docs" ]]; then
    copy_env_if_missing \
      "${SUPERREPO_ROOT}/site/website/.env.example" \
      "${SUPERREPO_ROOT}/site/website/.env"
  fi
  if [[ "${PROFILE}" == "docs" || "${SETUP_AUTH}" == "1" ]]; then
    copy_env_if_missing \
      "${SUPERREPO_ROOT}/site/auth/.env.example" \
      "${SUPERREPO_ROOT}/site/auth/.env"
  fi
}

print_next_steps() {
  section "Next steps"
  case "${PROFILE}" in
    docs)
      note "Docs dev:  cd site/website && bun dev  → http://localhost:4321"
      note "Optional:  cd site/auth && bun install && bun run dev  (port 8090)"
      ;;
    full)
      note "Compiler:  cd compiler && cargo build"
      note "Docs:      cd site/website && bun dev"
      note "Registry:  see pckg/README.md"
      ;;
    infra)
      note "Infra:     cd beskid_infra && just config-init && just plan"
      ;;
    *)
      note "See README.md and scripts/README.md"
      ;;
  esac
  note "Re-run anytime: just setup"
}

maybe_start_website() {
  if [[ "${START_WEBSITE}" != "1" ]]; then
    if [[ "${PROFILE}" != "docs" ]] || ! confirm "Start docs dev server now (bun dev)?"; then
      return 0
    fi
  fi
  if ! command -v bun >/dev/null 2>&1; then
    warn "bun not found — skip dev server"
    return 0
  fi
  section "Starting docs dev server"
  note "Press Ctrl+C to stop"
  cd "${SUPERREPO_ROOT}/site/website"
  exec bun dev
}

ensure_superrepo

if [[ $# -gt 0 ]]; then
  case "$1" in
    --profile)
      PROFILE="${2:?}"
      INSTALL_DEPS=1
      case "${PROFILE}" in
        docs) SUBMODULE_PATHS=(beskid_web_common) ;;
        infra) DEPS_GROUP=infra; SUBMODULE_PATHS=(beskid_infra) ;;
        full) SUBMODULE_PATHS=() ;;
        *) die "Unknown profile: ${PROFILE}" ;;
      esac
      ;;
    -h | --help) usage; exit 0 ;;
    *) die "Unknown argument: $1" ;;
  esac
else
  pick_profile
  if [[ "${PROFILE}" == "docs" ]]; then
    SETUP_AUTH=0
    if confirm "Also prepare site/auth .env for local OAuth hub?"; then
      SETUP_AUTH=1
    fi
  fi
fi

run_install_deps
run_env_setup
run_site_env
print_next_steps

if [[ "${PROFILE}" == "docs" ]]; then
  maybe_start_website
fi

ok "Setup complete"
