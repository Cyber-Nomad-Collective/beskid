# Shared terminal helpers for Beskid setup scripts.
# shellcheck shell=bash

section() {
  echo ""
  echo "── $* ──"
}

ok() {
  echo "  ✓ $*"
}

warn() {
  echo "  ! $*" >&2
}

note() {
  echo "    $*"
}

fail() {
  echo "  ✗ $*" >&2
}

die() {
  fail "$*"
  exit 1
}

confirm() {
  local prompt="${1:-Continue?}"
  if [[ "${BESKID_YES:-}" == "1" ]]; then
    return 0
  fi
  read -r -p "${prompt} [y/N] " reply
  [[ "${reply}" =~ ^[Yy]$ ]]
}

# Bash 3.2 (macOS) has no mapfile — read command output into a named array.
beskid_read_array() {
  local _var="$1"
  shift
  local _line
  eval "${_var}=()"
  while IFS= read -r _line; do
    [[ -z "${_line}" ]] && continue
    eval "${_var}+=(\"\${_line}\")"
  done < <("$@")
}

path_contains_dir() {
  local dir="$1"
  case ":${PATH}:" in
    *":${dir}:"*) return 0 ;;
    *) return 1 ;;
  esac
}
