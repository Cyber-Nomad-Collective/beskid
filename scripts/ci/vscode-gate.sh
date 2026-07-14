#!/usr/bin/env bash
# VS Code extension gate: install deps + run the extension test suite.
#
# Runs directly on a runner. Assumes the beskid_vscode submodule is already
# initialised by the calling workflow.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}/beskid_vscode"

echo "==> beskid_vscode: bun install --frozen-lockfile"
bun install --frozen-lockfile

echo "==> beskid_vscode: bun test"
bun test

echo "vscode-gate OK"
