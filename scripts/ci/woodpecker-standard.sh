#!/usr/bin/env bash
# Shared strict standard validation for standalone checks and release evidence.
set -euo pipefail
cd "$(dirname "$0")/../.."
pnpm dlx --package tsx@4.23.1 tsx scripts/openspec/validate-standard.ts
pnpm dlx --package tsx@4.23.1 tsx scripts/openspec/validate-book-traceability.ts
pnpm dlx --package tsx@4.23.1 tsx scripts/openspec/validate-layouts.ts
pnpm dlx @fission-ai/openspec@1.6.0 validate --all --strict --no-interactive
