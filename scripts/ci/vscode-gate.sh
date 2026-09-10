#!/usr/bin/env bash
# VS Code extension gate: install deps, verify static/unit contracts, and
# optionally exercise a real extension host against the sibling compiler LSP.
#
# Runs directly on a runner. Assumes the beskid_vscode submodule is already
# initialised by the calling workflow.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}/beskid_vscode"

echo "==> beskid_vscode: bun install --frozen-lockfile"
bun install --frozen-lockfile

echo "==> beskid_vscode: bun run lint"
bun run lint

echo "==> beskid_vscode: bun run test:unit"
bun run test:unit

echo "==> beskid_vscode: bun run test:smoke:formatter"
bun run test:smoke:formatter

if [[ "${BESKID_VSCODE_RUN_EXTENSION_HOST:-0}" == "1" ]]; then
  echo "==> beskid_vscode: extension-host integration"
  if [[ "$(uname -s)" == "Linux" ]]; then
    command -v xvfb-run >/dev/null 2>&1 || {
      echo "xvfb-run is required for VS Code integration tests on Linux" >&2
      exit 1
    }
    xvfb-run -a bun run test:integration
  else
    bun run test:integration
  fi
fi

echo "vscode-gate OK"
