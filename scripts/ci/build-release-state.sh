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

sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

case "${channel}" in stable|unstable) ;; *) echo "unsupported channel: ${channel}" >&2; exit 1 ;; esac
[[ "$#" -gt 0 ]] || { echo 'at least one platform result is required' >&2; exit 1; }

results_json="$(jq -s 'sort_by(.target)' "$@")"
if [[ -n "${HANDOFF_RELEASE_URL:-}" ]]; then
  handoff_release_url="${HANDOFF_RELEASE_URL%/}"
  results_json="$(jq --arg release_url "${handoff_release_url}" '
    def release_asset_url:
      if type == "string" and length > 0 and
          (startswith("http://") or startswith("https://")) | not
      then $release_url + "/" + .
      else .
      end;
    map(
      .builds |= with_entries(.value.log_path |= release_asset_url)
      | .diagnostics |= ((. // []) | map(.log_path |= release_asset_url))
    )
  ' <<<"${results_json}")"
fi
gate_diagnostics='[]'
test_results='[]'
stages_json='[]'
stage_tree_safe=true
if [[ -n "${GATE_REPORT_DIR:-}" && -d "${GATE_REPORT_DIR}/stages" ]]; then
  if [[ -L "${GATE_REPORT_DIR}" || -L "${GATE_REPORT_DIR}/stages" ]]; then stage_tree_safe=false; fi
  stage_files=("${GATE_REPORT_DIR}"/stages/*.json)
  if [[ -e "${stage_files[0]}" ]]; then
    for stage_file in "${stage_files[@]}"; do
      if [[ -L "${stage_file}" || ! -f "${stage_file}" ]]; then stage_tree_safe=false; fi
    done
    stages_json="$(jq -s 'sort_by(.component, .stage)' "${stage_files[@]}")"
    test_results="$(jq '[.[] | {component, stage, platform, status, exit_code, command, raw_log, raw_log_sha256, version, source, job_id: null, job_url: null}]' <<<"${stages_json}")"
  fi
  failure_files=("${GATE_REPORT_DIR}"/failures/*.json)
  if [[ -e "${failure_files[0]}" ]]; then
    gate_diagnostics="$(jq -s 'map(.log_path = "gate-evidence/" + .log_path)' "${failure_files[@]}")"
  fi
fi

successful_tests="$(jq '[.[] | select(.status == "success") | "\(.component):\(.stage)"] | unique | sort' <<<"${test_results}")"
failed_tests="$(jq '[.[] | select(.status == "failed") | "\(.component):\(.stage)"] | unique | sort' <<<"${test_results}")"

qualified_gates=false
if [[ "${channel}" == stable ]]; then
  if [[ "${stage_tree_safe}" == true ]] && jq -e --arg version "${version}" --arg compiler "${compiler_sha}" --arg superrepo "${superrepo_sha}" '
    def required($component; $stage):
      [.[] | select(.component == $component and .stage == $stage)] as $matches |
      ($matches | length) == 1 and
      ($matches[0] | .schema_version == 1 and .status == "success" and .exit_code == 0 and
        .version == $version and .source.compiler_commit == $compiler and
        .source.superrepo_commit == $superrepo and
        (.raw_log | type == "string" and test("^[A-Za-z0-9][A-Za-z0-9._-]*$")) and
        (.raw_log_sha256 | type == "string" and test("^[0-9a-f]{64}$")));
    required("compiler"; "rust-gate") and required("corelib"; "matrix")
  ' <<<"${stages_json}" >/dev/null; then
    qualified_gates=true
    while IFS=$'\t' read -r log digest; do
      log_path="${GATE_REPORT_DIR}/${log}"
      if [[ -L "${log_path}" || ! -f "${log_path}" || "$(sha256_file "${log_path}")" != "${digest}" ]]; then
        qualified_gates=false
        break
      fi
    done < <(jq -r '.[] | select((.component == "compiler" and .stage == "rust-gate") or (.component == "corelib" and .stage == "matrix")) | [.raw_log, .raw_log_sha256] | @tsv' <<<"${stages_json}")
  fi
  if [[ "${qualified_gates}" != true ]]; then
    echo 'stable release requires source-matched compiler Rust and Corelib matrix reports with verified logs' >&2
  fi
fi

jq -n \
  --arg channel "${channel}" \
  --arg version "${version}" \
  --arg compiler_sha "${compiler_sha}" \
  --arg superrepo_sha "${superrepo_sha}" \
  --arg gate_result "${gate_result}" \
  --argjson qualified_gates "${qualified_gates}" \
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
      then ($gate_result == "success" and $qualified_gates and (.complete_platforms | length) == 3 and (.failed_platform_builds | length) == 0)
      else ((.complete_platforms | length) >= 1)
    end
  ' >"${output}"

if ! jq -e '.publishable == true' "${output}" >/dev/null; then
  echo "release is not publishable for ${channel}" >&2
  exit 1
fi
