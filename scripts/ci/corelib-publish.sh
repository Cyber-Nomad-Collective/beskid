#!/usr/bin/env bash
# Publish the corelib workspace to the pckg registry.
#
# Ports the Dagger function corelibPublish() in
# beskid_infra/dagger/src/corelib-gate.ts onto a Blacksmith runner. The actual
# packaging + upload logic lives in the (Dagger-agnostic, pure-Node) runner at
# beskid_infra/dagger/src/lib/corelib-publish-runner.mjs — this script builds
# beskid_cli, ensures the runtime bridge, and invokes that runner with host
# paths instead of the Dagger container mounts.
#
# Run from the superrepo root. Assumes the compiler (+ corelib) and beskid_bsol
# submodules are initialised.
#
# Usage: corelib-publish.sh [version-bump]
#   version-bump  patch | minor | major (default: patch)
# Env: BESKID_PCKG_API_KEY (required), BESKID_PCKG_BASE_URL (default pckg.beskid-lang.org)
set -euo pipefail

VERSION_BUMP="${1:-patch}"
case "$VERSION_BUMP" in
  patch|minor|major) ;;
  *) echo "version-bump must be patch, minor, or major" >&2; exit 1 ;;
esac

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export RUST_MIN_STACK="${RUST_MIN_STACK:-67108864}"

: "${BESKID_PCKG_API_KEY:?BESKID_PCKG_API_KEY must be exported}"
export BESKID_PCKG_BASE_URL="${BESKID_PCKG_BASE_URL:-https://pckg.beskid-lang.org}"
export BESKID_PCKG_VERSION_BUMP="$VERSION_BUMP"

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

if [[ -f "${ROOT}/compiler/Cargo.toml" ]]; then
  COMPILER_ROOT="${ROOT}/compiler"
else
  COMPILER_ROOT="${ROOT}"
fi

RUNNER="${ROOT}/beskid_infra/dagger/src/lib/corelib-publish-runner.mjs"
[[ -f "$RUNNER" ]] || { echo "Missing publish runner: $RUNNER" >&2; exit 1; }

cd "$COMPILER_ROOT"
cargo build -p beskid_cli --release
bash scripts/ensure-runtime-bridge.sh
export BESKID_CLI_BIN="${COMPILER_ROOT}/target/release/beskid_cli"

node "$RUNNER"
