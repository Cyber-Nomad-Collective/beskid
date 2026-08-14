#!/usr/bin/env bash
# Run a CI command while retaining raw output and a structured failure record.
# Usage: run-ci-reported-command.sh <component> <stage> <platform> <report-dir> -- <command>...
set -euo pipefail

component="${1:?component}"
stage="${2:?stage}"
platform="${3:?platform}"
report_dir="${4:?report directory}"
shift 4
[[ "${1:-}" == -- ]] || { echo 'expected -- before command' >&2; exit 2; }
shift
[[ "$#" -gt 0 ]] || { echo 'command is required' >&2; exit 2; }

mkdir -p "${report_dir}/raw-logs" "${report_dir}/failures"
mkdir -p "${report_dir}/stages"
safe_stage="$(printf '%s' "${stage}" | tr -c '[:alnum:]_.-' '-')"
raw_log="${report_dir}/raw-logs/${safe_stage}.log"
failure_json="${report_dir}/failures/${safe_stage}.json"
command_text="$(printf '%q ' "$@")"

set +e
"$@" > >(tee "${raw_log}") 2> >(tee -a "${raw_log}" >&2)
rc=$?
set -e

if [[ "${rc}" -ne 0 ]]; then
  bash "$(dirname "$0")/render-ci-failure.sh" \
    "${component}" "${stage}" "${platform}" "${command_text}" \
    "${raw_log}" "raw-logs/${safe_stage}.log" "${failure_json}"
fi
jq -n --arg component "${component}" --arg stage "${stage}" --arg platform "${platform}" \
  --arg command "${command_text}" --arg status "$([[ "${rc}" -eq 0 ]] && echo success || echo failed)" \
  --arg raw_log "raw-logs/${safe_stage}.log" \
  '{schema_version:1,component:$component,stage:$stage,platform:$platform,command:$command,status:$status,raw_log:$raw_log}' \
  >"${report_dir}/stages/${safe_stage}.json"

if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  status=PASS
  [[ "${rc}" -eq 0 ]] || status=FAIL
  {
    printf '### %s / %s — %s\n\n' "${component}" "${stage}" "${status}"
    printf -- "- Platform: \`%s\`\n- Command: \`%s\`\n- Raw log: \`%s\`\n" \
      "${platform}" "${command_text}" "raw-logs/${safe_stage}.log"
    if [[ -f "${failure_json}" ]]; then
      jq -r '"- Identifier: `\(.identifier)`\n- Location: `\(.location.file):\(.location.line):\(.location.column)`\n- Reason: \(.reason)"' "${failure_json}"
    fi
    echo
  } >>"${GITHUB_STEP_SUMMARY}"
fi

exit "${rc}"
