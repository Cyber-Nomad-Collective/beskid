# Workflows in this repository

This repo is an **aggregate** (submodules and local notes). **Compiler** CI, releases, and the full Rust test matrix run on the **compiler submodule public GitHub remote** (see `compiler/.github/workflows/ci.yml` in that checkout). Corelib lives only as **`compiler/corelib`** (nested submodule); clone with `git submodule update --init --recursive` so it is checked out.

Workflows here:

- `publish-open-vsx.yml` — Nox session `open_vsx_publish` initializes the `compiler` and `beskid_vscode` submodules (`ci/submodules.py`), builds `beskid_lsp`, bundles into `beskid_vscode/server/<platform>/`, packages and publishes the VSIX (`COMPILER_SUBMODULE_TOKEN`, optional `BESKID_VSCODE_SUBMODULE_TOKEN` if the extension submodule is private).
- `runtime-ci.yml` — aggregate runtime smoke checks against the pinned `compiler` submodule; Nox runs `init_compiler` after checkout (plain `actions/checkout` is enough).
- `pckg-ci.yml` — `dotnet test` for the pckg .NET service (unit tests only; integration tests are excluded until they run reliably in CI).

The compiler remote remains the authoritative source for full compiler CI gates.

## Local pre-push validation

Run:

`./validate-ci-local.sh`

This script verifies submodule checkout, required workflow paths, pckg unit tests, and runtime/e2e commands used by aggregate workflows.