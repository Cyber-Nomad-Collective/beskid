#!/usr/bin/env bash
# Move release payloads between jobs and workflows through a durable release.
# Each workflow run owns one draft handoff across all attempts. Aggregation
# publishes it as a prerelease for downstream workflows, while bounded cleanup
# removes expired handoffs and their tags.
# Usage:
#   github-release-handoff.sh init <repo> <tag> <target-sha> <title>
#   github-release-handoff.sh upload <repo> <tag> <file-or-directory>...
#   github-release-handoff.sh download <repo> <tag> <directory>
#   github-release-handoff.sh finalize <repo> <tag>
#   github-release-handoff.sh cleanup <repo> <maximum-age-days>
set -euo pipefail

operation="${1:?operation}"
repo="${2:?repository}"
tag="${3:?tag}"
shift 3

case "${operation}" in
  init)
    target="${1:?target SHA}"
    title="${2:?title}"
    if existing_target="$(gh release view "${tag}" --repo "${repo}" --json targetCommitish --jq .targetCommitish 2>/dev/null)"; then
      if [[ "${existing_target}" != "${target}" ]]; then
        echo "handoff release ${tag} targets ${existing_target}, expected ${target}" >&2
        exit 1
      fi
      echo "Reusing handoff release ${tag} at ${target}."
    else
      gh release create "${tag}" --repo "${repo}" --target "${target}" --prerelease --latest=false --draft \
        --title "${title}" --notes 'Retry-safe compiler release handoff. Final assets are published on immutable and rolling release streams.'
    fi
    ;;
  upload)
    [[ "$#" -gt 0 ]] || { echo 'at least one handoff asset path is required' >&2; exit 1; }
    assets=()
    for input in "$@"; do
      if [[ -f "${input}" ]]; then
        assets+=("${input}")
      elif [[ -d "${input}" ]]; then
        while IFS= read -r -d '' asset; do
          assets+=("${asset}")
        done < <(find "${input}" -type f -print0)
      else
        echo "handoff asset path is missing: ${input}" >&2
        exit 1
      fi
    done
    [[ "${#assets[@]}" -gt 0 ]] || { echo 'handoff asset paths contain no files' >&2; exit 1; }
    gh release upload "${tag}" --repo "${repo}" --clobber "${assets[@]}"
    ;;
  download)
    directory="${1:?download directory}"
    mkdir -p "${directory}"
    gh release download "${tag}" --repo "${repo}" --dir "${directory}" --clobber
    ;;
  finalize)
    gh release edit "${tag}" --repo "${repo}" --draft=false --prerelease --latest=false
    ;;
  cleanup)
    maximum_age_days="${tag}"
    [[ "${maximum_age_days}" =~ ^[1-9][0-9]*$ ]] || {
      echo "maximum handoff age must be a positive whole number of days: ${maximum_age_days}" >&2
      exit 1
    }
    now_epoch="${HANDOFF_NOW_EPOCH:-$(date -u +%s)}"
    [[ "${now_epoch}" =~ ^[0-9]+$ ]] || { echo 'current epoch must be numeric' >&2; exit 1; }
    cutoff_epoch="$((now_epoch - maximum_age_days * 86400))"
    releases="$(gh release list --repo "${repo}" --limit 1000 --order asc \
      --json tagName,createdAt,isDraft,isPrerelease)"
    while IFS= read -r expired_tag; do
      [[ -n "${expired_tag}" ]] || continue
      gh release delete "${expired_tag}" --repo "${repo}" --cleanup-tag --yes
    done < <(jq -r --argjson cutoff "${cutoff_epoch}" '
      .[]
      | select(.tagName | startswith("compiler-handoff-"))
      | select(.isDraft == true or .isPrerelease == true)
      | select((.createdAt | fromdateiso8601) < $cutoff)
      | .tagName
    ' <<<"${releases}")
    ;;
  *)
    echo "unsupported GitHub Release handoff operation: ${operation}" >&2
    exit 2
    ;;
esac
