#!/usr/bin/env bash
# Pack and publish the production corelib and first-party template packages.
#
# The packaging + upload logic lives in the native pure-Node runner at
# scripts/ci/lib/corelib-publish-runner.mjs. This script builds
# beskid_cli, ensures the runtime bridge, and invokes that runner with host
# paths used by native runners.
#
# Run from the superrepo root. Assumes compiler (+ corelib), beskid_bsol, and
# beskid_templates submodules are initialised.
#
# Usage: corelib-publish.sh [version-bump] [--dry-run]
#   version-bump  patch | minor | major (default: patch)
#   --dry-run     build and validate every artifact without registry access
# Env: BESKID_PCKG_API_KEY (required unless --dry-run)
#      BESKID_PCKG_BASE_URL (default pckg.beskid-lang.org:8082)
set -euo pipefail

VERSION_BUMP="patch"
DRY_RUN=0
for argument in "$@"; do
  case "$argument" in
    patch|minor|major) VERSION_BUMP="$argument" ;;
    --dry-run) DRY_RUN=1 ;;
    *) echo "usage: corelib-publish.sh [patch|minor|major] [--dry-run]" >&2; exit 1 ;;
  esac
done

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export RUST_MIN_STACK="${RUST_MIN_STACK:-67108864}"

if [[ "$DRY_RUN" == 0 ]]; then
  : "${BESKID_PCKG_API_KEY:?BESKID_PCKG_API_KEY must be exported}"
  if [[ ! "$BESKID_PCKG_API_KEY" =~ ^bpk_[[:xdigit:]]{64}$ ]]; then
    echo "BESKID_PCKG_API_KEY must be a canonical bpk_ publisher token" >&2
    exit 1
  fi
fi
export BESKID_PCKG_BASE_URL="${BESKID_PCKG_BASE_URL:-https://pckg.beskid-lang.org:8082}"
export BESKID_PCKG_VERSION_BUMP="$VERSION_BUMP"
export BESKID_PUBLISH_DRY_RUN="$DRY_RUN"

# Resolve the corelib workspace root (mirrors resolveCorelibRoot).
if [[ -f "${ROOT}/CoreLib.bws" ]]; then
  CORELIB_ROOT="${ROOT}"
elif [[ -f "${ROOT}/compiler/corelib/CoreLib.bws" ]]; then
  CORELIB_ROOT="${ROOT}/compiler/corelib"
elif [[ -f "${ROOT}/compiler/CoreLib.bws" ]]; then
  CORELIB_ROOT="${ROOT}/compiler"
else
  echo "Could not resolve corelib workspace root" >&2; exit 1
fi
export CORELIB_ROOT="$CORELIB_ROOT"
export BESKID_CORELIB_ROOT="$CORELIB_ROOT"

TEMPLATES_ROOT="${BESKID_TEMPLATES_ROOT:-${ROOT}/beskid_templates}"
if [[ ! -f "${TEMPLATES_ROOT}/beskid_templates.bws" ]]; then
  echo "Could not resolve first-party templates workspace; initialize beskid_templates" >&2
  exit 1
fi
export BESKID_TEMPLATES_ROOT="$TEMPLATES_ROOT"

if [[ -f "${ROOT}/compiler/Cargo.toml" ]]; then
  COMPILER_ROOT="${ROOT}/compiler"
else
  COMPILER_ROOT="${ROOT}"
fi

RUNNER="${ROOT}/scripts/ci/lib/corelib-publish-runner.mjs"
[[ -f "$RUNNER" ]] || { echo "Missing publish runner: $RUNNER" >&2; exit 1; }

cd "$COMPILER_ROOT"
cargo build -p beskid_cli --release
export BESKID_CLI_BIN="${COMPILER_ROOT}/target/release/beskid_cli"
export BESKID_RUNTIME_PREFIX="${BESKID_RUNTIME_PREFIX:-${CARGO_TARGET_DIR:-${COMPILER_ROOT}/target}/native-runtime-kit}"
export BESKID_RUNTIME_KIT_PROFILE=release
bash scripts/stage-native-runtime-kit.sh

if command -v node >/dev/null 2>&1; then
  JS_RUNTIME="$(command -v node)"
elif command -v bun >/dev/null 2>&1; then
  JS_RUNTIME="$(command -v bun)"
elif [[ -x /opt/homebrew/bin/node ]]; then
  JS_RUNTIME=/opt/homebrew/bin/node
else
  echo "node or bun is required to run the package publisher" >&2
  exit 1
fi
"$JS_RUNTIME" "$RUNNER"
