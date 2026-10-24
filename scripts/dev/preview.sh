#!/usr/bin/env bash
# Build a Beskid preview on the Mac and switch this machine to it.
#
# One run builds the CLI, language server, runtime bundle and VS Code extension,
# labels them 0.6.7-preview.N, installs the bundle side by side under
# ~/.beskid/toolchains/beskid-<label>-<target>, repoints the ~/.local/bin wrappers
# and the two VS Code user settings (beskid.cli.path, beskid.lsp.server.path) after
# a backup, installs the extension, keeps the last three previews, and reports the
# version, the compiler commits since the previous preview and the reload hint.
#
# Usage: preview.sh [--base-version X.Y.Z] [--skip-extension] [--dry-run]
#   --base-version  release the preview leads to (default 0.6.7)
#   --skip-extension  do not build or install the VS Code extension
#   --dry-run       print the label and every path, change nothing
#
# Test seams (all optional): BESKID_PREVIEW_HOME (default $HOME), BESKID_PREVIEW_TARGET,
# BESKID_PREVIEW_BUILDER (replaces scripts/ci/build-release-artifact.sh),
# BESKID_PREVIEW_CODE (the VS Code `code` command), BESKID_PREVIEW_SETTINGS.
set -euo pipefail

BASE_VERSION=0.6.7 SKIP_EXTENSION=0 DRY_RUN=0
KEEP_PREVIEWS=3

usage() {
  echo "usage: preview.sh [--base-version X.Y.Z] [--skip-extension] [--dry-run]" >&2
  exit 2
}
die() { echo "preview: $*" >&2; exit 1; }

while (( $# )); do
  case "$1" in
    --base-version) (( $# >= 2 )) || usage; BASE_VERSION="$2"; shift 2 ;;
    --skip-extension) SKIP_EXTENSION=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage ;;
    *) echo "preview: unknown argument: $1" >&2; usage ;;
  esac
done
[[ "$BASE_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || die '--base-version must be MAJOR.MINOR.PATCH'

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HOME_DIR="${BESKID_PREVIEW_HOME:-$HOME}"

if [[ -n "${BESKID_PREVIEW_TARGET:-}" ]]; then
  TARGET="$BESKID_PREVIEW_TARGET"
else
  [[ "$(uname -s)" == Darwin ]] || die 'preview builds run on the Mac only'
  case "$(uname -m)" in
    arm64) TARGET=aarch64-apple-darwin ;;
    x86_64) TARGET=x86_64-apple-darwin ;;
    *) die "unsupported Mac architecture $(uname -m)" ;;
  esac
fi
case "$TARGET" in
  aarch64-apple-darwin) PLATFORM_KEY=darwin-arm64 ;;
  x86_64-apple-darwin) PLATFORM_KEY=darwin-x64 ;;
  *) die "unsupported preview target $TARGET" ;;
esac

TOOLCHAINS="$HOME_DIR/.beskid/toolchains"
BIN_DIR="$HOME_DIR/.local/bin"
SETTINGS="${BESKID_PREVIEW_SETTINGS:-$HOME_DIR/Library/Application Support/Code/User/settings.json}"

# The next number is one past the highest installed preview of this base version.
last=0
shopt -s nullglob
for dir in "$TOOLCHAINS"/beskid-"$BASE_VERSION"-preview.*-"$TARGET"; do
  n="${dir##*/beskid-$BASE_VERSION-preview.}"; n="${n%-$TARGET}"
  [[ "$n" =~ ^[0-9]+$ ]] && (( n > last )) && last=$n
done
shopt -u nullglob
N=$((last + 1))
LABEL="$BASE_VERSION-preview.$N"
INSTALL_DIR="$TOOLCHAINS/beskid-$LABEL-$TARGET"
PREVIOUS_DIR=""
(( last == 0 )) || PREVIOUS_DIR="$TOOLCHAINS/beskid-$BASE_VERSION-preview.$last-$TARGET"

if [[ "$DRY_RUN" == 1 ]]; then
  cat <<PLAN
preview $LABEL (dry run, nothing changed)
  toolchain   $INSTALL_DIR
  wrappers    $BIN_DIR/beskid, $BIN_DIR/beskid_lsp
  settings    $SETTINGS (beskid.cli.path, beskid.lsp.server.path; backup first)
  extension   $([[ "$SKIP_EXTENSION" == 1 ]] && echo skipped || echo "$ROOT/beskid_vscode")
  keeps       the last $KEEP_PREVIEWS previews
PLAN
  exit 0
fi

command -v python3 >/dev/null || die 'python3 is required'
# The compiler pins its toolchain in rust-toolchain.toml and links Mac targets with rust-lld,
# which only rustup toolchains ship. Put the rustup proxies first so a Homebrew `cargo` earlier
# on PATH does not build with the wrong toolchain and fail to find rust-lld.
if [[ -x "${CARGO_HOME:-$HOME/.cargo}/bin/rustup" ]]; then
  export PATH="${CARGO_HOME:-$HOME/.cargo}/bin:$PATH"
fi
command -v rustup >/dev/null || die 'rustup is required (the compiler pins its toolchain and links with rust-lld)'
BUILDER="${BESKID_PREVIEW_BUILDER:-$ROOT/scripts/ci/build-release-artifact.sh}"
[[ -f "$BUILDER" ]] || die "builder $BUILDER not found"
[[ -d "$ROOT/compiler" ]] || die "$ROOT/compiler is missing; initialize the compiler submodule"
CODE_BIN=""
if [[ "$SKIP_EXTENSION" == 0 ]]; then
  CODE_BIN="${BESKID_PREVIEW_CODE:-$(command -v code || true)}"
  [[ -n "$CODE_BIN" ]] || CODE_BIN="/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
  [[ -x "$CODE_BIN" ]] || die 'VS Code `code` command not found (set BESKID_PREVIEW_CODE or use --skip-extension)'
  [[ -d "$ROOT/beskid_vscode" ]] || die "$ROOT/beskid_vscode is missing; initialize the extension submodule"
fi
[[ ! -e "$INSTALL_DIR" ]] || die "$INSTALL_DIR already exists"

stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT
asset=".preview-bundle-$LABEL.tar.gz"

# 1. CLI, language server, runtime kits, Corelib and prebuilt Mods in one bundle.
echo "==> building the $LABEL bundle for $TARGET"
(
  cd "$ROOT"
  MACOSX_DEPLOYMENT_TARGET="${MACOSX_DEPLOYMENT_TARGET:-11.0}" BESKID_PREVIEW_BUILD=1 BESKID_PREVIEW_LABEL="$LABEL" \
    bash "$BUILDER" beskid_bundle ignored "$TARGET" "$asset" "$LABEL"
)
[[ -f "$ROOT/$asset" ]] || die "the builder did not produce $asset"
mv "$ROOT/$asset" "$stage/bundle.tar.gz"
mkdir "$stage/bundle"
tar -xzf "$stage/bundle.tar.gz" -C "$stage/bundle"
shopt -s nullglob
bundle_dirs=("$stage"/bundle/beskid-*)
shopt -u nullglob
(( ${#bundle_dirs[@]} == 1 )) || die 'the bundle must contain exactly one beskid-* directory'
bundle_dir="${bundle_dirs[0]}"
for required in bin/beskid bin/beskid_lsp release-version.txt; do
  [[ -f "$bundle_dir/$required" ]] || die "the bundle omitted $required"
done
[[ "$(< "$bundle_dir/release-version.txt")" == "$LABEL" ]] || die 'the bundle is not labelled with the preview version'

# 2. The extension, bundling the preview language server.
vsix=""
if [[ "$SKIP_EXTENSION" == 0 ]]; then
  echo "==> packaging the VS Code extension"
  ext="$ROOT/beskid_vscode"
  mkdir -p "$ext/server/$PLATFORM_KEY" "$ext/dist"
  cp -f "$bundle_dir/bin/beskid_lsp" "$ext/server/$PLATFORM_KEY/beskid_lsp"
  chmod 755 "$ext/server/$PLATFORM_KEY/beskid_lsp"
  vsix="$stage/beskid-vscode-$LABEL-$PLATFORM_KEY.vsix"
  (
    cd "$ext"
    bun run build
    npm prune --omit=dev
    trap 'bun install' EXIT
    BESKID_VSCODE_SKIP_PREBUILD=1 bunx @vscode/vsce package "$LABEL" --no-git-tag-version --no-update-package-json --out "$vsix"
  )
  [[ -f "$vsix" ]] || die 'vsce did not produce the extension package'
fi

# 3. Everything built: install side by side, then switch over.
mkdir -p "$TOOLCHAINS" "$BIN_DIR"
mv "$bundle_dir" "$INSTALL_DIR"
{
  echo "compiler $(git -C "$ROOT/compiler" rev-parse HEAD 2>/dev/null || echo unknown)"
  echo "root $(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo unknown)"
} >"$INSTALL_DIR/preview-source.txt"

write_wrapper() {  # write_wrapper <name> <target-binary>
  local path="$BIN_DIR/$1"
  printf '#!/bin/sh\nexec "%s" "$@"\n' "$2" >"$path.new"
  chmod 755 "$path.new"
  mv -f "$path.new" "$path"
}
write_wrapper beskid "$INSTALL_DIR/bin/beskid"
write_wrapper beskid_lsp "$INSTALL_DIR/bin/beskid_lsp"

# Edit the two keys in place; every other byte of the file stays as it was.
mkdir -p "$(dirname "$SETTINGS")"
if [[ -f "$SETTINGS" ]]; then
  backup="$SETTINGS.bak-$(date +%Y-%m-%d-%H%M%S)"
  cp -p "$SETTINGS" "$backup"
else
  printf '{\n}\n' >"$SETTINGS"
  backup="(settings file did not exist; created)"
fi
python3 -I - "$SETTINGS" "beskid.cli.path=$INSTALL_DIR/bin/beskid" "beskid.lsp.server.path=$INSTALL_DIR/bin/beskid_lsp" <<'PY'
import json, re, sys
path, *pairs = sys.argv[1:]
text = open(path, encoding="utf-8").read()
for pair in pairs:
    key, value = pair.split("=", 1)
    literal = json.dumps(value)
    pattern = re.compile(r'("%s"\s*:\s*)"(?:[^"\\]|\\.)*"' % re.escape(key))
    if pattern.search(text):
        text = pattern.sub(lambda m: m.group(1) + literal, text, count=1)
        continue
    brace = text.index("{")
    rest = text[brace + 1:]
    body = re.sub(r'//[^\n]*|/\*.*?\*/', '', rest, flags=re.S).strip()
    indent = re.search(r'\n([ \t]+)"', rest)
    pad = indent.group(1) if indent else "    "
    comma = "," if body not in ("", "}") else ""
    text = text[:brace + 1] + '\n%s"%s": %s%s' % (pad, key, literal, comma) + text[brace + 1:]
open(path, "w", encoding="utf-8").write(text)
PY

if [[ -n "$vsix" ]]; then
  "$CODE_BIN" --install-extension "$vsix" --force
fi

# 4. Keep the last three previews of this base version; other toolchains are never touched.
all=()
shopt -s nullglob
for dir in "$TOOLCHAINS"/beskid-"$BASE_VERSION"-preview.*-"$TARGET"; do all+=("$dir"); done
shopt -u nullglob
removed=()
if (( ${#all[@]} > KEEP_PREVIEWS )); then
  while IFS= read -r old; do
    [[ "$old" != "$INSTALL_DIR" ]] || continue
    rm -rf "$old"; removed+=("${old##*/}")
  done < <(
    for dir in "${all[@]}"; do
      n="${dir##*/beskid-$BASE_VERSION-preview.}"; printf '%s %s\n' "${n%-$TARGET}" "$dir"
    done | sort -n | head -n $(( ${#all[@]} - KEEP_PREVIEWS )) | cut -d' ' -f2-
  )
fi

# 5. Report.
echo
echo "Preview $LABEL installed at $INSTALL_DIR"
echo "  wrappers      $BIN_DIR/beskid, $BIN_DIR/beskid_lsp"
echo "  settings      $SETTINGS (backup: $backup)"
[[ -z "$vsix" ]] || echo "  extension     installed from $(basename "$vsix")"
(( ${#removed[@]} == 0 )) || echo "  pruned        ${removed[*]}"
echo
echo "Changes since the previous preview:"
since=""
if [[ -n "$PREVIOUS_DIR" && -f "$PREVIOUS_DIR/preview-source.txt" ]]; then
  prev="$(awk '$1=="compiler"{print $2}' "$PREVIOUS_DIR/preview-source.txt")"
  if [[ -n "$prev" && "$prev" != unknown ]] && git -C "$ROOT/compiler" cat-file -e "$prev^{commit}" 2>/dev/null; then
    since="$(git -C "$ROOT/compiler" log --oneline "$prev..HEAD")"
    [[ -n "$since" ]] || since="(no new compiler commits)"
  fi
fi
[[ -n "$since" ]] && echo "$since" || echo "(no previous preview to compare with)"
echo
echo "Reload VS Code to use it: Command Palette > Developer: Reload Window."
