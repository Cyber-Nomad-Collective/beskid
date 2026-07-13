#!/usr/bin/env bash
# Prove a production manifest came from a successful authoritative main run.
set -euo pipefail

[[ $# -eq 2 ]] || { echo "usage: $0 <workflow-run.json> <release-manifest.json>" >&2; exit 2; }
run_json="$1"
manifest="$2"
"$(dirname "$0")/validate-release-manifest.sh" "${manifest}"

jq -e --arg runId "$(jq -r '.build.run_id' "${manifest}")" '
  (.id | tostring) == $runId and
  .conclusion == "success" and
  .head_branch == "main" and
  (.path == ".github/workflows/platform-delivery.yml" or
   ((.workflow_url // "") | endswith("/actions/workflows/platform-delivery.yml")))
' "${run_json}" >/dev/null

echo "production promotion source OK"
