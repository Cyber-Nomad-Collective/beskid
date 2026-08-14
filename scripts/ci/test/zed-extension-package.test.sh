#!/usr/bin/env bash
# Zed loads language grammars from the extension package, not from .zed/.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

[[ -f "${root}/grammars/beskid.wasm" ]] || fail 'Zed package is missing grammars/beskid.wasm'
[[ -s "${root}/grammars/beskid.wasm" ]] || fail 'Zed grammar artifact is empty'
[[ -s "${root}/extension.wasm" ]] || fail 'Zed package is missing extension.wasm'
[[ -f "${root}/languages/beskid/config.toml" ]] || fail 'Zed package is missing the Beskid language configuration'

grep -Fq 'kind = "Rust"' "${root}/extension.toml" || \
  fail 'Zed extension manifest does not load extension.wasm'
grep -Fq 'grammar = "beskid"' "${root}/languages/beskid/config.toml" || \
  fail 'Beskid language configuration does not select the packaged grammar'
grep -Fq 'path_suffixes = ["bd"]' "${root}/languages/beskid/config.toml" || \
  fail 'Beskid language configuration does not associate .bd files'

cargo build --release --target wasm32-wasip1 --manifest-path "${root}/Cargo.toml"
[[ -s "${root}/target/wasm32-wasip1/release/beskid_zed_extension.wasm" ]] || \
  fail 'Zed extension WebAssembly module was not produced'
cmp -s "${root}/extension.wasm" "${root}/target/wasm32-wasip1/release/beskid_zed_extension.wasm" || \
  fail 'packaged extension.wasm is stale'

printf 'Zed extension package tests OK\n'
