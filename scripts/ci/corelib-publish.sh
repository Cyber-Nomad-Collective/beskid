#!/usr/bin/env bash
# Pack and publish the production corelib and first-party template packages.
#
# The packaging + upload logic lives in the native pure-Node runner at
# scripts/ci/lib/corelib-publish-runner.mjs. Require a qualified direct-install
# release bundle; never build or use a standalone compiler for publication.
#
# Run from the superrepo root. Assumes compiler (+ corelib), beskid_bsol, and
# beskid_templates submodules are initialised.
#
# Usage: corelib-publish.sh [version-bump] [--dry-run]
#   version-bump  patch | minor | major (default: patch)
#   --dry-run     build and validate every artifact without registry access
# Env: BESKID_PCKG_API_KEY (required unless --dry-run)
#      BESKID_PCKG_BASE_URL (default https://pckg.beskid-lang.org)
#      BESKID_TOOLCHAIN_PREFIX (required extracted, verified release bundle)
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
export BESKID_PCKG_BASE_URL="${BESKID_PCKG_BASE_URL:-https://pckg.beskid-lang.org}"
export BESKID_PCKG_VERSION_BUMP="$VERSION_BUMP"
export BESKID_PUBLISH_DRY_RUN="$DRY_RUN"

: "${BESKID_TOOLCHAIN_PREFIX:?BESKID_TOOLCHAIN_PREFIX must name a qualified extracted release bundle}"
[[ -d "$BESKID_TOOLCHAIN_PREFIX" && ! -L "$BESKID_TOOLCHAIN_PREFIX" ]] || {
  echo 'BESKID_TOOLCHAIN_PREFIX must be a real bundle directory' >&2; exit 1;
}
PREFIX="$(cd "$BESKID_TOOLCHAIN_PREFIX" && pwd -P)"
for override in BESKID_CLI_BIN BESKID_CORELIB_ROOT CORELIB_ROOT BESKID_RUNTIME_PREFIX; do
  expected="$PREFIX"
  [[ "$override" != BESKID_CLI_BIN ]] || expected="$PREFIX/bin/beskid"
  [[ "$override" != BESKID_CORELIB_ROOT && "$override" != CORELIB_ROOT ]] || expected="$PREFIX/beskid_corelib"
  [[ -z "${!override:-}" || "${!override}" == "$expected" ]] || {
    echo "$override conflicts with the qualified BESKID_TOOLCHAIN_PREFIX" >&2; exit 1;
  }
done
export BESKID_TOOLCHAIN_PREFIX="$PREFIX"
export BESKID_CLI_BIN="$PREFIX/bin/beskid"
export BESKID_CORELIB_ROOT="$PREFIX/beskid_corelib"
export CORELIB_ROOT="$BESKID_CORELIB_ROOT"
export BESKID_RUNTIME_PREFIX="$PREFIX"

case "$(uname -s):$(uname -m)" in
  Linux:x86_64) TARGET=x86_64-unknown-linux-gnu ;;
  Darwin:arm64) TARGET=aarch64-apple-darwin ;;
  *) echo 'Package publication requires a maintained native Linux or macOS bundle' >&2; exit 1 ;;
esac
for required in bin/beskid release-version.txt beskid_corelib/.beskid-bundle.sha256 \
  "lib/beskid-runtime/abi-5/$TARGET/debug/abi.json" \
  "lib/beskid-runtime/abi-5/$TARGET/release/abi.json"; do
  [[ -f "$PREFIX/$required" && ! -L "$PREFIX/$required" ]] || {
    echo "Qualified toolchain omitted regular $required" >&2; exit 1;
  }
done
[[ -x "$BESKID_CLI_BIN" ]] || { echo 'Qualified bin/beskid is not executable' >&2; exit 1; }

TEMPLATES_ROOT="${BESKID_TEMPLATES_ROOT:-${ROOT}/beskid_templates}"
if [[ ! -f "${TEMPLATES_ROOT}/beskid_templates.bws" ]]; then
  echo "Could not resolve first-party templates workspace; initialize beskid_templates" >&2
  exit 1
fi
export BESKID_TEMPLATES_ROOT="$TEMPLATES_ROOT"

RUNNER="${ROOT}/scripts/ci/lib/corelib-publish-runner.mjs"
[[ -f "$RUNNER" ]] || { echo "Missing publish runner: $RUNNER" >&2; exit 1; }

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
VERSION="$(< "$PREFIX/release-version.txt")"
printf '%s\n' "$VERSION" | cmp -s - "$PREFIX/release-version.txt" || {
  echo 'Qualified release-version.txt must contain exactly one version line' >&2; exit 1;
}
"$JS_RUNTIME" "$ROOT/scripts/ci/release-version.mjs" "$VERSION" --stable-only >/dev/null
[[ "$("$BESKID_CLI_BIN" --version)" == "beskid $VERSION" ]] || {
  echo 'Qualified CLI version does not match its release bundle' >&2; exit 1;
}
# Authored sources are comparison inputs, not the CLI's installed Corelib root.
"$JS_RUNTIME" "$ROOT/scripts/ci/verify-release-corelib-bundle.mjs" --verify \
  "$ROOT/compiler/corelib" "$BESKID_CORELIB_ROOT"
"$JS_RUNTIME" "$RUNNER"
