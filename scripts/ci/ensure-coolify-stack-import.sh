#!/usr/bin/env bash
# Adopt existing Coolify stack resources into OpenTofu state (stateless CI idempotency).
# Usage: ensure-coolify-stack-import.sh [production|staging]
set -euo pipefail

env_name="${1:-production}"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
env_dir="${repo_root}/beskid_infra/environments/${env_name}"

: "${COOLIFY_ENDPOINT:?Set COOLIFY_ENDPOINT}"
: "${COOLIFY_API_TOKEN:?Set COOLIFY_API_TOKEN}"

if [[ ! -d "${env_dir}" ]]; then
  echo "Unknown environment directory: ${env_dir}" >&2
  exit 1
fi

case "${env_name}" in
production) suffix="" ;;
staging) suffix="-staging" ;;
*)
  echo "Unsupported environment: ${env_name} (expected production|staging)" >&2
  exit 1
  ;;
esac

base="${COOLIFY_ENDPOINT%/}"

single_uuid_by_name() {
  local endpoint="$1"
  local name="$2"
  local matches
  matches="$(
    curl -fsSL "${base}${endpoint}" \
    -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
    -H "Accept: application/json" \
    | jq -r --arg n "${name}" '.[] | select(.name == $n) | (.uuid // .id)'
  )"
  if [[ -z "${matches}" ]]; then
    return 0
  fi

  local count
  count="$(printf '%s\n' "${matches}" | sed '/^$/d' | wc -l | tr -d ' ')"
  if [[ "${count}" -gt 1 ]]; then
    echo "Duplicate Coolify resources named '${name}' found at ${endpoint}; clean up duplicates first." >&2
    return 1
  fi

  printf '%s\n' "${matches}" | sed '/^$/d'
}

single_storage_uuid_by_name() {
  local application_uuid="$1"
  local storage_name="$2"
  local matches
  matches="$(
    curl -fsSL "${base}/api/v1/applications/${application_uuid}/storages" \
      -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
      -H "Accept: application/json" \
      | jq -r --arg n "${storage_name}" '.[] | select(.name == $n) | (.uuid // .id)'
  )"
  if [[ -z "${matches}" ]]; then
    return 0
  fi

  local count
  count="$(printf '%s\n' "${matches}" | sed '/^$/d' | wc -l | tr -d ' ')"
  if [[ "${count}" -gt 1 ]]; then
    echo "Duplicate storages named '${storage_name}' found for application ${application_uuid}." >&2
    return 1
  fi

  printf '%s\n' "${matches}" | sed '/^$/d'
}

import_if_missing() {
  local addr="$1"
  local id="$2"
  if [[ -z "${id}" || "${id}" == "null" ]]; then
    return 0
  fi
  if tofu state show "${addr}" >/dev/null 2>&1; then
    echo "${addr} already in state."
    return 0
  fi
  echo "Importing ${id} -> ${addr}"
  tofu import -input=false "${addr}" "${id}"
}

cd "${env_dir}"

for service in site auth tracker nexus; do
  app_name="beskid-${service}${suffix}"
  app_id="$(single_uuid_by_name "/api/v1/applications" "${app_name}")"
  import_if_missing "module.stack.module.apps[\"${service}\"].coolify_application.this" "${app_id}"
  import_if_missing "module.stack.module.apps[\"${service}\"].coolify_envs_bulk.this" "${app_id}"
done

pckg_app_name="beskid-pckg${suffix}"
pckg_app_id="$(single_uuid_by_name "/api/v1/applications" "${pckg_app_name}")"
import_if_missing "module.stack.module.pckg[0].coolify_application.app" "${pckg_app_id}"
import_if_missing "module.stack.module.pckg[0].coolify_envs_bulk.app" "${pckg_app_id}"

pckg_db_name="beskid-pckg-db${suffix}"
pckg_db_id="$(single_uuid_by_name "/api/v1/databases" "${pckg_db_name}")"
import_if_missing "module.stack.module.pckg[0].coolify_database_postgresql.this" "${pckg_db_id}"

if [[ -n "${pckg_app_id}" ]]; then
  pckg_packages_id="$(single_storage_uuid_by_name "${pckg_app_id}" "${pckg_app_name}-packages")"
  if [[ -n "${pckg_packages_id}" ]]; then
    import_if_missing "module.stack.module.pckg[0].coolify_application_storage.packages" "${pckg_app_id}/${pckg_packages_id}"
  fi
  pckg_data_id="$(single_storage_uuid_by_name "${pckg_app_id}" "${pckg_app_name}-data")"
  if [[ -n "${pckg_data_id}" ]]; then
    import_if_missing "module.stack.module.pckg[0].coolify_application_storage.data" "${pckg_app_id}/${pckg_data_id}"
  fi
fi

auth_app_name="beskid-auth${suffix}"
auth_app_id="$(single_uuid_by_name "/api/v1/applications" "${auth_app_name}")"
if [[ -n "${auth_app_id}" ]]; then
  auth_data_id="$(single_storage_uuid_by_name "${auth_app_id}" "auth-data")"
  if [[ -n "${auth_data_id}" ]]; then
    import_if_missing "module.stack.module.apps[\"auth\"].coolify_application_storage.volume[\"data\"]" "${auth_app_id}/${auth_data_id}"
  fi
fi

tracker_app_name="beskid-tracker${suffix}"
tracker_app_id="$(single_uuid_by_name "/api/v1/applications" "${tracker_app_name}")"
if [[ -n "${tracker_app_id}" ]]; then
  tracker_data_id="$(single_storage_uuid_by_name "${tracker_app_id}" "tracker-data")"
  if [[ -n "${tracker_data_id}" ]]; then
    import_if_missing "module.stack.module.apps[\"tracker\"].coolify_application_storage.volume[\"data\"]" "${tracker_app_id}/${tracker_data_id}"
  fi
fi

nexus_app_name="beskid-nexus${suffix}"
nexus_app_id="$(single_uuid_by_name "/api/v1/applications" "${nexus_app_name}")"
if [[ -n "${nexus_app_id}" ]]; then
  nexus_data_id="$(single_storage_uuid_by_name "${nexus_app_id}" "nexus-data")"
  if [[ -n "${nexus_data_id}" ]]; then
    import_if_missing "module.stack.module.apps[\"nexus\"].coolify_application_storage.volume[\"data\"]" "${nexus_app_id}/${nexus_data_id}"
  fi
fi
