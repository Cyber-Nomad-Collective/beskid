# Workflows in this repository

This repo is an **aggregate** (submodules and local notes). **Compiler** CI, releases, and the full Rust test matrix run on the **compiler submodule public GitHub remote** (see `compiler/.github/workflows/ci.yml` in that checkout).

Workflows here:

- `**publish-open-vsx.yml`** — builds `beskid_lsp` from `compiler/`, bundles it into `beskid_vscode/`, publishes VSIX (requires `submodules: recursive` checkout).
- `**pckg-ci.yml`** — `dotnet test` for the pckg .NET service (unit tests only; integration tests are excluded until they run reliably in CI).

There is **no** duplicate Rust `runtime-ci` at this root; rely on the compiler remote for toolchain gates.