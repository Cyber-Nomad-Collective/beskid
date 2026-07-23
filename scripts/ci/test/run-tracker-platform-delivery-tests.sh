#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
workflow="${root}/.github/workflows/tracker-platform-delivery.yml"

[[ -f "${workflow}" ]] || { echo "missing tracker platform delivery workflow" >&2; exit 1; }

for required in \
	'pnpm run openspec:validate' \
	'pnpm run openspec:catalog' \
	'projection/reconciliation' \
	'./scripts/ci/init-submodules.sh' \
	'pnpm install --frozen-lockfile' \
	'bun run --cwd beskid_tracker test' \
	'bun run --cwd beskid_tracker check' \
	'pnpm --dir site/platform-spec test' \
	'pnpm --dir site/platform-spec typecheck' \
	'pnpm --dir site/website exec vitest run src/lib/tracker-delivery.test.ts' \
	'pnpm --dir site/website build' \
	'beskid_nexus/gitnexus' \
	'latest-delivery'; do
	grep -Fq "${required}" "${workflow}" || { echo "workflow missing required gate: ${required}" >&2; exit 1; }
done

echo "Tracker platform delivery workflow contract OK"
