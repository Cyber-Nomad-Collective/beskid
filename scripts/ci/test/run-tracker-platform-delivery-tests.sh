#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
workflow="${root}/.github/workflows/tracker-platform-delivery.yml"

if rg -Fq 'runs-on: ubuntu-latest' "${workflow}"; then
	echo "tracker delivery still depends on the billing-locked GitHub Ubuntu runner" >&2
	exit 1
fi

[[ -f "${workflow}" ]] || { echo "missing tracker platform delivery workflow" >&2; exit 1; }

for required in \
	'pnpm run openspec:validate' \
	'pnpm run openspec:catalog' \
	'tracker reconciliation-plan' \
	'./scripts/ci/init-submodules.sh' \
	'pnpm install --frozen-lockfile' \
	'pnpm install --dir beskid_tracker --frozen-lockfile' \
	'pnpm --dir beskid_tracker test' \
	'pnpm --dir beskid_tracker check' \
	'pnpm --dir site/website exec node --test src/lib/tracker-delivery.test.ts' \
	'pnpm --dir site/website build' \
	'beskid_nexus/gitnexus' \
	'website tracker-delivery' \
	'run-ci-reported-command.sh'; do
	grep -Fq "${required}" "${workflow}" || { echo "workflow missing required gate: ${required}" >&2; exit 1; }
done

if grep -Eq 'actions/(upload|download)-artifact@' "${workflow}"; then
	echo "workflow still consumes GitHub Actions artifact storage" >&2
	exit 1
fi

if grep -Fq 'site/platform-spec' "${workflow}"; then
	echo "workflow still references the retired Platform Spec app" >&2
	exit 1
fi

echo "Tracker platform delivery workflow contract OK"
