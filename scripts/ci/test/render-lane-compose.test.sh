#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
renderer="${root}/scripts/ci/render-lane-compose.sh"
source_compose="${root}/beskid_infra/compose/production/docker-compose.yml"
tmp="$(mktemp -d)"
trap 'rm -rf "${tmp}"' EXIT

bash "${renderer}" production "${source_compose}" "${tmp}/production.yml"
bash "${renderer}" staging "${source_compose}" "${tmp}/staging.yml"

grep -Fqx 'name: beskid-platform-production' "${tmp}/production.yml"
grep -Fqx 'name: beskid-platform-staging' "${tmp}/staging.yml"

while IFS=$'\t' read -r key docker_name; do
	rg -Uq "^  ${key}:\n    name: ${docker_name}\n    external: true$" "${tmp}/production.yml" || {
		echo "production render did not adopt ${key} as ${docker_name}" >&2
		exit 1
	}
	if rg -Fq "${docker_name}" "${tmp}/staging.yml"; then
		echo "staging render leaked production volume ${docker_name}" >&2
		exit 1
	fi
done < <(jq -r '.external_volumes | to_entries[] | [.key, .value] | @tsv' \
	"${root}/beskid_infra/config/coolify-production.json")

if rg -Uq '^  (auth-data|memgraph-data|tracker-data|nexus-data|pckg_pg_data|pckg_packages):\n    external: true$' "${tmp}/staging.yml"; then
	echo 'staging render contains an external state volume' >&2
	exit 1
fi

echo 'lane-specific Compose rendering tests OK'
