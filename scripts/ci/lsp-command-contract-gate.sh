#!/usr/bin/env bash
# LSP command contract gate: keeps the beskid_lsp project-explorer command surface
# and the beskid_vscode extension's expected command contract in lockstep.
#
# Run from the superrepo root; needs the
# `compiler/` and `beskid_vscode/` submodules checked out.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

export RUST_MIN_STACK="${RUST_MIN_STACK:-67108864}"

echo "==> beskid_lsp project-explorer command contract (Rust snapshot)"
(
  cd "${ROOT}/compiler"
  cargo test -p beskid_lsp \
    project_explorer_command_contract_matches_snapshot -- --nocapture
)

echo "==> beskid_vscode LSP commands contract (Bun)"
(
  cd "${ROOT}/beskid_vscode"
  bun install --frozen-lockfile
  bun test test/lspCommandsContract.test.ts
)
