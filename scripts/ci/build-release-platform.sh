#!/usr/bin/env bash
# Build a native CLI/LSP pair and retain structured diagnostics for publication.
# Usage: build-release-platform.sh <target> <cli-asset> <lsp-asset> <version> <channel> <output-dir> [bundle-asset]
set -euo pipefail

target="${1:?target}"
cli_asset="${2:?CLI asset}"
lsp_asset="${3:?LSP asset}"
version="${4:?version}"
channel="${5:?channel}"
output_dir="${6:?output directory}"
bundle_asset="${7:-}"
builder="${BUILD_RELEASE_ARTIFACT_SCRIPT:-$(dirname "$0")/build-release-artifact.sh}"
reporter="${CI_FAILURE_REPORTER:-$(dirname "$0")/render-ci-failure.sh}"

case "${channel}" in stable|unstable) ;; *) echo "unsupported channel: ${channel}" >&2; exit 1 ;; esac
mkdir -p "${output_dir}/release-logs"
output_dir="$(cd "${output_dir}" && pwd)"
builder="$(cd "$(dirname "${builder}")" && pwd)/$(basename "${builder}")"
repo_root="${RELEASE_ARTIFACT_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"

run_build() {
  local component="$1" package="$2" binary="$3" asset="$4" log="$5"
  local status=success rc=0 reason
  set +e
  (cd "${output_dir}" && bash "${builder}" "${package}" "${binary}" "${target}" "${asset}" "${version}") >"${log}" 2>&1
  rc=$?
  set -e
  [[ "${rc}" -eq 0 ]] || status=failed
  if [[ "${status}" == success && -f "${repo_root}/${asset}" && "${repo_root}/${asset}" != "${output_dir}/${asset}" ]]; then
    mv "${repo_root}/${asset}" "${output_dir}/${asset}"
  fi
  if [[ "${status}" == success && ! -f "${output_dir}/${asset}" ]]; then
    status=failed
    rc=1
    printf 'builder exited successfully but did not produce %s\n' "${asset}" >>"${log}"
  fi
  reason="$(tail -n 5 "${log}" | tr '\n' ' ' | sed 's/[[:space:]]\+/ /g' | cut -c1-500)"
  [[ -n "${reason}" || "${status}" == success ]] || reason="command exited with status ${rc}; see release-logs/$(basename "${log}")"
  jq -n \
    --arg status "${status}" --arg asset "${asset}" \
    --arg command "build-release-artifact.sh ${package} ${binary} ${target} ${asset} ${version}" \
    --arg log_path "release-logs/$(basename "${log}")" \
    --arg reason "${reason}" \
    --argjson exit_code "${rc}" \
    '{status:$status,asset:$asset,command:$command,exit_code:$exit_code,log_path:$log_path,reason:$reason}'
}

cli_log="${output_dir}/release-logs/${target}-cli.log"
lsp_log="${output_dir}/release-logs/${target}-lsp.log"
cli_result="$(run_build cli beskid_cli beskid_cli "${cli_asset}" "${cli_log}")"
lsp_result="$(run_build lsp beskid_lsp beskid_lsp "${lsp_asset}" "${lsp_log}")"

result="${output_dir}/platform-result-${target}.json"
if [[ -n "${bundle_asset}" ]]; then
  bundle_log="${output_dir}/release-logs/${target}-bundle.log"
  bundle_result="$(run_build bundle beskid_bundle ignored "${bundle_asset}" "${bundle_log}")"
  jq -n --arg target "${target}" --argjson cli "${cli_result}" --argjson lsp "${lsp_result}" --argjson bundle "${bundle_result}" \
    '{schema_version:1,target:$target,stage:"native-release-build",builds:{cli:$cli,lsp:$lsp,bundle:$bundle}}' >"${result}"
else
  jq -n --arg target "${target}" --argjson cli "${cli_result}" --argjson lsp "${lsp_result}" \
    '{schema_version:1,target:$target,stage:"native-release-build",builds:{cli:$cli,lsp:$lsp}}' >"${result}"
fi

diagnostic_files=()
for component in $(jq -r '.builds | keys[]' "${result}"); do
  if [[ "$(jq -r ".builds.${component}.status" "${result}")" == failed ]]; then
    diagnostic="${output_dir}/release-logs/${target}-${component}.failure.json"
    if ! bash "${reporter}" compiler "${component}-release-build" "${target}" \
      "$(jq -r ".builds.${component}.command" "${result}")" \
      "${output_dir}/release-logs/${target}-${component}.log" \
      "release-logs/${target}-${component}.log" "${diagnostic}"; then
      jq -n \
        --arg component compiler --arg stage "${component}-release-build" --arg platform "${target}" \
        --arg command "$(jq -r ".builds.${component}.command" "${result}")" \
        --arg reason "structured reporter failed; inspect retained raw log" \
        --arg log_path "release-logs/${target}-${component}.log" \
        '{schema_version:1,component:$component,stage:$stage,platform:$platform,command:$command,
          test_case:"unavailable",identifier:"unavailable",
          location:{file:"unavailable",line:0,column:0},reason:$reason,log_path:$log_path}' >"${diagnostic}"
    fi
    diagnostic_files+=("${diagnostic}")
  fi
done
if [[ "${#diagnostic_files[@]}" -gt 0 ]]; then
  diagnostics="$(jq -s '.' "${diagnostic_files[@]}")"
else
  diagnostics='[]'
fi
jq --argjson diagnostics "${diagnostics}" '.diagnostics = $diagnostics' "${result}" >"${result}.tmp"
mv "${result}.tmp" "${result}"

for component in $(jq -r '.builds | keys[]' "${result}"); do
  if [[ "$(jq -r ".builds.${component}.status" "${result}")" == failed ]]; then
    reason="$(jq -r ".builds.${component}.reason" "${result}")"
    echo "::error title=${target} ${component} build failed::${reason}"
  fi
done

if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  {
    printf "### Native release build: \`%s\`\n\n" "${target}"
    printf '| Component | Status | Command | Diagnostic log |\n|---|---|---|---|\n'
    for component in $(jq -r '.builds | keys[]' "${result}"); do
      jq -r --arg component "${component}" '.builds[$component] | "| \($component) | \(.status) | `\(.command)` | `\(.log_path)` |"' "${result}"
    done
  } >>"${GITHUB_STEP_SUMMARY}"
fi

if [[ "${channel}" == stable ]] && ! jq -e '[.builds[].status] | all(. == "success")' "${result}" >/dev/null; then
  exit 1
fi
