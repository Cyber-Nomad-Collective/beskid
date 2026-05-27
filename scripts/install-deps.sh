#!/usr/bin/env bash
# Check and optionally install Beskid toolchain from repo-deps.json.
#
# Usage:
#   ./scripts/install-deps.sh              # check group infra
#   ./scripts/install-deps.sh --install    # install missing (interactive)
#   ./scripts/install-deps.sh --install -y --group beskid
#   ./scripts/install-deps.sh --list-groups
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/output.sh
source "${SCRIPT_DIR}/lib/output.sh"
# shellcheck source=lib/detect-os.sh
source "${SCRIPT_DIR}/lib/detect-os.sh"
# shellcheck source=lib/install-methods.sh
source "${SCRIPT_DIR}/lib/install-methods.sh"
# shellcheck source=lib/deps-check.sh
source "${SCRIPT_DIR}/lib/deps-check.sh"

MODE="check"
GROUP="infra"
BESKID_YES=0
TOOL_FILTER=""

usage() {
  cat <<'EOF'
Usage: install-deps.sh [options]

Options:
  --check          Report missing tools (default)
  --install        Install missing tools for this platform
  -y, --yes        Non-interactive install (with --install)
  --group NAME     Tool group from repo-deps.json (default: infra)
  --tool NAME      Only check/install one tool
  --list-groups    Print available groups
  -h, --help       Show help

Groups: infra (tofu, bao, just, jq, git), beskid (full dev), all

Environment:
  BESKID_LOCAL_BIN  Target for github_release binaries (default: ~/.local/bin)

Platform installers:
  macOS     Homebrew
  Linux     apt, dnf, pacman, snap, Homebrew, install scripts, GitHub releases
  Windows   winget, scoop, choco, PowerShell installers, GitHub releases
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --check) MODE="check" ;;
    --install) MODE="install" ;;
    -y | --yes) BESKID_YES=1 ;;
    --group) GROUP="${2:?}"; shift ;;
    --tool) TOOL_FILTER="${2:?}"; shift ;;
    --list-groups)
      jq -r '.groups | to_entries[] | "\(.key)\t\(.value.description)"' "$(beskid_deps_json)" | column -t -s $'\t'
      exit 0
      ;;
    -h | --help) usage; exit 0 ;;
    *) die "Unknown option: $1 (try --help)" ;;
  esac
  shift
done

export BESKID_YES

DEPS_JSON="$(beskid_deps_json)"
[[ -f "${DEPS_JSON}" ]] || die "Missing ${DEPS_JSON}"

beskid_detect_platform
[[ "${BESKID_OS}" != "unknown" ]] || die "Unsupported OS: $(uname -s)"

section "Platform"
ok "$(beskid_platform_label)"

if ! command -v jq >/dev/null 2>&1; then
  warn "jq is required to read repo-deps.json"
  if [[ "${MODE}" == "install" ]] && confirm "Install jq now (best-effort)?"; then
    # shellcheck source=lib/output.sh
    source "${SCRIPT_DIR}/lib/install-methods.sh"
    case "${BESKID_OS}" in
      darwin) beskid_install_homebrew jq ;;
      linux)
        if command -v apt-get >/dev/null 2>&1; then
          beskid_install_apt jq
        elif command -v brew >/dev/null 2>&1; then
          beskid_install_homebrew jq
        else
          die "Install jq via your package manager"
        fi
        ;;
      windows) beskid_install_winget "jqlang.jq" false ;;
      *) die "Install jq manually" ;;
    esac
  fi
  command -v jq >/dev/null 2>&1 || die "Install jq and re-run"
fi

jq -e --arg g "${GROUP}" '.groups[$g]' "${DEPS_JSON}" >/dev/null \
  || die "Unknown group: ${GROUP} (try --list-groups)"

beskid_read_array TOOLS beskid_group_tools "${GROUP}" "${DEPS_JSON}"
if [[ -n "${TOOL_FILTER}" ]]; then
  TOOLS=("${TOOL_FILTER}")
fi

MISSING=()
INSTALLED=()

section "Toolchain (${GROUP})"

for tool in "${TOOLS[@]}"; do
  desc="$(beskid_tool_description "${tool}" "${DEPS_JSON}")"
  if beskid_tool_installed "${tool}" "${DEPS_JSON}"; then
    ver="$(beskid_tool_version_line "${tool}" "${DEPS_JSON}")"
    ok "${tool}: ${ver} — ${desc}"
    INSTALLED+=("${tool}")
  else
    fail "${tool}: missing — ${desc}"
    MISSING+=("${tool}")
  fi
done

if [[ ${#MISSING[@]} -eq 0 ]]; then
  section "Result"
  ok "All ${#TOOLS[@]} tools available"
  exit 0
fi

section "Result"
warn "${#MISSING[@]} missing: ${MISSING[*]}"

if [[ "${MODE}" != "install" ]]; then
  note "Run: ./scripts/install-deps.sh --install --group ${GROUP}"
  exit 1
fi

section "Install missing tools"
FAILED=()

for tool in "${MISSING[@]}"; do
  if ! [[ "${BESKID_YES}" == "1" ]]; then
    confirm "Install ${tool}?" || continue
  fi
  if beskid_install_tool "${tool}" "${DEPS_JSON}"; then
    ok "${tool} done"
  else
    fail "${tool} — all install methods failed"
    FAILED+=("${tool}")
  fi
done

if [[ ${#FAILED[@]} -gt 0 ]]; then
  die "Failed: ${FAILED[*]}"
fi

section "Verify"
exec "$0" --check --group "${GROUP}" ${TOOL_FILTER:+--tool "${TOOL_FILTER}"}
