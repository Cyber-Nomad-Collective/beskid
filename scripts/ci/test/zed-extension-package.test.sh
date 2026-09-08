#!/usr/bin/env bash
# Zed loads language grammars from the extension package, not from .zed/.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
extension_root="${root}/editors/zed"
publish_workflow="${root}/.github/workflows/publish-zed-extension.yml"
developer_tasks="${root}/.zed/tasks.json"
extension_readme="${extension_root}/README.md"
extension_gitignore="${extension_root}/.gitignore"

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
grep -Fxq '/grammars/beskid/' "${extension_gitignore}" || \
  fail 'Zed development grammar checkout is not ignored at its exact package path'
grep -Fxq '/grammars/bsol/' "${extension_gitignore}" || \
  fail 'Zed development BSOL grammar checkout is not ignored at its exact package path'
[[ ! -e "${root}/extension.toml" ]] || fail 'legacy root Zed package remains'
[[ ! -e "${root}/.zed/grammars/beskid.wasm" ]] || fail 'duplicate .zed Beskid grammar remains'
[[ ! -e "${root}/.zed/languages/beskid/config.toml" ]] || fail 'duplicate .zed Beskid language configuration remains'
[[ ! -e "${root}/.zed/languages/beskid-manifest/config.toml" ]] || fail 'duplicate .zed Beskid manifest configuration remains'
[[ ! -e "${root}/.zed/languages/bsol/config.toml" ]] || fail 'duplicate .zed BSOL language configuration remains'
[[ -f "${extension_root}/grammars/beskid.wasm" ]] || fail 'Zed package is missing grammars/beskid.wasm'
[[ -s "${extension_root}/grammars/beskid.wasm" ]] || fail 'Zed grammar artifact is empty'
[[ -s "${extension_root}/extension.wasm" ]] || fail 'Zed package is missing extension.wasm'
[[ -f "${extension_root}/languages/beskid/config.toml" ]] || fail 'Zed package is missing the Beskid language configuration'
[[ -f "${extension_root}/languages/bsol/config.toml" ]] || fail 'Zed package is missing the standalone BSOL language configuration'

grep -Fq 'kind = "Rust"' "${extension_root}/extension.toml" || \
  fail 'Zed extension manifest does not load extension.wasm'
! grep -Eq '^command[[:space:]]*=[[:space:]]*"beskid_lsp"[[:space:]]*$' "${extension_root}/extension.toml" || \
  fail 'Zed extension manifest duplicates Rust adapter command authority'
grep -Fq 'grammar = "beskid"' "${extension_root}/languages/beskid/config.toml" || \
  fail 'Beskid language configuration does not select the packaged grammar'
grep -Fq 'path_suffixes = ["bd"]' "${extension_root}/languages/beskid/config.toml" || \
  fail 'Beskid language configuration does not associate .bd files'
grep -Fq 'name = "Beskid BSOL"' "${extension_root}/languages/bsol/config.toml" || \
  fail 'standalone BSOL language configuration has the wrong language name'
grep -Fq 'path_suffixes = ["bsol"]' "${extension_root}/languages/bsol/config.toml" || \
  fail 'standalone BSOL language configuration does not associate .bsol files'
grep -Fq 'grammar = "bsol"' "${extension_root}/languages/bsol/config.toml" || \
  fail 'standalone BSOL language configuration does not select its packaged grammar'
grep -Fq 'languages = ["Beskid", "Beskid Manifest", "Beskid BSOL"]' "${extension_root}/extension.toml" || \
  fail 'Beskid LSP does not register standalone BSOL alongside existing languages'
grep -Fq '"Beskid BSOL" = "bsol"' "${extension_root}/extension.toml" || \
  fail 'Beskid LSP does not map standalone BSOL to the bsol language ID'
grep -Fq '[grammars.bsol]' "${extension_root}/extension.toml" || \
  fail 'Zed extension manifest does not declare the standalone BSOL grammar'
grep -Fq 'repository = "https://github.com/Cyber-Nomad-Collective/beskid_bsol"' "${extension_root}/extension.toml" || \
  fail 'standalone BSOL grammar does not use the canonical repository'
grep -Fq 'commit = "3bb342a858361bf36eef98b2ccf1373df414783a"' "${extension_root}/extension.toml" || \
  fail 'standalone BSOL grammar does not use the exact pinned submodule commit'
grep -Fq 'path = "grammars/tree-sitter-bsol"' "${extension_root}/extension.toml" || \
  fail 'standalone BSOL grammar does not select the nested grammar directory'
[[ -s "${extension_root}/languages/bsol/highlights.scm" ]] || \
  fail 'standalone BSOL language configuration is missing packaged highlighting queries'
[[ "$(grep -Fc 'kind = "process:exec"' "${extension_root}/extension.toml")" -eq 1 ]] || \
  fail 'Zed extension must declare one process capability for trusted server overrides'
grep -Fq 'command = "*"' "${extension_root}/extension.toml" || \
  fail 'Zed extension process capability must support trusted absolute cache and override paths'
grep -Fq 'args = ["**"]' "${extension_root}/extension.toml" || \
  fail 'Zed extension process capability must preserve trusted configured arguments'
grep -Fq 'path = ["Cyber-Nomad-Collective", "beskid_compiler", "releases", "download", "lsp-stable", "**"]' "${extension_root}/extension.toml" || \
  fail 'Zed extension download capability must remain limited to the stable Beskid release path'

[[ -f "${publish_workflow}" ]] || fail 'missing Zed publication workflow'
grep -Fq 'extension-path: editors/zed' "${publish_workflow}" || \
  fail 'Zed publication workflow does not publish editors/zed'
grep -Fq 'bash scripts/ci/test/zed-extension-package.test.sh' "${publish_workflow}" || \
  fail 'Zed publication workflow does not run the package gate'
grep -Fq 'bash scripts/ci/test/zed-language-assets.test.sh' "${publish_workflow}" || \
  fail 'Zed publication workflow does not run the language-assets gate'
grep -Fq 'repos/Cyber-Nomad-Collective/beskid_compiler/releases/tags/lsp-stable' "${publish_workflow}" || \
  fail 'Zed publication workflow does not require the stable LSP release'
grep -Fq 'GH_TOKEN: ${{ github.token }}' "${publish_workflow}" || \
  fail 'Zed stable-release guard does not authenticate its GitHub API request'
for release_asset in \
  lsp-version.txt \
  beskid_lsp-linux-amd64 \
  beskid_lsp-darwin-arm64 \
  beskid_lsp-windows-amd64.exe; do
  grep -Fq "${release_asset}" "${publish_workflow}" || \
    fail "Zed publication workflow does not require ${release_asset}"
done
package_gate_line="$(grep -nF 'bash scripts/ci/test/zed-extension-package.test.sh' "${publish_workflow}" | head -n1 | cut -d: -f1)"
asset_gate_line="$(grep -nF 'bash scripts/ci/test/zed-language-assets.test.sh' "${publish_workflow}" | head -n1 | cut -d: -f1)"
release_guard_line="$(grep -nF 'name: Verify stable LSP release assets' "${publish_workflow}" | head -n1 | cut -d: -f1)"
publish_action_line="$(grep -nF 'uses: huacnlee/zed-extension-action@v1' "${publish_workflow}" | head -n1 | cut -d: -f1)"
[[ "${package_gate_line}" -lt "${publish_action_line}" && \
   "${asset_gate_line}" -lt "${publish_action_line}" && \
   "${release_guard_line}" -lt "${publish_action_line}" ]] || \
  fail 'Zed publication gates must run before the registry action'

[[ -f "${developer_tasks}" ]] || fail 'missing repository Zed developer tasks'
grep -Fq 'bash scripts/ci/test/zed-extension-package.test.sh' "${developer_tasks}" || \
  fail 'repository Zed tasks do not expose the package gate'

[[ -f "${extension_readme}" ]] || fail 'missing Zed package README'
grep -Fq 'zed_extension_api = "0.7.0"' "${extension_readme}" || \
  fail 'Zed README does not document the official SDK version'
grep -Fq 'wasm32-wasip2' "${extension_readme}" || \
  fail 'Zed README does not document the extension build target'
grep -Fq 'SDK-supported parity' "${extension_readme}" || \
  fail 'Zed README does not document the SDK parity boundary'

cargo test --manifest-path "${extension_root}/Cargo.toml"
cargo build --release --target wasm32-wasip2 --manifest-path "${extension_root}/Cargo.toml"
[[ -s "${extension_root}/target/wasm32-wasip2/release/beskid_zed_extension.wasm" ]] || \
  fail 'Zed extension WebAssembly module was not produced'
cmp -s "${extension_root}/extension.wasm" "${extension_root}/target/wasm32-wasip2/release/beskid_zed_extension.wasm" || \
  fail 'packaged extension.wasm is stale'

printf 'Zed extension package tests OK\n'
