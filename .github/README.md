# Workflows in this repository

This repo is an **aggregate** (submodules and local notes). **Compiler** CI, releases, and the full Rust test matrix run on the **compiler submodule public GitHub remote** (see `compiler/.github/workflows/ci.yml` in that checkout).

Workflows here:

- `publish-open-vsx.yml` — builds `beskid_lsp` from `compiler/`, bundles it into `beskid_vscode/`, publishes VSIX (requires `submodules: recursive` checkout).
- `runtime-ci.yml` — aggregate runtime smoke checks against the pinned `compiler` submodule (requires `submodules: recursive` checkout).
- `pckg-ci.yml` — `dotnet test` for the pckg .NET service (unit tests only; integration tests are excluded until they run reliably in CI).

The compiler remote remains the authoritative source for full compiler CI gates.

## Local pre-push validation

Run:

`./validate-ci-local.sh`

This script verifies submodule checkout, required workflow paths, pckg unit tests, and runtime/e2e commands used by aggregate workflows.