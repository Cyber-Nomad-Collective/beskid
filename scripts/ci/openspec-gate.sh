#!/usr/bin/env bash
# Canonical standard source gate. OpenSpec is the only normative authority.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}"

test -f openspec/config.yaml
test -f openspec/catalog.json
pnpm run openspec:validate

