#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
workflow="${root}/.github/workflows/platform-delivery.yml"

integration_job="$(sed -n '/^  integration:/,/^  security:/p' "${workflow}")"

if [[ "${integration_job}" != *'submodules: beskid_web_common beskid_tracker beskid_nexus compiler pckg beskid_infra beskid_vscode'* ]]; then
  echo "platform integration must initialize beskid_vscode before editor release contract tests" >&2
  exit 1
fi

printf 'Platform integration checkout contract tests OK\n'
