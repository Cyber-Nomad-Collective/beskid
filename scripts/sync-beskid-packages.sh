#!/usr/bin/env bash
# Refresh @beskid / trudoc packages from GitHub Packages (latest published versions).
#
# Usage:
#   ./scripts/sync-beskid-packages.sh
#   ./scripts/sync-beskid-packages.sh beskid_tracker site/auth
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUPERREPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
# shellcheck source=lib/output.sh
source "${SCRIPT_DIR}/lib/output.sh"

BESKID_SPECS=(
	"@beskid/auth-client"
	"@beskid/beskid-ui"
	"@beskid/ui-react"
	"@cyber-nomad-collective/trudoc"
	trudoc
)

DEFAULT_CONSUMERS=(
	beskid_tracker
	site/auth
	site/website
	beskid_nexus/gitnexus
	beskid_nexus/gitnexus-web
)

consumers=("${DEFAULT_CONSUMERS[@]}")
if [[ $# -gt 0 ]]; then
	consumers=("$@")
fi

if ! command -v bun >/dev/null 2>&1; then
	die "bun is required on PATH"
fi

section "Sync Beskid packages from GitHub Packages"

for rel in "${consumers[@]}"; do
	dir="${SUPERREPO_ROOT}/${rel}"
	if [[ ! -f "${dir}/package.json" ]]; then
		warn "Skip ${rel} (no package.json)"
		continue
	fi
	note "${rel}"
	(
		cd "${dir}"
		# bun update only touches deps present in this package.json
		bun update "${BESKID_SPECS[@]}"
	)
done

ok "Beskid package sync finished"
