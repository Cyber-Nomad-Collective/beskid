#!/usr/bin/env bash
# Refresh @beskid / trudoc packages from GitHub Packages (respects ^ ranges in package.json).
#
# Usage:
#   ./scripts/sync-beskid-packages.sh
#   ./scripts/sync-beskid-packages.sh beskid_tracker site/auth
#
# file: pins (local submodule links during pre-publish work) are skipped — bun update
# would otherwise try the registry and rewrite them. Revert to npm:@cyber-nomad-collective/...@^0.2.0
# after publishing, then re-run this script.
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
	"@beskid/server-observability"
	"@cyber-nomad-collective/trudoc"
	trudoc
)

DEFAULT_CONSUMERS=(
	beskid_tracker
	site/auth
	site/website
	site/platform-spec
	pckg/web
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

pkg_has_spec() {
	local pkg_json="$1"
	local dep_name="$2"
	grep -Fq "\"${dep_name}\"" "${pkg_json}"
}

# Return 0 if package.json pins the given dep name via file:
is_file_pin() {
	local pkg_json="$1"
	local dep_name="$2"
	local line
	line="$(grep -F "\"${dep_name}\"" "${pkg_json}" | head -n 1 || true)"
	[[ "${line}" == *'"file:'* ]]
}

section "Sync Beskid packages from GitHub Packages"

for rel in "${consumers[@]}"; do
	dir="${SUPERREPO_ROOT}/${rel}"
	pkg_json="${dir}/package.json"
	if [[ ! -f "${pkg_json}" ]]; then
		warn "Skip ${rel} (no package.json)"
		continue
	fi
	note "${rel}"

	to_update=()
	skipped_file=()
	for spec in "${BESKID_SPECS[@]}"; do
		if ! pkg_has_spec "${pkg_json}" "${spec}"; then
			continue
		fi
		if is_file_pin "${pkg_json}" "${spec}"; then
			skipped_file+=("${spec}")
			continue
		fi
		to_update+=("${spec}")
	done

	if [[ ${#skipped_file[@]} -gt 0 ]]; then
		warn "  file: pin(s) left untouched: ${skipped_file[*]}"
	fi

	if [[ ${#to_update[@]} -eq 0 ]]; then
		if [[ ${#skipped_file[@]} -gt 0 ]]; then
			note "  nothing to sync from registry (all listed Beskid deps are file: pins)"
		else
			note "  no Beskid package specs present"
		fi
		continue
	fi

	if (
		cd "${dir}"
		bun update "${to_update[@]}"
	); then
		:
	else
		warn "  bun update failed for ${rel} (often missing NODE_AUTH_TOKEN for GitHub Packages) — continuing"
	fi
done

ok "Beskid package sync finished"
echo
echo "Pre-publish file: pins (until @beskid/ui-react 0.2.9 / @beskid/beskid-ui 0.2.8 publish):"
echo "  site/website, site/platform-spec, pckg/web → file:../../beskid_web_common/packages/..."
echo "  beskid_tracker → @beskid/ui-react file:../beskid_web_common/packages/beskid-ui-react"
echo "After publish: switch those to npm:@cyber-nomad-collective/...@^0.2.0 and re-run this script."
