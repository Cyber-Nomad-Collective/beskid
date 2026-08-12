#!/usr/bin/env bash
# Build a compiler release artifact or a complete direct-install bundle for the
# host runner's native target.
# native target.
#
# Builds natively on the matching OS runner. Cross-platform coverage comes
# from the calling workflow's OS matrix (linux on ubuntu, mac on macos, windows
# on windows) — each target builds on its native host, which avoids the
# fragile Linux→macOS/Windows cross-linker setup behind QEMU/binfmt.
#
# Stamps the resolved release version into the CLI, LSP, and updater crates,
# builds the requested package(s) in release mode, and copies the binary or
# archive to <asset-name> in the caller's cwd.
#
# Usage: build-release-artifact.sh <package> <binary> <target> <asset-name> <release-version>
#   package         beskid_cli | beskid_lsp | beskid_bundle
#   binary          beskid_cli | beskid_lsp | ignored for beskid_bundle
#   target          x86_64-unknown-linux-gnu | aarch64-apple-darwin | x86_64-pc-windows-msvc
#   asset-name      output file name (e.g. beskid-linux-amd64)
#   release-version resolved semver (from compute-cli-version.sh)
set -euo pipefail

PACKAGE="${1:?package (beskid_cli | beskid_lsp | beskid_bundle)}"
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

binary_extension=""
[[ "$runner_os" == "Windows" ]] && binary_extension=".exe"

export RUST_MIN_STACK="${RUST_MIN_STACK:-67108864}"

cd "${ROOT}/compiler"

stamp_version() {
  local cargo_toml="$1"
  if [[ "$runner_os" == "Windows" ]]; then
    powershell -NoProfile -Command "(Get-Content ${cargo_toml}) -replace '^version = \".*\"', 'version = \"${RELEASE_VERSION}\"' | Set-Content ${cargo_toml}"
  else
    sed -i.bak "s/^version = \".*\"/version = \"${RELEASE_VERSION}\"/" "$cargo_toml" && rm -f "${cargo_toml}.bak"
  fi
}

for cargo_toml in crates/beskid_cli/Cargo.toml crates/beskid_lsp/Cargo.toml crates/beskid_up/Cargo.toml; do
  stamp_version "$cargo_toml"
done

# Add the Rust target and build natively on the host.
rustup target add "$TARGET" >/dev/null 2>&1 || true
case "$PACKAGE" in
  beskid_cli|beskid_lsp)
    cargo build -p "$PACKAGE" --release --target "$TARGET"
    ;;
  beskid_bundle)
    cargo build -p beskid_cli -p beskid_lsp -p beskid_up --release --target "$TARGET"
    ;;
  *)
    echo "unsupported release package: $PACKAGE" >&2
    exit 1
    ;;
esac

if [[ "$PACKAGE" == "beskid_bundle" ]]; then
  runtime_prefix="${ROOT}/compiler/target/native-runtime-kit"
  BESKID_RUNTIME_PREFIX="${runtime_prefix}" \
    BESKID_RUNTIME_KIT_PROFILE=release \
    BESKID_CLI_BIN="${ROOT}/compiler/target/${TARGET}/release/beskid_cli${binary_extension}" \
    bash ./scripts/stage-native-runtime-kit.sh

  stage="$(mktemp -d)"
  trap 'rm -rf "$stage"' EXIT
  bundle_dir="${stage}/beskid-${RELEASE_VERSION}-${TARGET}"
  mkdir -p "$bundle_dir"
  for bundle_binary in beskid_cli beskid_lsp beskid-up; do
      built_binary="target/${TARGET}/release/${bundle_binary}${binary_extension}"
    [[ -f "$built_binary" ]] || { echo "Missing built bundle artifact: $built_binary" >&2; exit 1; }
    cp -f "$built_binary" "$bundle_dir/"
  done
  cp -a "${runtime_prefix}/lib" "${bundle_dir}/native-runtime-kit"
  tar -C "$stage" -czf "${ROOT}/${ASSET_NAME}" "$(basename "$bundle_dir")"
  echo "built ${ASSET_NAME} (Beskid ${RELEASE_VERSION} bundle for ${TARGET})"
  exit 0
fi

# Resolve the built binary path (Windows targets get .exe).
BIN_BASE="target/${TARGET}/release/${BINARY}${binary_extension}"
[[ -f "$BIN_BASE" ]] || { echo "Missing built artifact: $BIN_BASE" >&2; exit 1; }

cp -f "$BIN_BASE" "${ROOT}/${ASSET_NAME}"
echo "built ${ASSET_NAME} (${PACKAGE} ${RELEASE_VERSION} for ${TARGET})"
