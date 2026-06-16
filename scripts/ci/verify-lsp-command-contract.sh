#!/usr/bin/env bash
# Verify beskid_vscode execute-command contract matches beskid_lsp PROJECT_EXPLORER_COMMANDS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Rust: project explorer command contract"
(cd compiler && cargo test -p beskid_lsp project_explorer_command_contract_matches_snapshot -- --nocapture)

echo "==> Extension: LSP execute command contract tests"
(cd beskid_vscode && bun test test/lspCommandsContract.test.ts)

echo "LSP command contract OK"
