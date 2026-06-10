#!/usr/bin/env bash
# Init compiler (+ recursive corelib) for CI with tags available for version resolution.
# Usage: ./scripts/ci/init-compiler-submodule.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

init_submodule() {
  local path="$1"
  local default_url="$2"
  local url_env="$3"
  local token_env="$4"
  local recursive="${5:-false}"

  git submodule sync -- "$path"

  local url="${!url_env:-$default_url}"
  local token="${!token_env:-}"
  if [[ -n "$token" ]]; then
    case "$path" in
      compiler)
        url="https://x-access-token:${token}@github.com/Cyber-Nomad-Collective/beskid_compiler.git"
        ;;
      *)
        url="https://x-access-token:${token}@github.com/Cyber-Nomad-Collective/${path}.git"
        ;;
    esac
  fi

  git config "submodule.${path}.url" "$url"
  local update_args=(git -c protocol.version=2 submodule update --init "$path")
  if [[ "$recursive" == "true" ]]; then
    update_args=(git -c protocol.version=2 submodule update --init --recursive "$path")
  fi
  "${update_args[@]}"
}

echo "==> Init compiler submodule (recursive corelib)"
init_submodule compiler \
  "https://github.com/Cyber-Nomad-Collective/beskid_compiler.git" \
  COMPILER_SUBMODULE_URL \
  COMPILER_SUBMODULE_TOKEN \
  true

if [[ ! -f compiler/Cargo.toml ]]; then
  echo "compiler/Cargo.toml missing after submodule init" >&2
  exit 1
fi

echo "==> Init beskid_bsol submodule (compiler workspace path dep)"
bash ./scripts/ci/init-submodules.sh beskid_bsol

if [[ ! -f beskid_bsol/crates/bsol/Cargo.toml ]]; then
  echo "beskid_bsol/crates/bsol/Cargo.toml missing after submodule init" >&2
  exit 1
fi

echo "==> Fetch compiler tags for rolling semver"
(
  cd compiler
  git fetch origin --tags --force 2>/dev/null || git fetch origin --tags --force
  if git rev-parse --is-shallow-repository 2>/dev/null | grep -q true; then
    git fetch --unshallow 2>/dev/null || git fetch --depth=500 origin
    git fetch origin --tags --force 2>/dev/null || true
  fi
)
