#!/usr/bin/env bash
# Convert one failed CI command log into a structured diagnostic record.
# Usage: render-ci-failure.sh <component> <stage> <platform> <command> <raw-log> <retained-log-path> <output-json>
set -euo pipefail

component="${1:?component}"
stage="${2:?stage}"
platform="${3:?platform}"
command_text="${4:?command}"
raw_log="${5:?raw log}"
retained_log_path="${6:?retained log path}"
output="${7:?output JSON}"

normalized_log="$(sed 's#\\#/#g' "${raw_log}")"
rust_failure_cases=()
while IFS= read -r failure_case; do
  rust_failure_cases+=("${failure_case}")
done < <(printf '%s\n' "${normalized_log}" | awk '
    /^failures:$/ { capture = 1; next }
    capture && /^test result:/ { capture = 0; next }
    capture && /^    [^[:space:]]/ { sub(/^    /, ""); print }
  ')

if [[ "${#rust_failure_cases[@]}" -gt 0 ]]; then
  for index in "${!rust_failure_cases[@]}"; do
    test_case="${rust_failure_cases[$index]}"
    block="$(printf '%s\n' "${normalized_log}" | awk -v header="---- ${test_case} stdout ----" '
      $0 == header { capture = 1; next }
      capture && /^---- .* stdout ----$/ { exit }
      capture && /^failures:$/ { exit }
      capture { print }
    ')"
    qualified_case="${test_case//./::}"
    if [[ "${qualified_case}" == "${component}::"* ]]; then
      identifier="${qualified_case}"
    else
      identifier="${component}::${qualified_case}"
    fi
    location="$(printf '%s\n' "${block}" | grep -Eo '([A-Za-z]:)?[^[:space:]]+\.(rs|bd|bsol|bproj):[0-9]+:[0-9]+' | head -n 1 || true)"
    if [[ -n "${location}" ]]; then
      column="${location##*:}"
      without_column="${location%:*}"
      line="${without_column##*:}"
      file="${without_column%:*}"
      file="${file#./}"
      case "${file}" in
        */beskid/beskid/*) file="${file#*/beskid/beskid/}" ;;
        */beskid/*) file="${file#*/beskid/}" ;;
      esac
      case "${component}:${file}" in
        compiler:crates/*|lsp:crates/*) file="compiler/${file}" ;;
        corelib:packages/*|corelib:beskid_corelib/*) file="compiler/corelib/${file}" ;;
      esac
    else
      file=unavailable
      line=0
      column=0
    fi
    reason="$(printf '%s\n' "${block}" | awk '/panicked at / { print; if (getline) print; exit }' | tr '\n' ' ' | sed 's/[[:space:]]\+/ /g' | cut -c1-1000)"
    [[ -n "${reason}" ]] || reason='unavailable; inspect retained raw log'
    record_output="${output}"
    if [[ "${index}" -gt 0 ]]; then
      record_output="${output%.json}.$((index + 1)).json"
    fi
    jq -n \
      --arg component "${component}" --arg stage "${stage}" --arg platform "${platform}" \
      --arg command "${command_text}" --arg test_case "${test_case}" \
      --arg identifier "${identifier}" --arg file "${file}" \
      --argjson line "${line}" --argjson column "${column}" \
      --arg reason "${reason}" --arg log_path "${retained_log_path}" \
      '{schema_version:1,component:$component,stage:$stage,platform:$platform,command:$command,
        test_case:$test_case,identifier:$identifier,
        location:{file:$file,line:$line,column:$column},reason:$reason,log_path:$log_path}' >"${record_output}"
    if [[ -n "${GITHUB_ACTIONS:-}" ]]; then
      if [[ "${file}" != unavailable ]]; then
        echo "::error file=${file},line=${line},col=${column},title=${component} ${stage} failed::${identifier}: ${reason}"
      else
        echo "::error title=${component} ${stage} failed::${identifier}: ${reason}"
      fi
    fi
  done
  exit 0
fi

test_case="$(printf '%s\n' "${normalized_log}" | sed -nE \
  -e 's/^test ([^ ]+) \.\.\. FAILED$/\1/p' \
  -e 's/^FAILED[[:space:]]+([^[:space:]]+).*$/\1/p' | head -n 1)"

if [[ -n "${test_case}" ]]; then
  qualified_case="${test_case//./::}"
  if [[ "${qualified_case}" == "${component}::"* ]]; then
    identifier="${qualified_case}"
  else
    identifier="${component}::${qualified_case}"
  fi
else
  identifier=unavailable
fi

location="$(printf '%s\n' "${normalized_log}" | grep -Eo '([A-Za-z]:)?[^[:space:]]+\.(rs|bd|bsol|bproj):[0-9]+:[0-9]+' | head -n 1 || true)"
if [[ -n "${location}" ]]; then
  column="${location##*:}"
  without_column="${location%:*}"
  line="${without_column##*:}"
  file="${without_column%:*}"
  file="${file#./}"
  case "${file}" in
    */beskid/beskid/*) file="${file#*/beskid/beskid/}" ;;
    */beskid/*) file="${file#*/beskid/}" ;;
  esac
  case "${component}:${file}" in
    compiler:crates/*|lsp:crates/*) file="compiler/${file}" ;;
    corelib:packages/*|corelib:beskid_corelib/*) file="compiler/corelib/${file}" ;;
  esac
else
  file=unavailable
  line=0
  column=0
fi

reason="$(tail -n 8 "${raw_log}" | tr '\n' ' ' | sed 's/[[:space:]]\+/ /g' | cut -c1-1000)"
[[ -n "${reason}" ]] || reason='unavailable; inspect retained raw log'

jq -n \
  --arg component "${component}" --arg stage "${stage}" --arg platform "${platform}" \
  --arg command "${command_text}" --arg test_case "${test_case:-unavailable}" \
  --arg identifier "${identifier}" --arg file "${file}" \
  --argjson line "${line}" --argjson column "${column}" \
  --arg reason "${reason}" --arg log_path "${retained_log_path}" \
  '{schema_version:1,component:$component,stage:$stage,platform:$platform,command:$command,
    test_case:$test_case,identifier:$identifier,
    location:{file:$file,line:$line,column:$column},reason:$reason,log_path:$log_path}' >"${output}"

if [[ -n "${GITHUB_ACTIONS:-}" ]]; then
  if [[ "${file}" != unavailable ]]; then
    echo "::error file=${file},line=${line},col=${column},title=${component} ${stage} failed::${identifier}: ${reason}"
  else
    echo "::error title=${component} ${stage} failed::identifier unavailable: ${reason}"
  fi
fi
