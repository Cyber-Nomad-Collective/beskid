#!/usr/bin/env bash
# Plan or apply an immutable Coolify Compose release with polling and rollback.
set -euo pipefail

apply=false
lane=""
manifest=""
compose=""
smoke_script=""
poll_seconds="${DEPLOY_POLL_SECONDS:-10}"
timeout_seconds="${DEPLOY_TIMEOUT_SECONDS:-600}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply) apply=true ;;
    --lane) lane="${2:?}"; shift ;;
    --manifest) manifest="${2:?}"; shift ;;
    --compose) compose="${2:?}"; shift ;;
    --smoke-script) smoke_script="${2:?}"; shift ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
  shift
done

case "${lane}" in staging|production) ;; *) echo "lane must be staging or production" >&2; exit 2 ;; esac
[[ -n "${manifest}" && -n "${compose}" ]] || { echo "--manifest and --compose are required" >&2; exit 2; }

script_dir="$(cd "$(dirname "$0")" && pwd)"
rendered="$(mktemp)"
previous_payload="$(mktemp)"
trap 'rm -f "${rendered}" "${previous_payload}"' EXIT
"${script_dir}/render-release-compose.sh" "${manifest}" "${compose}" "${rendered}"
lane_rendered="${rendered}.lane"
awk -v lane="${lane}" '
  !replaced && /^name:[[:space:]]*/ { print "name: beskid-platform-" lane; replaced = 1; next }
  { print }
' "${rendered}" >"${lane_rendered}"
mv "${lane_rendered}" "${rendered}"

manifest_sha="$(sha256sum "${manifest}" | awk '{print $1}')"
if [[ -z "${TRACEPARENT:-}" ]]; then
  trace_id="$(printf '%s' "${GITHUB_RUN_ID:-local}:${GITHUB_RUN_ATTEMPT:-1}:${manifest_sha}:${lane}" | sha256sum | cut -c1-32)"
  span_id="$(printf '%s' "deploy:${trace_id}" | sha256sum | cut -c1-16)"
  export TRACEPARENT="00-${trace_id}-${span_id}-01"
fi
export BESKID_RELEASE_MANIFEST_SHA256="${manifest_sha}"
export BESKID_DEPLOYMENT_ENVIRONMENT="${lane}"
echo "deployment traceparent: ${TRACEPARENT}"
echo "release manifest sha256: ${manifest_sha}"

if [[ "${apply}" != true ]]; then
  echo "plan-only: external deployment was not requested"
  docker compose -f "${rendered}" config >/dev/null
  exit 0
fi

: "${COOLIFY_ENDPOINT:?Set COOLIFY_ENDPOINT}"
: "${COOLIFY_API_TOKEN:?Set COOLIFY_API_TOKEN}"
: "${COOLIFY_SERVICE_UUID:?Set COOLIFY_SERVICE_UUID}"
api="${COOLIFY_ENDPOINT%/}/api/v1"

api_call() {
  local method="$1" path="$2"; shift 2
  curl --fail-with-body --silent --show-error --retry 3 --retry-all-errors \
    -X "${method}" -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
    -H 'Accept: application/json' -H 'Content-Type: application/json' \
    -H "traceparent: ${TRACEPARENT}" "${api}${path}" "$@"
}

service_json="$(api_call GET "/services/${COOLIFY_SERVICE_UUID}")"
jq -e '.docker_compose_raw | type == "string" and length > 0' <<<"${service_json}" >/dev/null
jq -rj '.docker_compose_raw' <<<"${service_json}" >"${previous_payload}"

compose_b64="$(base64 <"${rendered}" | tr -d '\n')"
patch_body="$(jq -n --arg compose "${compose_b64}" '{docker_compose_raw: $compose}')"
api_call PATCH "/services/${COOLIFY_SERVICE_UUID}" -d "${patch_body}" >/dev/null

trigger_deploy() {
  local response deployment_id
  response="$(api_call GET "/deploy?uuid=${COOLIFY_SERVICE_UUID}&force=true")"
  deployment_id="$(jq -r '(.deployments[0].deployment_uuid // .deployments[0].uuid // .deployment_uuid // .uuid) // empty' <<<"${response}")"
  [[ -n "${deployment_id}" ]] || { echo "Coolify did not return a deployment id" >&2; return 1; }
  printf '%s' "${deployment_id}"
}

poll_deploy() {
  local deployment_id="$1" started now status response
  started="$(date +%s)"
  while true; do
    response="$(api_call GET "/deployments/${deployment_id}")"
    status="$(jq -r '.status // empty' <<<"${response}" | tr '[:upper:]' '[:lower:]')"
    case "${status}" in
      finished|success|succeeded) echo "Coolify deployment ${deployment_id}: ${status}"; return 0 ;;
      failed|error|cancelled|canceled) echo "Coolify deployment ${deployment_id}: ${status}" >&2; return 1 ;;
      queued|in_progress|running|pending|'') ;;
      *) echo "Coolify deployment ${deployment_id}: unknown status '${status}'" >&2 ;;
    esac
    now="$(date +%s)"
    (( now - started < timeout_seconds )) || { echo "deployment polling timed out" >&2; return 1; }
    sleep "${poll_seconds}"
  done
}

rollback() {
  echo "rolling back Coolify Compose after failed deployment" >&2
  rollback_body="$(jq -n --rawfile compose "${previous_payload}" '{docker_compose_raw: $compose}')"
  api_call PATCH "/services/${COOLIFY_SERVICE_UUID}" -d "${rollback_body}" >/dev/null
  rollback_id="$(trigger_deploy)"
  poll_deploy "${rollback_id}"
}

if ! deployment_id="$(trigger_deploy)"; then
  rollback
  exit 1
fi
if ! poll_deploy "${deployment_id}"; then
  rollback
  exit 1
fi

if [[ -n "${smoke_script}" ]]; then
  [[ -x "${smoke_script}" ]] || { echo "smoke script is not executable: ${smoke_script}" >&2; rollback; exit 1; }
  if ! "${smoke_script}" "${lane}"; then
    rollback
    exit 1
  fi
fi

echo "deployment verified: ${deployment_id}"
