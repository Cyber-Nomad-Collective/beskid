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
if [[ -n "${GATE_REPORT_DIR:-}" && -d "${GATE_REPORT_DIR}/stages" ]]; then
  stage_files=("${GATE_REPORT_DIR}"/stages/*.json)
  if [[ -e "${stage_files[0]}" ]]; then
    stages_json="$(jq -s 'sort_by(.component, .stage)' "${stage_files[@]}")"
    successful_tests="$(jq '[.[] | select(.status == "success") | "\(.component):\(.stage)"]' <<<"${stages_json}")"
    failed_tests="$(jq '[.[] | select(.status == "failed") | "\(.component):\(.stage)"]' <<<"${stages_json}")"
  else
    successful_tests='[]'
    failed_tests='[]'
  fi
  failure_files=("${GATE_REPORT_DIR}"/failures/*.json)
  if [[ -e "${failure_files[0]}" ]]; then
    gate_diagnostics="$(jq -s 'map(.log_path = "gate-evidence/" + .log_path)' "${failure_files[@]}")"
  fi
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
    tests: {gate_result: $gate_result, successful: $successful_tests, failed: $failed_tests},
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
