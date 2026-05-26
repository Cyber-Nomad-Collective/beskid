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

path_contains_dir() {
  local dir="$1"
  case ":${PATH}:" in
    *":${dir}:"*) return 0 ;;
    *) return 1 ;;
  esac
}
