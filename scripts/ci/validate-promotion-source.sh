#!/usr/bin/env bash
# Prove a production manifest came from a successful authoritative main run.
set -euo pipefail

[[ $# -eq 2 ]] || { echo "usage: $0 <workflow-run.json> <release-manifest.json>" >&2; exit 2; }
run_json="$1"
manifest="$2"
allow_non_main="${ALLOW_NON_MAIN_PRODUCTION:-false}"
"$(dirname "$0")/validate-release-manifest.sh" "${manifest}"

# Same-run auto-promote queries this run while it is still in_progress
# (conclusion is null). Completed prior runs must have conclusion success.
jq -e --arg runId "$(jq -r '.build.run_id' "${manifest}")" --arg allowNonMain "${allow_non_main}" '
  (.id | tostring) == $runId and
  (.path == ".github/workflows/platform-delivery.yml" or
   ((.workflow_url // "") | endswith("/actions/workflows/platform-delivery.yml"))) and
  ($allowNonMain == "true" or .head_branch == "main") and
  (
    .conclusion == "success" or
    (.status == "in_progress" and .conclusion == null)
  )
' "${run_json}" >/dev/null

echo "production promotion source OK"
