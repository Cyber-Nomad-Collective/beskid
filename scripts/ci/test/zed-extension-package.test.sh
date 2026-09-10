#!/usr/bin/env bash
# Zed loads language grammars from the extension package, not from .zed/.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
extension_root="${root}/editors/zed"
publish_workflow="${root}/.github/workflows/publish-zed-extension.yml"
developer_tasks="${root}/.zed/tasks.json"
extension_readme="${extension_root}/README.md"
extension_gitignore="${extension_root}/.gitignore"
metadata_contract_test="${root}/scripts/ci/test/zed-extension-metadata.test.sh"
bsol_pin_check="${root}/scripts/ci/verify-zed-bsol-pin.sh"

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
bash "${metadata_contract_test}"
[[ -x "${bsol_pin_check}" ]] || fail 'missing executable BSOL gitlink contract'
bash "${bsol_pin_check}" "${root}"

pin_fixture="$(mktemp -d)"
trap 'rm -rf "${pin_fixture}"' EXIT
mkdir -p "${pin_fixture}/root/editors/zed" "${pin_fixture}/root/beskid_bsol"
git -C "${pin_fixture}/root/beskid_bsol" init -q
printf 'old\n' >"${pin_fixture}/root/beskid_bsol/grammar.txt"
git -C "${pin_fixture}/root/beskid_bsol" add grammar.txt
git -C "${pin_fixture}/root/beskid_bsol" -c user.name=contract -c user.email=contract@example.invalid commit -qm old
old_bsol_commit="$(git -C "${pin_fixture}/root/beskid_bsol" rev-parse HEAD)"
printf 'new\n' >"${pin_fixture}/root/beskid_bsol/grammar.txt"
git -C "${pin_fixture}/root/beskid_bsol" add grammar.txt
git -C "${pin_fixture}/root/beskid_bsol" -c user.name=contract -c user.email=contract@example.invalid commit -qm new
new_bsol_commit="$(git -C "${pin_fixture}/root/beskid_bsol" rev-parse HEAD)"
git -C "${pin_fixture}/root" init -q
printf '[grammars.bsol]\ncommit = "%s"\n' "${old_bsol_commit}" >"${pin_fixture}/root/editors/zed/extension.toml"
git -C "${pin_fixture}/root" add editors/zed/extension.toml
git -C "${pin_fixture}/root" update-index --add --cacheinfo "160000,${old_bsol_commit},beskid_bsol"
git -C "${pin_fixture}/root" -c user.name=contract -c user.email=contract@example.invalid commit -qm old
printf '[grammars.bsol]\ncommit = "%s"\n' "${new_bsol_commit}" >"${pin_fixture}/root/editors/zed/extension.toml"
git -C "${pin_fixture}/root" add editors/zed/extension.toml
git -C "${pin_fixture}/root" update-index --add --cacheinfo "160000,${new_bsol_commit},beskid_bsol"
bash "${bsol_pin_check}" "${pin_fixture}/root"
printf '[grammars.bsol]\ncommit = "%s"\n' "${old_bsol_commit}" >"${pin_fixture}/root/editors/zed/extension.toml"
if bash "${bsol_pin_check}" "${pin_fixture}/root" >/dev/null 2>&1; then
  fail 'BSOL gitlink contract accepted a manifest that disagrees with the staged gitlink'
fi
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
[[ -f "${extension_root}/grammars/bsol.wasm" ]] || fail 'Zed package is missing grammars/bsol.wasm'
[[ -s "${extension_root}/grammars/bsol.wasm" ]] || fail 'Zed BSOL grammar artifact is empty'
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
grep -Fq 'extension-path: extensions/beskid' "${publish_workflow}" || \
  fail 'Zed publication workflow does not update the canonical registry submodule path'
! grep -Fq 'extension-path: editors/zed' "${publish_workflow}" || \
  fail 'Zed publication workflow confuses the source subdirectory with the registry submodule path'
! grep -Eq '^[[:space:]]*workflow_dispatch:' "${publish_workflow}" || \
  fail 'Zed publication workflow permits a tag-less dispatch that the registry action rejects'
! grep -Fq 'push-to: Cyber-Nomad-Collective/zed-extensions' "${publish_workflow}" || \
  fail 'Zed publication workflow targets a registry fork that does not exist'
grep -Fq 'bash scripts/ci/test/zed-extension-package.test.sh' "${publish_workflow}" || \
  fail 'Zed publication workflow does not run the package gate'
grep -Fq 'bash scripts/ci/test/zed-language-assets.test.sh' "${publish_workflow}" || \
  fail 'Zed publication workflow does not run the language-assets gate'
grep -Fq 'repos/Cyber-Nomad-Collective/beskid_compiler/releases/tags/lsp-stable' "${publish_workflow}" || \
  fail 'Zed publication workflow does not require the stable LSP release'
grep -Fq 'gh release download lsp-stable' "${publish_workflow}" || \
  fail 'Zed publication workflow does not download the stable release state'
grep -Fq 'release-state.json' "${publish_workflow}" || \
  fail 'Zed publication workflow does not validate the authoritative release state'
grep -Fq '.channel == "stable"' "${publish_workflow}" || \
  fail 'Zed publication workflow does not require stable release state'
grep -Fq '.tests.gate_result == "success"' "${publish_workflow}" || \
  fail 'Zed publication workflow does not require successful compiler gates'
grep -Fq '(.complete_platforms | sort) == ["linux", "macos", "windows"]' "${publish_workflow}" || \
  fail 'Zed publication workflow does not require exactly three complete platforms'
grep -Fq '.provenance.compiler_commit == $compiler_commit' "${publish_workflow}" || \
  fail 'Zed publication workflow does not bind the stable LSP to the pinned compiler gitlink'
grep -Fq 'git rev-parse HEAD:compiler' "${publish_workflow}" || \
  fail 'Zed publication workflow does not resolve the tagged compiler gitlink'
grep -Fq 'GITHUB_REF_NAME#v' "${publish_workflow}" || \
  fail 'Zed publication workflow does not derive the registry version from the tag'
grep -Fq 'editors/zed/extension.toml' "${publish_workflow}" || \
  fail 'Zed publication workflow does not parse the package manifest version'
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
version_guard_line="$(grep -nF 'name: Verify tag matches Zed manifest version' "${publish_workflow}" | head -n1 | cut -d: -f1)"
grep -Fq 'permissions:' "${publish_workflow}" || \
  fail 'Zed publication workflow does not declare explicit permissions'
grep -Fq 'contents: read' "${publish_workflow}" || \
  fail 'Zed publication workflow does not retain read access for checkout and release verification'
! grep -Eq '^[[:space:]]*(contents|pull-requests):[[:space:]]*write' "${publish_workflow}" || \
  fail 'Zed publication workflow grants unnecessary write permission to the repository token'
reviewed_action='huacnlee/zed-extension-action@11b0e4805c1f4382a4bb3b1a9b17be328e1559c3'
grep -Fq "uses: ${reviewed_action}" "${publish_workflow}" || \
  fail 'Zed publication workflow does not pin the reviewed registry action commit'
! grep -Eq 'uses: huacnlee/zed-extension-action@(v[0-9]+|main|master)$' "${publish_workflow}" || \
  fail 'Zed publication workflow uses a mutable registry-action reference'
publish_action_line="$(grep -nF "uses: ${reviewed_action}" "${publish_workflow}" | head -n1 | cut -d: -f1)"
[[ "${package_gate_line}" -lt "${publish_action_line}" && \
   "${asset_gate_line}" -lt "${publish_action_line}" && \
   "${release_guard_line}" -lt "${publish_action_line}" && \
   "${version_guard_line}" -lt "${publish_action_line}" ]] || \
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
grep -Fq 'Initial registry publication' "${extension_readme}" || \
  fail 'Zed README does not document the manual initial registry submission'
grep -Fq 'submodule = "extensions/beskid"' "${extension_readme}" || \
  fail 'Zed README does not declare the canonical registry submodule'
grep -Fq 'path = "editors/zed"' "${extension_readme}" || \
  fail 'Zed README does not declare the nested extension source path'
manifest_version="$(sed -n 's/^version = "\([^"]*\)"$/\1/p' "${extension_root}/extension.toml" | head -n1)"
registry_version="$(sed -n '/^\[beskid\]$/,/^```$/s/^version = "\([^"]*\)"$/\1/p' "${extension_readme}" | head -n1)"
[[ -n "${manifest_version}" && "${registry_version}" == "${manifest_version}" ]] || \
  fail "Zed initial registry version ${registry_version:-<missing>} does not match manifest ${manifest_version:-<missing>}"

cargo test --manifest-path "${extension_root}/Cargo.toml"
cargo build --release --target wasm32-wasip2 --manifest-path "${extension_root}/Cargo.toml"
[[ -s "${extension_root}/target/wasm32-wasip2/release/beskid_zed_extension.wasm" ]] || \
  fail 'Zed extension WebAssembly module was not produced'
cmp -s "${extension_root}/extension.wasm" "${extension_root}/target/wasm32-wasip2/release/beskid_zed_extension.wasm" || \
  fail 'packaged extension.wasm is stale'

printf 'Zed extension package tests OK\n'
