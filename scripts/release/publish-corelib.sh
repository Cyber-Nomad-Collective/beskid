#!/usr/bin/env bash
# Pack and publish the production corelib closure and the first-party templates
# to pckg, by hand from the Mac. No Woodpecker lane holds the registry key.
#
# Usage: publish-corelib.sh --bundle <toolchain-prefix> --key <key-file>
#                           [--version patch|minor|major|X.Y.Z] [--base-url <url>]
#                           [--templates-root <dir>] [--dry-run]
#
#   --bundle  extracted, verified release bundle (bin/beskid, beskid_corelib, ...)
#   --key     file whose first line is the bpk_ publisher key (mode 600 or stricter)
#   --version version policy, default patch; an exact version resumes cleanly
#   --dry-run run every check and pack every artifact, write nothing to the registry
#
# Before the first registry write the runner checks that the key's subject owns
# every existing package, that every artifact packs with its API docs, that tags
# are unique per package and that every version is newer than the published one.
# A package already published at its planned version is skipped, so re-running
# after an interruption resumes from registry state. A relative version policy is
# pinned in a plan file (BESKID_PUBLISH_STATE_DIR, default ~/.beskid/publish)
# until the run completes, so a resume does not bump a second time.
set -euo pipefail

usage() {
  echo "usage: publish-corelib.sh --bundle <toolchain-prefix> --key <key-file> [--version patch|minor|major|X.Y.Z] [--base-url <url>] [--templates-root <dir>] [--dry-run]" >&2
  exit 2
}
die() { echo "publish-corelib: $*" >&2; exit 1; }

BUNDLE="" KEY_FILE="" VERSION_BUMP=patch BASE_URL="" TEMPLATES_ARG="" DRY_RUN=0
while (( $# )); do
  case "$1" in
    --bundle) (( $# >= 2 )) || usage; BUNDLE="$2"; shift 2 ;;
    --key) (( $# >= 2 )) || usage; KEY_FILE="$2"; shift 2 ;;
    --version) (( $# >= 2 )) || usage; VERSION_BUMP="$2"; shift 2 ;;
    --base-url) (( $# >= 2 )) || usage; BASE_URL="$2"; shift 2 ;;
    --templates-root) (( $# >= 2 )) || usage; TEMPLATES_ARG="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage ;;
    *) echo "publish-corelib: unknown argument: $1" >&2; usage ;;
  esac
done
[[ -n "$BUNDLE" ]] || { echo "publish-corelib: --bundle is required" >&2; usage; }
if [[ -z "$KEY_FILE" && "$DRY_RUN" == 0 ]]; then
  echo "publish-corelib: --key is required unless --dry-run" >&2; usage
fi
[[ "$VERSION_BUMP" =~ ^(patch|minor|major|[0-9]+\.[0-9]+\.[0-9]+)$ ]] ||
  die '--version must be patch, minor, major, or an exact MAJOR.MINOR.PATCH version'

# The key is read from a file, never from argv or the inherited environment.
unset BESKID_PCKG_API_KEY
if [[ -n "$KEY_FILE" ]]; then
  [[ -f "$KEY_FILE" && ! -L "$KEY_FILE" ]] || die "key file $KEY_FILE is not a regular file"
  # GNU stat first: on GNU `stat -f` means file-system status and `%Lp` would be read as a second
  # file. BSD/macOS stat rejects `-c`, so the fallback `-f %Lp` runs only there.
  mode="$(stat -c %a "$KEY_FILE" 2>/dev/null || stat -f %Lp "$KEY_FILE" 2>/dev/null || true)"
  [[ "$mode" =~ ^[0-7]+$ ]] || die "cannot read the mode of key file $KEY_FILE"
  (( (8#$mode & 8#077) == 0 )) || die "key file $KEY_FILE must not be readable by group or others (chmod 600)"
  key_line=""
  IFS= read -r key_line < "$KEY_FILE" || [[ -n "$key_line" ]] || die "key file $KEY_FILE is empty"
  key_line="${key_line%$'\r'}"
  [[ "$key_line" =~ ^bpk_[[:xdigit:]]{64}$ ]] || die "key file $KEY_FILE must start with a canonical bpk_ publisher key"
  export BESKID_PCKG_API_KEY="$key_line"
fi
unset key_line

export BESKID_PCKG_BASE_URL="${BASE_URL:-${BESKID_PCKG_BASE_URL:-https://pckg.beskid-lang.org}}"
export BESKID_PCKG_VERSION_BUMP="$VERSION_BUMP"
export BESKID_PUBLISH_DRY_RUN="$DRY_RUN"
export RUST_MIN_STACK="${RUST_MIN_STACK:-67108864}"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# The qualified bundle: a real directory with the CLI, Corelib and runtime kits.
[[ -d "$BUNDLE" && ! -L "$BUNDLE" ]] || die '--bundle must be a real bundle directory'
PREFIX="$(cd "$BUNDLE" && pwd -P)"
case "$(uname -s):$(uname -m)" in
  Linux:x86_64) TARGET=x86_64-unknown-linux-gnu ;;
  Darwin:arm64) TARGET=aarch64-apple-darwin ;;
  *) die 'package publication requires a maintained native Linux or macOS bundle' ;;
esac
for required in bin/beskid release-version.txt beskid_corelib/.beskid-bundle.sha256 \
  "lib/beskid-runtime/abi-5/$TARGET/debug/abi.json" \
  "lib/beskid-runtime/abi-5/$TARGET/release/abi.json"; do
  [[ -f "$PREFIX/$required" && ! -L "$PREFIX/$required" ]] || die "bundle omitted regular $required"
done
export BESKID_TOOLCHAIN_PREFIX="$PREFIX"
export BESKID_CLI_BIN="$PREFIX/bin/beskid"
export BESKID_CORELIB_ROOT="$PREFIX/beskid_corelib"
export CORELIB_ROOT="$BESKID_CORELIB_ROOT"
export BESKID_RUNTIME_PREFIX="$PREFIX"
[[ -x "$BESKID_CLI_BIN" ]] || die 'bundle bin/beskid is not executable'

TEMPLATES_ROOT="${TEMPLATES_ARG:-${BESKID_TEMPLATES_ROOT:-${ROOT}/beskid_templates}}"
[[ -f "${TEMPLATES_ROOT}/beskid_templates.bws" ]] ||
  die "could not resolve the templates workspace at $TEMPLATES_ROOT; initialize beskid_templates"
export BESKID_TEMPLATES_ROOT="$TEMPLATES_ROOT"

if command -v node >/dev/null 2>&1; then
  JS_RUNTIME="$(command -v node)"
elif [[ -x /opt/homebrew/bin/node ]]; then
  JS_RUNTIME=/opt/homebrew/bin/node
else
  die 'node is required to run the package publisher'
fi

VERSION="$(< "$PREFIX/release-version.txt")"
printf '%s\n' "$VERSION" | cmp -s - "$PREFIX/release-version.txt" ||
  die 'release-version.txt must contain exactly one version line'
"$JS_RUNTIME" "$ROOT/scripts/ci/release-version.mjs" "$VERSION" --stable-only >/dev/null
[[ "$("$BESKID_CLI_BIN" --version)" == "beskid $VERSION" ]] || die 'bundle CLI version does not match its release version'
# Authored sources are comparison inputs, not the CLI's installed Corelib root.
"$JS_RUNTIME" "$ROOT/scripts/ci/verify-release-corelib-bundle.mjs" --verify \
  "$ROOT/compiler/corelib" "$BESKID_CORELIB_ROOT"

STATE_DIR="${BESKID_PUBLISH_STATE_DIR:-$HOME/.beskid/publish}"
export BESKID_PUBLISH_PLAN_FILE="$STATE_DIR/corelib-plan-$VERSION.json"

exec "$JS_RUNTIME" "$ROOT/scripts/release/lib/corelib-publish-runner.mjs"
