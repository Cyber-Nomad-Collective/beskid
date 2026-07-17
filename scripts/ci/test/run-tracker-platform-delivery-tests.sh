#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
workflow="${root}/.github/workflows/tracker-platform-delivery.yml"

[[ -f "${workflow}" ]] || { echo "missing tracker platform delivery workflow" >&2; exit 1; }

for required in \
	'bun run openspec:validate' \
	'bun run openspec:catalog' \
	'projection/reconciliation' \
	'./scripts/ci/init-submodules.sh' \
	'bun run --cwd beskid_tracker test' \
	'bun run --cwd beskid_tracker check' \
	'bun run --cwd site/platform-spec test' \
	'bun run --cwd site/platform-spec typecheck' \
	'bun test --cwd site/website src/lib/tracker-delivery.test.ts' \
	'bun run --cwd site/website build' \
	'beskid_nexus/gitnexus' \
	'latest-delivery'; do
	grep -Fq "${required}" "${workflow}" || { echo "workflow missing required gate: ${required}" >&2; exit 1; }
done

echo "Tracker platform delivery workflow contract OK"
