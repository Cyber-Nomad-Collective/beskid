#!/usr/bin/env bash
# Build a single cross-target CLI or LSP release artifact in compiler/.
# Env: RELEASE_VERSION, MATRIX_TARGET, MATRIX_ASSET_NAME, RELEASE_PACKAGE (beskid_cli|beskid_lsp)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/compiler"

: "${RELEASE_VERSION:?RELEASE_VERSION is required}"
: "${MATRIX_TARGET:?MATRIX_TARGET is required}"
: "${MATRIX_ASSET_NAME:?MATRIX_ASSET_NAME is required}"
: "${RELEASE_PACKAGE:?RELEASE_PACKAGE is required (beskid_cli or beskid_lsp)}"

case "${RELEASE_PACKAGE}" in
  beskid_cli)
    cargo_toml="crates/beskid_cli/Cargo.toml"
    bin_name="beskid_cli"
    ;;
  beskid_lsp)
    cargo_toml="crates/beskid_lsp/Cargo.toml"
    bin_name="beskid_lsp"
    ;;
  *)
    echo "Unsupported RELEASE_PACKAGE: ${RELEASE_PACKAGE}" >&2
    exit 1
    ;;
esac

if [[ ! -f "${cargo_toml}" ]]; then
  echo "Missing ${cargo_toml}" >&2
  exit 1
fi

patch_version() {
  local version="$1"
  if [[ "${RUNNER_OS:-Linux}" == "Windows" ]]; then
    powershell -NoProfile -Command \
      "\$p='${cargo_toml}'; (Get-Content \$p) -replace '^version = \"[^\"]+\"', 'version = \"${version}\"' | Set-Content \$p"
  else
    sed -i "s/^version = \".*\"/version = \"${version}\"/" "${cargo_toml}"
  fi
}

patch_version "${RELEASE_VERSION}"

rustup target add "${MATRIX_TARGET}" 2>/dev/null || true

cargo build -p "${RELEASE_PACKAGE}" --release --target "${MATRIX_TARGET}"

if [[ "${RELEASE_PACKAGE}" == "beskid_cli" ]]; then
  cargo build -p beskid_runtime_bridge --no-default-features --release --target "${MATRIX_TARGET}"
  if [[ "${RUNNER_OS:-Linux}" == "Windows" ]]; then
    cp "target/${MATRIX_TARGET}/release/beskid_runtime_bridge.lib" \
      "target/${MATRIX_TARGET}/release/beskid_runtime_minimal.lib"
  else
    cp "target/${MATRIX_TARGET}/release/libbeskid_runtime_bridge.a" \
      "target/${MATRIX_TARGET}/release/libbeskid_runtime_minimal.a"
  fi
  cargo build -p beskid_runtime_bridge --release --target "${MATRIX_TARGET}"
  cargo check -p beskid_repl --release --target "${MATRIX_TARGET}"
fi

if [[ "${RUNNER_OS:-Linux}" == "Windows" ]]; then
  built="target/${MATRIX_TARGET}/release/${bin_name}.exe"
else
  built="target/${MATRIX_TARGET}/release/${bin_name}"
fi

if [[ ! -f "${built}" ]]; then
  echo "Expected binary at ${built}" >&2
  exit 1
fi

dest="${ROOT}/${MATRIX_ASSET_NAME}"
mv -f "${built}" "${dest}"
echo "Built release artifact: ${dest}"
