# Scope: editors

Editor support for Beskid: VS Code, Zed and the tree-sitter grammar.

## VS Code

- Submodule `beskid_vscode/`. Bundles `beskid_lsp`. Published on Open VSX as
  `beskid.beskid-vscode`.
- Only BSOL projects are supported (`.bws` workspaces and `.bproj` projects).
- The outline panel is removed; the projects panel stays.
- The dashboard opens from the Beskid status-bar entry, the way rust-analyzer
  does it.
- Rebuild and reinstall into VS Code or Cursor: `just vscode`, then reload the
  window.
- Gate: `scripts/ci/vscode-gate.sh`. The LSP command contract is checked by
  `scripts/ci/lsp-command-contract-gate.sh` against a snapshot in the extension.

## Zed

- `editors/zed/` is the only Zed registry package root: extension, Rust SDK
  adapter, language assets, snippets and packaged grammar.
- The root `.zed/` holds only repository editing preferences and tasks. It must
  not duplicate manifests, queries or grammar files.
- Build: `cargo build --release --target wasm32-wasip2 --manifest-path editors/zed/Cargo.toml`.
- Tests: `scripts/ci/test/zed-extension-package.test.sh`,
  `scripts/ci/test/zed-language-assets.test.sh`.

## Tree-sitter

Submodule `beskid_treesitter/`, published as
`@cyber-nomad-collective/beskid-tree-sitter`. Its grammar is synced from the
compiler's Pest grammar; do not edit it by hand in only one place.

## Publication

Marketplace publication runs only through the manual Woodpecker `editor.yml`
lane. It verifies prebuilt VSIX files and native LSP assets and does not
rebuild them. Only its final step sees `open_vsx_token`. See
[build-release-infra.md](build-release-infra.md).
