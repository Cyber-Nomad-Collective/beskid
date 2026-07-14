#!/usr/bin/env bash
# Build an immutable release manifest from per-image JSON records.
set -euo pipefail

usage() {
  echo "usage: $0 <records-dir> <output.json>" >&2
}

[[ $# -eq 2 ]] || { usage; exit 2; }
records_dir="$1"
output="$2"

: "${GITHUB_REPOSITORY:?Set GITHUB_REPOSITORY}"
: "${GITHUB_SHA:?Set GITHUB_SHA}"

[[ -d "${records_dir}" ]] || { echo "records directory not found: ${records_dir}" >&2; exit 1; }
records=()
while IFS= read -r record; do
  records+=("${record}")
done < <(find "${records_dir}" -type f -name '*.json' -print | sort)
(( ${#records[@]} > 0 )) || { echo "no image records found in ${records_dir}" >&2; exit 1; }

created_at="${SOURCE_DATE_EPOCH:-}"
if [[ -n "${created_at}" ]]; then
  created_at="$(date -u -r "${created_at}" '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date -u -d "@${created_at}" '+%Y-%m-%dT%H:%M:%SZ')"
else
  created_at="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
fi

images_json="$(jq -s 'sort_by(.name)' "${records[@]}")"
jq -n \
  --arg repository "${GITHUB_REPOSITORY}" \
  --arg commit "${GITHUB_SHA}" \
  --arg runId "${GITHUB_RUN_ID:-local}" \
  --arg runAttempt "${GITHUB_RUN_ATTEMPT:-1}" \
  --arg workflowRef "${GITHUB_WORKFLOW_REF:-local}" \
  --arg createdAt "${created_at}" \
  --argjson images "${images_json}" \
  '{
    schema_version: 1,
    source: {repository: $repository, commit: $commit},
    build: {
      run_id: $runId,
      run_attempt: $runAttempt,
      workflow_ref: $workflowRef,
      created_at: $createdAt
    },
    policy: {sbom_required: true, provenance_required: true, vulnerability_scan_required: true, signature_required: true},
    images: $images
  }' >"${output}"

"$(dirname "$0")/validate-release-manifest.sh" "${output}"
sha256sum "${output}" >"${output}.sha256"
echo "release manifest: ${output}"
