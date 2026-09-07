#!/usr/bin/env bash
# Repository-controlled delivery contracts that do not need external credentials.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"

production_compose="${ROOT}/beskid_infra/compose/production/docker-compose.yml"
promotion_workflow="${ROOT}/.github/workflows/reusable-promote.yml"

# Every required delivery image must have one service in the canonical Compose
# template. render-release-compose.sh enforces this at deployment time; keep a
# repository gate here so a new lane cannot publish an undeployable manifest.
for repository in \
	ghcr.io/cyber-nomad-collective/beskid-site \
	ghcr.io/cyber-nomad-collective/beskid-auth \
	ghcr.io/cyber-nomad-collective/beskid-learn \
	ghcr.io/cyber-nomad-collective/beskid-tracker \
	ghcr.io/cyber-nomad-collective/beskid-nexus \
	ghcr.io/cyber-nomad-collective/beskid-pckg; do
	count="$(rg -F -c "${repository}:" "${production_compose}")"
	if [[ "${count}" != "1" ]]; then
		echo "${repository} must map to exactly one production Compose service; found ${count}" >&2
		exit 1
	fi
done

learn_service="$(sed -n '/^  learn:/,/^  tracker:/p' "${production_compose}")"
if [[ -z "${learn_service}" || "${learn_service}" == *'profiles:'* ]]; then
	echo "beskid-learn must be an always-active production Compose service" >&2
	exit 1
fi

pckg_service="$(sed -n '/^  pckg:/,/^volumes:/p' "${production_compose}")"
for required in \
	'PCKG_DATABASE_URL: ${PCKG_DATABASE_URL:?set PCKG_DATABASE_URL}' \
	'PCKG_RELEASE_PUBLISHER_KEY_SHA256: ${PCKG_RELEASE_PUBLISHER_KEY_SHA256:?set PCKG_RELEASE_PUBLISHER_KEY_SHA256}' \
	'PCKG_ARTIFACT_ROOT:' \
	'PCKG_WEB_ROOT:' \
	'PCKG_BIND_ADDRESS: "0.0.0.0:8082"'; do
	if [[ "${pckg_service}" != *"${required}"* ]]; then
		echo "Rust pckg production service is missing ${required}" >&2
		exit 1
	fi
done

for required in \
	'BESKID_PCKG_KEY: ${{ secrets.BESKID_PCKG_KEY }}' \
	'PCKG_RELEASE_PUBLISHER_KEY_SHA256=' \
	'sync-runtime-env.sh'; do
	if ! rg -Fq "${required}" "${promotion_workflow}"; then
		echo "promotion workflow is missing publisher-key digest contract: ${required}" >&2
		exit 1
	fi
done
if rg -Fq 'BESKID_PCKG_API_KEY:' "${promotion_workflow}"; then
	echo "raw pckg publisher key must never be synchronized into Coolify" >&2
	exit 1
fi

if [[ "${pckg_service}" == *'${POSTGRES_PASSWORD}'* ]]; then
	echo "Rust pckg production service must not construct PCKG_DATABASE_URL from POSTGRES_PASSWORD" >&2
	exit 1
fi

for forbidden in \
	'ASPNETCORE_ENVIRONMENT:' \
	'HTTP_PORTS:' \
	'PCKG_AUTH_HUB_SERVICE_TOKEN:' \
	'PCKG_SESSION_SECRET:' \
	'PCKG_COOKIE_SECURE:' \
	'PCKG_ADMIN_BOOTSTRAP_SUBJECT:' \
	'SHELL_AUTH_MODE:'; do
	if [[ "${pckg_service}" == *"${forbidden}"* ]]; then
		echo "Rust pckg production service must not configure ${forbidden}" >&2
		exit 1
	fi
done

pckg_readme="${ROOT}/pckg/README.md"
pckg_openbao_docs="$(sed -n '/^### pckg$/,/^## Bootstrap$/p' "${ROOT}/beskid_infra/docs/openbao-layout.md")"
pckg_seed_script="${ROOT}/beskid_infra/scripts/configure-external-openbao.sh"
pckg_preflight_script="${ROOT}/beskid_infra/scripts/seed-openbao-from-gh.sh"
rg -Fq 'PCKG_DATABASE_URL' "${pckg_readme}"
rg -Fq 'PCKG_DATABASE_URL' <<<"${pckg_openbao_docs}"
for required in \
	'uri_encode()' \
	'POSTGRES_USER=${pckg_postgres_user}' \
	'POSTGRES_DB=${pckg_postgres_db}' \
	'PCKG_DB_HOST=${pckg_db_host}' \
	'PCKG_DB_PORT=${pckg_db_port}' \
	'PCKG_DATABASE_URL=${pckg_database_url}' \
	'"PCKG_DATABASE_URL" "yes"'; do
	if ! rg -Fq "${required}" "${pckg_seed_script}" "${pckg_preflight_script}"; then
		echo "pckg OpenBao seed/preflight is missing ${required}" >&2
		exit 1
	fi
done
for forbidden in 'Auth Hub' 'PCKG_AUTH_HUB_SERVICE_TOKEN' 'PCKG_SESSION_SECRET'; do
	if rg -Fq "${forbidden}" "${pckg_readme}" || [[ "${pckg_openbao_docs}" == *"${forbidden}"* ]]; then
		echo "pckg deployment documentation must not retain legacy ${forbidden} guidance" >&2
		exit 1
	fi
done

# A retry after an already-published platform VSIX must verify the target identity.
bash "${ROOT}/scripts/ci/test/open-vsx-publish.test.sh"

# Compiler CI mints the single 0.4.<build> version; delivery consumers must
# receive that exact emitted value rather than resolving a second version.
bash "${ROOT}/scripts/ci/test/resolve-beskid-version.test.sh"
bash "${ROOT}/scripts/ci/test/release-version-contract.test.sh"

echo "delivery contracts OK"
