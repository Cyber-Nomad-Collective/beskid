#!/usr/bin/env bash
# Aggregate native compiler release results and enforce channel eligibility.
# Usage: build-release-state.sh <channel> <version> <compiler-sha> <superrepo-sha> <gate-result> <output> <platform-result>...
set -euo pipefail

channel="${1:?channel}"
version="${2:?version}"
compiler_sha="${3:?compiler SHA}"
superrepo_sha="${4:?superrepo SHA}"
gate_result="${5:?gate result}"
output="${6:?output path}"
shift 6

case "${channel}" in stable|unstable) ;; *) echo "unsupported channel: ${channel}" >&2; exit 1 ;; esac
[[ "$#" -gt 0 ]] || { echo 'at least one platform result is required' >&2; exit 1; }

results_json="$(jq -s 'sort_by(.target)' "$@")"
gate_diagnostics='[]'
test_results='[]'
if [[ -n "${GATE_REPORT_DIR:-}" && -d "${GATE_REPORT_DIR}/stages" ]]; then
  stage_files=("${GATE_REPORT_DIR}"/stages/*.json)
  if [[ -e "${stage_files[0]}" ]]; then
    stages_json="$(jq -s 'sort_by(.component, .stage)' "${stage_files[@]}")"
    test_results="$(jq '[.[] | {component, stage, platform, status, command, raw_log, job_id: null, job_url: null}]' <<<"${stages_json}")"
  else
    successful_tests='[]'
    failed_tests='[]'
  fi
  failure_files=("${GATE_REPORT_DIR}"/failures/*.json)
  if [[ -e "${failure_files[0]}" ]]; then
    gate_diagnostics="$(jq -s 'map(.log_path = "gate-evidence/" + .log_path)' "${failure_files[@]}")"
  fi
fi

if [[ -n "${GATE_REPORT_DIR:-}" && -f "${GATE_REPORT_DIR}/triggering-run-jobs.json" ]]; then
  matrix_results="$(jq '
    [.jobs[] |
      select(.name == "Windows ABI-v5 runtime-kit matrix" or
             .name == "Linux ABI-v5 runtime-kit matrix" or
             .name == "macOS ABI-v5 runtime-kit matrix") |
      (if .name | startswith("Windows") then {platform:"Windows", suffix:"windows"}
       elif .name | startswith("Linux") then {platform:"Linux", suffix:"linux"}
       else {platform:"macOS", suffix:"macos"} end) as $target |
      {
        component: "compiler",
        stage: ("abi-v5-runtime-kit-" + $target.suffix),
        platform: $target.platform,
        status: (if .conclusion == "success" then "success" else "failed" end),
        conclusion: (.conclusion // "unknown"),
        command: (([.steps[]? | select(.conclusion != "success" and .conclusion != "skipped") | .name] | first) // "GitHub Actions job"),
        raw_log: .html_url,
        job_id: .id,
        job_url: .html_url
      }
    ] | sort_by(.stage)
  ' "${GATE_REPORT_DIR}/triggering-run-jobs.json")"
  test_results="$(jq -n --argjson stages "${test_results}" --argjson matrices "${matrix_results}" '$stages + $matrices')"
  matrix_diagnostics="$(jq '[.[] | select(.status == "failed") | {
    schema_version: 1,
    component,
    stage,
    platform,
    command,
    identifier: "unavailable",
    signature: "unavailable",
    location: {file:"unavailable", line:0, column:0, offset:null},
    reason: ("GitHub Actions job concluded " + .conclusion),
    log_path: .job_url,
    job_url
  }]' <<<"${matrix_results}")"
  gate_diagnostics="$(jq -n --argjson reports "${gate_diagnostics}" --argjson matrices "${matrix_diagnostics}" '$reports + $matrices')"
fi

if [[ "$(jq 'length' <<<"${test_results}")" -gt 0 ]]; then
  successful_tests="$(jq '[.[] | select(.status == "success") | "\(.component):\(.stage)"] | unique | sort' <<<"${test_results}")"
  failed_tests="$(jq '[.[] | select(.status == "failed") | "\(.component):\(.stage)"] | unique | sort' <<<"${test_results}")"
elif [[ "${gate_result}" == success ]]; then
  successful_tests='["compiler-rust-gate","lsp-command-contract-gate"]'
  failed_tests='[]'
else
  successful_tests='[]'
  failed_tests='["compiler-rust-gate","lsp-command-contract-gate"]'
fi

jq -n \
  --arg channel "${channel}" \
  --arg version "${version}" \
  --arg compiler_sha "${compiler_sha}" \
  --arg superrepo_sha "${superrepo_sha}" \
  --arg gate_result "${gate_result}" \
  --argjson results "${results_json}" \
  --argjson successful_tests "${successful_tests}" \
  --argjson failed_tests "${failed_tests}" \
  --argjson test_results "${test_results}" \
  --argjson gate_diagnostics "${gate_diagnostics}" '
  def complete: .builds.cli.status == "success" and .builds.lsp.status == "success";
  def successful_assets: [.builds[] | select(.status == "success") | .asset];
  def failed_assets: [.builds[] | select(.status != "success") | .asset];
  {
    schema_version: 1,
    channel: $channel,
    version: $version,
    publishable: false,
    provenance: {compiler_commit: $compiler_sha, superrepo_commit: $superrepo_sha},
    tests: {gate_result: $gate_result, successful: $successful_tests, failed: $failed_tests, results: $test_results},
    platforms: $results,
    complete_platforms: [$results[] | select(complete) | .target],
    available_artifacts: [$results[] | successful_assets[]],
    missing_artifacts: [$results[] | failed_assets[]],
    failed_platform_builds: [$results[] as $result |
      ($result.builds | to_entries[]) |
      select(.value.status != "success") |
      "\($result.target):\(.key)"],
    diagnostics: ($gate_diagnostics + [$results[] | .diagnostics[]?])
  }
  | .publishable = if $channel == "stable"
      then ($gate_result == "success" and (.complete_platforms | length) == 3 and (.failed_platform_builds | length) == 0)
      else ((.complete_platforms | length) >= 1)
    end
  ' >"${output}"

if ! jq -e '.publishable == true' "${output}" >/dev/null; then
  echo "release is not publishable for ${channel}" >&2
  exit 1
fi
