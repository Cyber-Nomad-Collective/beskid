#!/usr/bin/env bash
# Behavioral contract for the shared AppVeyor mutation authorization policy.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
policy="${root}/scripts/ci/lib/appveyor-event-policy.sh"

source "${policy}"

run_case() {
  local branch="$1" pull_request="$2" tag="$3" forced="$4" scheduled="$5" rebuild="$6" rerun_incomplete="$7"
  unset APPVEYOR_REPO_BRANCH APPVEYOR_PULL_REQUEST_NUMBER APPVEYOR_REPO_TAG APPVEYOR_FORCED_BUILD
  unset APPVEYOR_SCHEDULED_BUILD APPVEYOR_RE_BUILD APPVEYOR_RE_RUN_INCOMPLETE
  APPVEYOR_REPO_BRANCH="${branch}"
  APPVEYOR_PULL_REQUEST_NUMBER="${pull_request}"
  APPVEYOR_REPO_TAG="${tag}"
  APPVEYOR_FORCED_BUILD="${forced}"
  APPVEYOR_SCHEDULED_BUILD="${scheduled}"
  APPVEYOR_RE_BUILD="${rebuild}"
  APPVEYOR_RE_RUN_INCOMPLETE="${rerun_incomplete}"
  appveyor_is_trusted_main_push
}

while IFS='|' read -r scenario expected branch pull_request tag forced scheduled rebuild rerun_incomplete; do
  [[ -z "${scenario}" ]] && continue
  if run_case "${branch}" "${pull_request}" "${tag}" "${forced}" "${scheduled}" "${rebuild}" "${rerun_incomplete}"; then
    actual=0
  else
    actual=$?
  fi
  if [[ "${actual}" -ne "${expected}" ]]; then
    printf 'FAIL: %s (expected status %s, got %s)\n' "${scenario}" "${expected}" "${actual}" >&2
    exit 1
  fi
done <<'CASES'
clean-main-push|0|main||||||
feature-branch|1|feature||||||
pull-request|1|main|42|||||
tag-build|1|main||true||||
forced-api-build|1|main|||true|||
scheduled-build|1|main||||true||
rebuild|1|main|||||true|
rebuild-case-insensitive|1|main|||||TRUE|
incomplete-rerun|1|main||||||true
incomplete-rerun-case-insensitive|1|main||||||TrUe
CASES

printf 'AppVeyor event policy tests OK\n'
