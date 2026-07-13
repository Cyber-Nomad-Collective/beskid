#!/usr/bin/env bash
# Open VSX publish: build the LSP binary natively, bundle the VS Code
# extension, and publish to Open VSX with retry/backoff.
#
# The pipeline runs natively on a GitHub-hosted OS runner and surfaces every
# step in the log.
#
# Run from the superrepo root. Assumes the compiler and beskid_vscode submodules
# are already initialised, and that OVSX_TOKEN is exported.
#
# Usage: open-vsx-publish.sh <platform> <bin-name> [rust-target]
#   platform    e.g. linux-x64, darwin-arm64, darwin-x64, win32-x64
#   bin-name    e.g. beskid_lsp (beskid_lsp.exe on win32)
#   rust-target optional cross-compile target, e.g. x86_64-apple-darwin
set -euo pipefail

PLATFORM="${1:?platform (e.g. linux-x64)}"
BIN_NAME="${2:?bin-name (e.g. beskid_lsp)}"
RUST_TARGET="${3:-}"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}"

: "${OVSX_TOKEN:?OVSX_TOKEN must be exported}"
[[ -d beskid_vscode ]] || { echo "beskid_vscode submodule not initialised" >&2; exit 1; }
[[ -d compiler ]]     || { echo "compiler submodule not initialised" >&2; exit 1; }

# ---------------------------------------------------------------------------
# 1. Build the LSP release binary. Native cargo build (cross-target when
#    rust-target is set), mirroring buildBeskidLsp() / compilerReleaseBinPath().
# ---------------------------------------------------------------------------
cargo_args=(cargo build -p beskid_lsp --release)
if [[ -n "$RUST_TARGET" ]]; then
  rustup target add "$RUST_TARGET" >/dev/null 2>&1 || true
  cargo_args+=(--target "$RUST_TARGET")
fi
echo "==> build LSP: ${cargo_args[*]}"
(cd compiler && "${cargo_args[@]}")

if [[ -n "$RUST_TARGET" ]]; then
  BIN_SRC="compiler/target/${RUST_TARGET}/release/${BIN_NAME}"
else
  BIN_SRC="compiler/target/release/${BIN_NAME}"
fi
[[ -f "$BIN_SRC" ]] || { echo "Missing LSP binary: $BIN_SRC" >&2; exit 1; }

# ---------------------------------------------------------------------------
# 2. Place the binary in the platform server dir expected by the extension.
# ---------------------------------------------------------------------------
SERVER_DIR="beskid_vscode/server/${PLATFORM}"
mkdir -p "$SERVER_DIR"
BIN_DST="${SERVER_DIR}/${BIN_NAME}"
cp -f "$BIN_SRC" "$BIN_DST"
if [[ ! "$PLATFORM" == win32-* ]]; then
  chmod +x "$BIN_DST"
fi
echo "Open VSX: placed ${BIN_NAME} for platform=${PLATFORM}"

# ---------------------------------------------------------------------------
# 3. Resolve extension version from git tags + commit count (or GITHUB_REF tag).
#    Ported from resolve-extension-version.sh.
# ---------------------------------------------------------------------------
resolve_version() {
  local ref_name="${GITHUB_REF_NAME:-}" ref_type="${GITHUB_REF_TYPE:-}"
  if [[ "$ref_type" == "tag" ]] && [[ "$ref_name" =~ ^v?(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]]; then
    printf '%s' "${ref_name#v}"; return 0
  fi
  local latest major minor patch commits
  latest="$(git describe --tags --abbrev=0 --match 'v[0-9]*.[0-9]*.[0-9]*' 2>/dev/null)" || return 0
  [[ "$latest" =~ ^v?(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]] || { echo "Tag \`${latest}\` is not semver" >&2; return 1; }
  major="${BASH_REMATCH[1]}"; minor="${BASH_REMATCH[2]}"; patch="${BASH_REMATCH[3]}"
  commits="$(git rev-list --count "${latest}..HEAD")"
  if [[ "$commits" -le 0 ]]; then
    printf '%s.%s.%s' "$major" "$minor" "$patch"
  else
    printf '%s.%s.%s' "$major" "$minor" "$((patch + commits))"
  fi
}

# ---------------------------------------------------------------------------
# 4. Override the extension version in package.json (restored on exit).
# ---------------------------------------------------------------------------
cd beskid_vscode
previous_version=""
restore_version() {
  if [[ -n "$previous_version" ]]; then
    node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync('package.json','utf8'));d.version=process.env.PV;fs.writeFileSync('package.json',JSON.stringify(d,null,2)+'\n');" PV="$previous_version"
  fi
}
trap restore_version EXIT

icon="$(node -p "require('./package.json').icon || ''")"
[[ -n "$icon" ]] || { echo "Missing \`icon\` in package.json" >&2; exit 1; }
[[ -f "$icon" ]] || { echo "Extension icon file not found: $icon" >&2; exit 1; }
case "$icon" in *.svg|*.SVG) echo "Icon must be PNG/JPG (found SVG): $icon" >&2; exit 1;; esac

target="$(resolve_version || true)"
if [[ -n "$target" ]]; then
  [[ "$target" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$ ]] || { echo "Derived version \`$target\` is not valid semver" >&2; exit 1; }
  previous_version="$(node -p "require('./package.json').version")"
  if [[ "$previous_version" != "$target" ]]; then
    node -e "const fs=require('fs');const t=process.argv[1];const d=JSON.parse(fs.readFileSync('package.json','utf8'));const c=String(d.version??'').trim();d.version=t;fs.writeFileSync('package.json',JSON.stringify(d,null,2)+'\n');console.log('Open VSX: overriding extension version '+c+' -> '+t);" "$target"
  else
    echo "Open VSX: using extension version $previous_version"
  fi
fi

echo "==> beskid_vscode: bun install --frozen-lockfile"
bun install --frozen-lockfile
echo "==> beskid_vscode: bun run build"
bun run build

publisher="$(node -p "require('./package.json').publisher")"
[[ -n "$publisher" ]] || { echo "Missing \`publisher\` in package.json" >&2; exit 1; }

# Idempotent namespace creation (already-exists is fine).
set +e
create_out="$(bunx ovsx create-namespace "$publisher" -p "$OVSX_TOKEN" 2>&1)"
create_code=$?
set -e
if [[ "$create_code" -ne 0 ]]; then
  if ! printf '%s' "$create_out" | grep -qi 'already exists'; then
    echo "Open VSX namespace setup failed for publisher \`$publisher\`." >&2
    echo "$create_out" >&2
    exit 1
  fi
fi

mkdir -p dist
vsix="dist/beskid-${PLATFORM}.vsix"
echo "==> vsce package -> $vsix"
bunx @vscode/vsce package --target "$PLATFORM" --out "$vsix"

# ---------------------------------------------------------------------------
# 5. Publish with 4-attempt exponential backoff on transient errors.
#    Preserve the original bundle/publish semantics.
# ---------------------------------------------------------------------------
max_attempts=4
base_delay=3
for ((attempt = 1; attempt <= max_attempts; attempt++)); do
  set +e
  publish_out="$(bunx ovsx publish -p "$OVSX_TOKEN" "$vsix" 2>&1)"
  publish_code=$?
  set -e
  if [[ "$publish_code" -eq 0 ]]; then
    [[ "$attempt" -gt 1 ]] && echo "Open VSX: publish succeeded on retry ${attempt}/${max_attempts}"
    echo "Open VSX: publish complete (${PLATFORM})"
    exit 0
  fi
  if [[ "$attempt" -lt "$max_attempts" ]] && printf '%s' "$publish_out" | grep -Eiq '(status 50[0-9]|bad gateway|gateway timeout|timed out|econnreset|econnrefused|service unavailable)'; then
    delay=$((base_delay * (2 ** (attempt - 1))))
    echo "Open VSX: publish attempt ${attempt}/${max_attempts} failed with transient error; retrying in ${delay}s..." >&2
    sleep "$delay"
    continue
  fi
  echo "Open VSX: publish failed after ${attempt} attempt(s). Output follows." >&2
  echo "$publish_out" >&2
  exit 1
done
