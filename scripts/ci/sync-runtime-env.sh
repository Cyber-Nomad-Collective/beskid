#!/usr/bin/env bash
# Fail-closed OpenBao KV v2 -> Coolify environment synchronization.
set -euo pipefail

[[ $# -eq 2 ]] || { echo "usage: $0 <staging|production> <lane-config.json>" >&2; exit 2; }
lane="$1"
config="$2"
case "${lane}" in staging|production) ;; *) echo "invalid lane: ${lane}" >&2; exit 2 ;; esac
[[ -f "${config}" ]] || { echo "lane config not found: ${config}" >&2; exit 1; }

: "${OPENBAO_ADDR:?Set OPENBAO_ADDR}"
: "${OPENBAO_TOKEN:?Set OPENBAO_TOKEN}"
: "${COOLIFY_ENDPOINT:?Set COOLIFY_ENDPOINT}"
: "${COOLIFY_API_TOKEN:?Set COOLIFY_API_TOKEN}"
: "${COOLIFY_SERVICE_UUID:?Set COOLIFY_SERVICE_UUID}"

merged="$(mktemp)"
chunk="$(mktemp)"
trap 'rm -f "${merged}" "${chunk}"' EXIT
jq '.static_env // {}' "${config}" >"${merged}"

while IFS= read -r service; do
  url="${OPENBAO_ADDR%/}/v1/secret/data/beskid/${lane}/${service}"
  curl --fail-with-body --silent --show-error --retry 3 --retry-all-errors \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" -H 'Accept: application/json' \
    -H "traceparent: ${TRACEPARENT:-}" "${url}" \
    | jq -e '.data.data | select(type == "object" and length > 0)' \
      >"${chunk}"
  jq -s '.[0] * .[1]' "${merged}" "${chunk}" >"${merged}.next"
  mv "${merged}.next" "${merged}"
done < <(jq -r '.openbao_services[]' "${config}")

profiles="$(jq -r '.compose_profiles // ""' "${config}")"
if [[ -n "${profiles}" ]]; then
  jq --arg profiles "${profiles}" '. + {COMPOSE_PROFILES: $profiles}' "${merged}" >"${merged}.next"
  mv "${merged}.next" "${merged}"
fi

# Make the immutable release and deployment trace queryable from every service.
if [[ -n "${BESKID_RELEASE_MANIFEST_SHA256:-}" ]]; then
  jq --arg value "${BESKID_RELEASE_MANIFEST_SHA256}" \
    '. + {BESKID_RELEASE_MANIFEST_SHA256: $value}' "${merged}" >"${merged}.next"
  mv "${merged}.next" "${merged}"
fi
if [[ -n "${TRACEPARENT:-}" ]]; then
  jq --arg value "${TRACEPARENT}" \
    '. + {BESKID_DEPLOYMENT_TRACEPARENT: $value}' "${merged}" >"${merged}.next"
  mv "${merged}.next" "${merged}"
fi

items="$(jq -c '[to_entries[] | {key: .key, value: (.value | tostring)}]' "${merged}")"
body="$(jq -n --argjson data "${items}" '{data: $data}')"
curl --fail-with-body --silent --show-error --retry 3 --retry-all-errors \
  -X PATCH -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -H "traceparent: ${TRACEPARENT:-}" \
  "${COOLIFY_ENDPOINT%/}/api/v1/services/${COOLIFY_SERVICE_UUID}/envs/bulk" \
  -d "${body}" >/dev/null

echo "runtime environment synchronized for ${lane} ($(jq 'length' "${merged}") keys)"
