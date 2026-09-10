#!/usr/bin/env bash
# Persist immutable platform-image digest evidence for the AppVeyor artifact.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REGISTRY="cr.beskid-lang.org"
NAMESPACE="${REGISTRY}/beskid"
REPORT_ROOT="${APPVEYOR_BUILD_FOLDER:-${ROOT}}/.appveyor-reports"
RECORDS_PATH="${REPORT_ROOT}/platform-image-digests.tsv"
MANIFEST_PATH="${REPORT_ROOT}/platform-images.json"
COMMIT_SHA="${APPVEYOR_REPO_COMMIT:-$(git -C "${ROOT}" rev-parse HEAD)}"

# shellcheck source-path=SCRIPTDIR
# shellcheck source=lib/appveyor-event-policy.sh
source "${ROOT}/scripts/ci/lib/appveyor-event-policy.sh"

require_commit_sha() {
  [[ "${COMMIT_SHA}" =~ ^[0-9a-f]{40}$ ]] || {
    echo "APPVEYOR_REPO_COMMIT must be a full lowercase Git commit SHA" >&2
    exit 2
  }
}

record_immutable_image() {
  local lane="$1"
  local immutable_ref="$2"
  local immutable_digest="$3"
  local expected_ref="${NAMESPACE}/${lane}:sha-${COMMIT_SHA}"
  local expected_digest_prefix="${NAMESPACE}/${lane}@sha256:"

  [[ "${lane}" =~ ^(site|learn|tracker|nexus|pckg)$ ]] || {
    echo "Unknown platform image lane: ${lane}" >&2
    exit 2
  }
  [[ "${immutable_ref}" == "${expected_ref}" ]] || {
    echo "Immutable image reference does not match ${lane} source identity" >&2
    exit 2
  }
  [[ "${immutable_digest}" == "${expected_digest_prefix}"[0-9a-f][0-9a-f]* ]] || {
    echo "Immutable image digest does not match ${lane} registry identity" >&2
    exit 2
  }

  mkdir -p "${REPORT_ROOT}"
  [[ ! -f "${RECORDS_PATH}" ]] || ! awk -F '\t' -v lane="${lane}" '$1 == lane { found = 1 } END { exit found ? 0 : 1 }' "${RECORDS_PATH}" || {
    echo "Immutable image evidence already exists for ${lane}" >&2
    exit 2
  }
  printf '%s\t%s\t%s\n' "${lane}" "${immutable_ref}" "${immutable_digest}" >>"${RECORDS_PATH}"
}

finalize_manifest() {
  if ! appveyor_is_trusted_main_push; then
    echo "Platform image manifest is disabled for this AppVeyor event."
    return 0
  fi

  : "${APPVEYOR_BUILD_ID:?APPVEYOR_BUILD_ID is required for image evidence}"
  : "${APPVEYOR_BUILD_VERSION:?APPVEYOR_BUILD_VERSION is required for image evidence}"
  : "${APPVEYOR_JOB_ID:?APPVEYOR_JOB_ID is required for image evidence}"
  [[ -f "${RECORDS_PATH}" ]] || {
    echo "Immutable image evidence is missing" >&2
    exit 2
  }
  [[ "$(wc -l <"${RECORDS_PATH}" | tr -d ' ')" == "5" ]] || {
    echo "Immutable image evidence must contain exactly five records" >&2
    exit 2
  }
  for lane in site learn tracker nexus pckg; do
    [[ "$(awk -F '\t' -v lane="${lane}" '$1 == lane { count += 1 } END { print count + 0 }' "${RECORDS_PATH}")" == "1" ]] || {
      echo "Immutable image evidence must contain one ${lane} record" >&2
      exit 2
    }
  done

  jq -n \
    --arg sourceSha "${COMMIT_SHA}" \
    --arg buildId "${APPVEYOR_BUILD_ID}" \
    --arg buildVersion "${APPVEYOR_BUILD_VERSION}" \
    --arg jobId "${APPVEYOR_JOB_ID}" \
    --arg namespace "${NAMESPACE}" \
    --rawfile records "${RECORDS_PATH}" \
    '{
      source: { sha: $sourceSha },
      build: { id: $buildId, version: $buildVersion },
      job: { id: $jobId },
      registry: { namespace: $namespace },
      images: [
        $records | split("\n")[] | select(length > 0) | split("\t") |
        { lane: .[0], immutable: { reference: .[1], tag: (.[1] | split(":")[-1]), digest: .[2] } }
      ]
    }' >"${MANIFEST_PATH}"
}

require_commit_sha
case "${1:-}" in
  record)
    [[ "$#" == "4" ]] || { echo "usage: $0 record <lane> <immutable-ref> <digest>" >&2; exit 2; }
    record_immutable_image "$2" "$3" "$4"
    ;;
  finalize)
    [[ "$#" == "1" ]] || { echo "usage: $0 finalize" >&2; exit 2; }
    finalize_manifest
    ;;
  *)
    echo "usage: $0 {record|finalize}" >&2
    exit 2
    ;;
esac
