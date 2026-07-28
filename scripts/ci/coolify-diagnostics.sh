#!/usr/bin/env bash
# Print Coolify service health and only redacted runtime error lines.
set -euo pipefail

lane="${1:?usage: $0 <staging|production>}"
case "${lane}" in staging|production) ;; *) echo "invalid lane: ${lane}" >&2; exit 2 ;; esac

: "${COOLIFY_ENDPOINT:?Coolify endpoint is required}"
: "${COOLIFY_API_TOKEN:?Coolify token is required}"

script_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
lane_config="${repo_root}/beskid_infra/config/coolify-${lane}.json"
[[ -f "${lane_config}" ]] || { echo "lane config not found: ${lane_config}" >&2; exit 2; }

# jq -r renders a missing key as the literal "null", which would otherwise be
# spliced into the request path and query a bogus service.
service_uuid="$(jq -r '.service_uuid // empty' "${lane_config}")"
[[ -n "${service_uuid}" ]] || { echo "service_uuid is missing or empty in ${lane_config}" >&2; exit 2; }
service="$(curl --fail-with-body --silent --show-error \
  -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" -H 'Accept: application/json' \
  "${COOLIFY_ENDPOINT%/}/api/v1/services/${service_uuid}")"

echo "service status: $(jq -r '.status // "unknown"' <<<"${service}")"
jq -r '.applications[]? | [(.uuid // .id // "unknown"), (.name // "unnamed"), (.status // "unknown"), (.image // "unknown")] | @tsv' \
  <<<"${service}" | while IFS=$'\t' read -r application_uuid application_name application_status application_image; do
    echo "application ${application_name} (${application_uuid}): ${application_status} ${application_image}"
    [[ "${application_uuid}" != "unknown" ]] || continue
    logs="$(curl --silent --show-error --max-time 20 \
      -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" -H 'Accept: application/json' \
      "${COOLIFY_ENDPOINT%/}/api/v1/applications/${application_uuid}/logs?lines=120" || true)"
    jq -r '.logs // empty' <<<"${logs}" \
      | rg -i 'error|exception|invalid|missing|session_secret|auth_hub_public_url|memgraph' \
      | tail -40 \
      | sed -E 's/(SESSION_SECRET|AUTH_HUB_SECRET|GITHUB_CLIENT_SECRET|GITHUB_SYNC_TOKEN)=?[^[:space:]]*/\1=[REDACTED]/g' \
      || true
  done
