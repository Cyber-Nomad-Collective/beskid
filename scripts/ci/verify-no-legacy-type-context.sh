#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PATTERNS=(
  'expr_types'
  'TypeContext'
  'types/context/'
  'type_prefetched_source_path'
  'seed_definitions_from_source_path'
)

cd "${ROOT}/compiler"
for pattern in "${PATTERNS[@]}"; do
  if rg -n --glob '*.rs' "${pattern}" crates/ >/dev/null 2>&1; then
    echo "legacy type-system pattern reintroduced: ${pattern}" >&2
    rg -n --glob '*.rs' "${pattern}" crates/ >&2 || true
    exit 1
  fi
done

echo "no legacy type-system patterns in compiler .rs sources"
