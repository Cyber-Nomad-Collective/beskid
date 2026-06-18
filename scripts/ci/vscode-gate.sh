#!/usr/bin/env bash
# VS Code extension gate: install deps + run the extension test suite.
#
# Ported from the Dagger function vscodeGate() in
# beskid_infra/dagger/src/gates.ts so it runs directly on a runner instead of
# inside a Dagger container. Assumes the beskid_vscode submodule is already
# initialised by the calling workflow.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}/beskid_vscode"

echo "==> beskid_vscode: bun install --frozen-lockfile"
bun install --frozen-lockfile

echo "==> beskid_vscode: bun test"
bun test

echo "vscode-gate OK"
