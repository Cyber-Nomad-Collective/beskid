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
  "${script_dir}/container-compose.sh" -f "${rendered}" config >/dev/null
  exit 0
fi

: "${COOLIFY_ENDPOINT:?Set COOLIFY_ENDPOINT}"
: "${COOLIFY_API_TOKEN:?Set COOLIFY_API_TOKEN}"
# Prefer explicit env (GitHub Actions vars); else lane config service_uuid.
if [[ -z "${COOLIFY_SERVICE_UUID:-}" ]]; then
  lane_config="${script_dir}/../../beskid_infra/config/coolify-${lane}.json"
  if [[ -f "${lane_config}" ]]; then
    COOLIFY_SERVICE_UUID="$(jq -r '.service_uuid // empty' "${lane_config}")"
  fi
fi
: "${COOLIFY_SERVICE_UUID:?Set COOLIFY_SERVICE_UUID or add service_uuid to beskid_infra/config/coolify-${lane}.json}"
export COOLIFY_SERVICE_UUID
api="${COOLIFY_ENDPOINT%/}/api/v1"
domains_config="${script_dir}/../../beskid_infra/config/domains.json"
lane_config="${script_dir}/../../beskid_infra/config/coolify-${lane}.json"

if [[ ! -f "${domains_config}" ]]; then
  echo "domain configuration is required for deployment: ${domains_config}" >&2
  exit 1
fi

coolify_urls="$(jq -ce --arg lane "${lane}" '
  .[$lane].services
  | if type != "object" or length == 0 then error("services must be a non-empty object") else . end
  | to_entries
  | if all(.[];
      (.key | type == "string" and length > 0)
      and (.value | type == "object")
      and (.value.host | type == "string" and test("^[A-Za-z0-9.-]+$") and length > 0)
      and (.value.port | type == "number" and floor == . and . >= 1 and . <= 65535)
    ) then . else error("each service requires a DNS host and port") end
  | map({name: .key, url: ("https://" + .value.host + ":" + (.value.port | tostring))})
  | if ([.[].name] | unique | length) == length and ([.[].url] | unique | length) == length
    then . else error("service names and URLs must be unique") end
' "${domains_config}" 2>/dev/null)" || {
  echo "invalid domain configuration for ${lane}: ${domains_config}" >&2
  exit 1
}

api_call() {
  local method="$1" path="$2"; shift 2
  curl --fail-with-body --silent --show-error --retry 3 --retry-all-errors \
    -X "${method}" -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
    -H 'Accept: application/json' -H 'Content-Type: application/json' \
    -H "traceparent: ${TRACEPARENT}" "${api}${path}" "$@"
}

patch_compose() {
  local compose_file="$1" compose_b64 patch_body
  compose_b64="$(base64 <"${compose_file}" | tr -d '\n')"
  patch_body="$(jq -n --arg compose "${compose_b64}" --argjson urls "${coolify_urls}" \
    '{docker_compose_raw: $compose, urls: $urls}')"
  api_call PATCH "/services/${COOLIFY_SERVICE_UUID}" -d "${patch_body}" >/dev/null
}

service_json="$(api_call GET "/services/${COOLIFY_SERVICE_UUID}")"
jq -e '.docker_compose_raw | type == "string" and length > 0' <<<"${service_json}" >/dev/null
jq -rj '.docker_compose_raw' <<<"${service_json}" >"${previous_payload}"

patch_compose "${rendered}"

# Coolify application deploys return deployment_uuid; Compose services often return
# only message + resource_uuid. Encode the latter as service:<uuid> for status polling.
trigger_deploy() {
  local response deployment_id resource_uuid message
  response="$(api_call GET "/deploy?uuid=${COOLIFY_SERVICE_UUID}&force=true")"
  deployment_id="$(jq -r '(.deployments[0].deployment_uuid // .deployments[0].uuid // .deployment_uuid // .uuid) // empty' <<<"${response}")"
  if [[ -n "${deployment_id}" ]]; then
    printf '%s' "${deployment_id}"
    return 0
  fi
  resource_uuid="$(jq -r '(.deployments[0].resource_uuid // empty)' <<<"${response}")"
  message="$(jq -r '(.deployments[0].message // empty)' <<<"${response}")"
  if [[ -n "${resource_uuid}" && "${resource_uuid}" == "${COOLIFY_SERVICE_UUID}" ]]; then
    # Must stay on stderr: callers capture stdout as the deployment handle.
    echo "Coolify service deploy accepted without deployment UUID: ${message:-ok}" >&2
    printf 'service:%s' "${COOLIFY_SERVICE_UUID}"
    return 0
  fi
  echo "Coolify did not return a deployment id" >&2
  echo "deploy response: ${response}" >&2
  return 1
}

# Only active Compose applications from this immutable release are readiness
# evidence. Coolify can retain inactive profile/orphan children from old
# compose revisions, so those must neither satisfy nor fail this check.
active_release_apps() {
  local compose_file="$1" lane_config="$2" profiles
  profiles="$(jq -r '.compose_profiles // ""' "${lane_config}")"
  awk -v active_profiles="${profiles}" '
    function profile_is_active(  values, profile_count, profile_index) {
      if (service_profiles == "") return 1
      profile_count = split(service_profiles, values, ",")
      for (profile_index = 1; profile_index <= profile_count; profile_index++) {
        if (index("," active_profiles ",", "," values[profile_index] ",") > 0) return 1
      }
      return 0
    }
    function flush() {
      if (service != "" && image ~ /@sha256:/ &&
          profile_is_active()) {
        print service "\t" image
      }
    }
    /^  [A-Za-z0-9_-]+:$/ {
      flush()
      service = $0
      sub(/^  /, "", service)
      sub(/:$/, "", service)
      image = ""
      service_profiles = ""
      reading_profiles = 0
      next
    }
    /^    profiles:[[:space:]]*$/ {
      service_profiles = ""
      reading_profiles = 1
      next
    }
    reading_profiles && /^      -[[:space:]]+/ {
      profile = $0
      sub(/^      -[[:space:]]+/, "", profile)
      service_profiles = service_profiles == "" ? profile : service_profiles "," profile
      next
    }
    /^    image:[[:space:]]*/ {
      reading_profiles = 0
      image = $0
      sub(/^    image:[[:space:]]*/, "", image)
      if ((image ~ /^".*"$/) || (image ~ /^\047.*\047$/)) {
        image = substr(image, 2, length(image) - 2)
      }
      next
    }
    /^    profiles:[[:space:]]*\[[^]]+\]$/ {
      reading_profiles = 0
      service_profiles = $0
      sub(/^    profiles:[[:space:]]*\[/, "", service_profiles)
      sub(/\]$/, "", service_profiles)
      gsub(/[[:space:]]/, "", service_profiles)
      next
    }
    { reading_profiles = 0 }
    END { flush() }
  ' "${compose_file}"
}

expected_release_apps_ready() {
  local expected_apps="$1" response="$2" service_name image
  [[ -n "${expected_apps}" ]] || return 1
  while IFS=$'\t' read -r service_name image; do
    [[ -n "${service_name}" && -n "${image}" ]] || return 1
    jq -e --arg name "${service_name}" --arg image "${image}" '
      any(.applications[]?;
        .name == $name
        and .image == $image
        and ((.status // "") | test("^running:healthy$"; "i"))
      )
    ' <<<"${response}" >/dev/null || return 1
  done <<<"${expected_apps}"
}

poll_service_status() {
  local service_uuid="$1" expected_apps="${2:-}" started now status response
  started="$(date +%s)"
  while true; do
    response="$(api_call GET "/services/${service_uuid}")"
    status="$(jq -r '.status // empty' <<<"${response}" | tr '[:upper:]' '[:lower:]')"
    if [[ -n "${expected_apps}" ]] && expected_release_apps_ready "${expected_apps}" "${response}"; then
      echo "Coolify service ${service_uuid}: active release applications are running healthy"
      return 0
    fi
    case "${status}" in
      running|running:*|degraded|degraded:*)
        if [[ -z "${expected_apps}" ]]; then
          echo "Coolify service ${service_uuid}: ${status}"
          return 0
        fi
        ;;
      exited|exited:*|*failed*|*error*|cancelled|canceled)
        echo "Coolify service ${service_uuid}: ${status}" >&2
        return 1
        ;;
      starting|starting:*|restarting|restarting:*|'')
        ;;
      *)
        if [[ -z "${expected_apps}" ]]; then
          echo "Coolify service ${service_uuid}: unknown status '${status}'" >&2
        fi
        ;;
    esac
    now="$(date +%s)"
    (( now - started < timeout_seconds )) || { echo "service status polling timed out (${status:-empty})" >&2; return 1; }
    sleep "${poll_seconds}"
  done
}

poll_deploy() {
  local deployment_id="$1" expected_apps="${2:-}" started now status response
  if [[ "${deployment_id}" == service:* ]]; then
    poll_service_status "${deployment_id#service:}" "${expected_apps}"
    return
  fi
  started="$(date +%s)"
  while true; do
    response="$(api_call GET "/deployments/${deployment_id}")"
    status="$(jq -r '.status // empty' <<<"${response}" | tr '[:upper:]' '[:lower:]')"
    case "${status}" in
      finished|success|succeeded)
        echo "Coolify deployment ${deployment_id}: ${status}"
        if [[ -n "${expected_apps}" ]]; then
          poll_service_status "${COOLIFY_SERVICE_UUID}" "${expected_apps}" || return 1
        fi
        return 0
        ;;
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
  local previous_expected_apps
  echo "rolling back Coolify Compose after failed deployment" >&2
  previous_expected_apps="$(active_release_apps "${previous_payload}" "${lane_config}")"
  [[ -n "${previous_expected_apps}" ]] || {
    echo "previous Compose has no active immutable applications to verify" >&2
    return 1
  }
  # Coolify PATCH expects base64(docker_compose_raw), same as the apply path.
  patch_compose "${previous_payload}"
  rollback_id="$(trigger_deploy)"
  poll_deploy "${rollback_id}" "${previous_expected_apps}"
}

if ! deployment_id="$(trigger_deploy)"; then
  rollback
  exit 1
fi
expected_release_apps="$(active_release_apps "${rendered}" "${lane_config}")"
if [[ -z "${expected_release_apps}" ]]; then
  echo "rendered Compose has no active immutable release applications for ${lane}" >&2
  rollback
  exit 1
fi
if ! poll_deploy "${deployment_id}" "${expected_release_apps}"; then
  rollback
  exit 1
fi

# Coolify can report digest-pinned containers as running while the aggregate
# service remains unhealthy. Emit redacted per-application errors before smoke
# checks so a failed runtime is diagnosable from the promotion evidence.
"${script_dir}/coolify-diagnostics.sh" "${lane}"

if [[ -n "${smoke_script}" ]]; then
  [[ -x "${smoke_script}" ]] || { echo "smoke script is not executable: ${smoke_script}" >&2; rollback; exit 1; }
  if ! "${smoke_script}" "${lane}"; then
    rollback
    exit 1
  fi
fi

echo "deployment verified: ${deployment_id}"
