#!/usr/bin/env bash
# Build a single compiler release artifact (CLI or LSP) for the host runner's
# native target.
#
# Builds natively on the matching OS runner. Cross-platform coverage comes
# from the calling workflow's OS matrix (linux on ubuntu, mac on macos, windows
# on windows) — each target builds on its native host, which avoids the
# fragile Linux→macOS/Windows cross-linker setup behind QEMU/binfmt.
#
# Stamps the resolved release version into crates/beskid_cli/Cargo.toml, builds
# the package in release mode, and copies the binary to <asset-name> in the
# caller's cwd.
#
# Usage: build-release-artifact.sh <package> <binary> <target> <asset-name> <release-version>
#   package         beskid_cli | beskid_lsp
#   binary          beskid_cli | beskid_lsp
#   target          x86_64-unknown-linux-gnu | aarch64-apple-darwin | x86_64-pc-windows-msvc
#   asset-name      output file name (e.g. beskid-linux-amd64)
#   release-version resolved semver (from compute-cli-version.sh)
set -euo pipefail

PACKAGE="${1:?package (beskid_cli | beskid_lsp)}"
BINARY="${2:?binary name}"
TARGET="${3:?rust target triple}"
ASSET_NAME="${4:?asset-name}"
RELEASE_VERSION="${5:?release-version}"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

case "$TARGET" in
  x86_64-unknown-linux-gnu)  runner_os="Linux" ;;
  aarch64-apple-darwin)      runner_os="macOS" ;;
  x86_64-pc-windows-msvc)    runner_os="Windows" ;;
  *) echo "unsupported release target: $TARGET" >&2; exit 1 ;;
esac

export RUST_MIN_STACK="${RUST_MIN_STACK:-67108864}"

cd "${ROOT}/compiler"

# Stamp the release version into the CLI Cargo.toml (shared by cli + lsp).
CARGO_TOML="crates/beskid_cli/Cargo.toml"
if [[ "$runner_os" == "Windows" ]]; then
  powershell -NoProfile -Command "(Get-Content ${CARGO_TOML}) -replace '^version = \".*\"', 'version = \"${RELEASE_VERSION}\"' | Set-Content ${CARGO_TOML}"
else
  sed -i.bak "s/^version = \".*\"/version = \"${RELEASE_VERSION}\"/" "$CARGO_TOML" && rm -f "${CARGO_TOML}.bak"
fi

# Add the Rust target and build natively on the host.
rustup target add "$TARGET" >/dev/null 2>&1 || true
cargo build -p "$PACKAGE" --release --target "$TARGET"

# Resolve the built binary path (Windows targets get .exe).
BIN_BASE="target/${TARGET}/release/${BINARY}"
if [[ "$runner_os" == "Windows" ]]; then
  BIN_BASE="${BIN_BASE}.exe"
fi
[[ -f "$BIN_BASE" ]] || { echo "Missing built artifact: $BIN_BASE" >&2; exit 1; }

cp -f "$BIN_BASE" "${ROOT}/${ASSET_NAME}"
echo "built ${ASSET_NAME} (${PACKAGE} ${RELEASE_VERSION} for ${TARGET})"
