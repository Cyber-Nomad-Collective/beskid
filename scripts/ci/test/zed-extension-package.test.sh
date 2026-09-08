#!/usr/bin/env bash
# Zed loads language grammars from the extension package, not from .zed/.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
extension_root="${root}/editors/zed"

# Prefer the complete rustup-managed compiler when a Homebrew rustc shim is active.
if command -v rustup >/dev/null 2>&1; then
  rustup_rustc="$(rustup which rustc --toolchain stable 2>/dev/null || true)"
  [[ -x "${rustup_rustc}" ]] && export RUSTC="${rustup_rustc}"
fi

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

[[ -f "${extension_root}/Cargo.toml" ]] || fail 'missing editors/zed Cargo package'
[[ ! -e "${root}/extension.toml" ]] || fail 'legacy root Zed package remains'
[[ -f "${extension_root}/grammars/beskid.wasm" ]] || fail 'Zed package is missing grammars/beskid.wasm'
[[ -s "${extension_root}/grammars/beskid.wasm" ]] || fail 'Zed grammar artifact is empty'
[[ -s "${extension_root}/extension.wasm" ]] || fail 'Zed package is missing extension.wasm'
[[ -f "${extension_root}/languages/beskid/config.toml" ]] || fail 'Zed package is missing the Beskid language configuration'

grep -Fq 'kind = "Rust"' "${extension_root}/extension.toml" || \
  fail 'Zed extension manifest does not load extension.wasm'
grep -Fq 'grammar = "beskid"' "${extension_root}/languages/beskid/config.toml" || \
  fail 'Beskid language configuration does not select the packaged grammar'
grep -Fq 'path_suffixes = ["bd"]' "${extension_root}/languages/beskid/config.toml" || \
  fail 'Beskid language configuration does not associate .bd files'
[[ "$(grep -Fc 'kind = "process:exec"' "${extension_root}/extension.toml")" -eq 1 ]] || \
  fail 'Zed extension must declare one process capability for trusted server overrides'
grep -Fq 'command = "*"' "${extension_root}/extension.toml" || \
  fail 'Zed extension process capability must support trusted absolute cache and override paths'
grep -Fq 'args = ["**"]' "${extension_root}/extension.toml" || \
  fail 'Zed extension process capability must preserve trusted configured arguments'
grep -Fq 'path = ["Cyber-Nomad-Collective", "beskid_compiler", "releases", "download", "lsp-stable", "**"]' "${extension_root}/extension.toml" || \
  fail 'Zed extension download capability must remain limited to the stable Beskid release path'

cargo test --manifest-path "${extension_root}/Cargo.toml"
cargo build --release --target wasm32-wasip2 --manifest-path "${extension_root}/Cargo.toml"
[[ -s "${extension_root}/target/wasm32-wasip2/release/beskid_zed_extension.wasm" ]] || \
  fail 'Zed extension WebAssembly module was not produced'
cmp -s "${extension_root}/extension.wasm" "${extension_root}/target/wasm32-wasip2/release/beskid_zed_extension.wasm" || \
  fail 'packaged extension.wasm is stale'

printf 'Zed extension package tests OK\n'
