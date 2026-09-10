#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
workflow="${root}/.github/workflows/platform-delivery.yml"

integration_job="$(sed -n '/^  integration:/,/^  security:/p' "${workflow}")"
integration_submodules="$(sed -n 's/^[[:space:]]*submodules:[[:space:]]*//p' <<<"${integration_job}")"

if [[ " ${integration_submodules} " != *' beskid_vscode '* ]]; then
  echo "platform integration must initialize beskid_vscode before editor release contract tests" >&2
  exit 1
fi

printf 'Platform integration checkout contract tests OK\n'
