#!/usr/bin/env bash
# One step of the stable release lane (.woodpecker/release.yml): collect the candidate's per-platform
# handoffs and run woodpecker-release.sh on them.
#
# Usage: woodpecker-release-lane.sh prepare|verify|publish
#
#   prepare  BESKID_TASK=release: evidence without publication credentials.
#   verify   BESKID_TASK=release-publish, credential-free proof of the qualified state, including the
#            owner waiver (BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_JSON is required).
#   publish  BESKID_TASK=release-publish, final step: re-fetches and re-validates the same pinned
#            handoffs, then publishes. Run by the release publisher plugin dispatcher with GH_TOKEN.
#
# The release runs on HEAD and publishes the builds of candidate C: the candidate named by the
# committed CLI06-06 record (docs/release/cli06-06-record-v<version>.json), else
# BESKID_RELEASE_CANDIDATE, else HEAD. HEAD's compiler and beskid_distrib pointers and release-case
# manifest digest must equal C's; root-only commits after C never force a rebuild. Each platform was
# built by its own pipeline; the fetch selects the newest complete, verified handoff of C per
# platform, or the pipeline pinned by BESKID_LINUX_BUILD, BESKID_MACOS_BUILD or BESKID_WINDOWS_BUILD
# (verify and publish require all three pins, so both steps consume the same handoffs), and prints
# the three pipeline numbers. Any missing platform, identity drift or checksum mismatch fails.
# BESKID_LINUX_SOURCE, BESKID_MACOS_SOURCE or BESKID_WINDOWS_SOURCE name a platform's own handoff
# source when it differs from C in non-build root paths only. When a build was repackaged with
# BESKID_REPACKAGE_SUPERSEDES, the newest packaging of its supersede chain is selected; a pin still
# names the build pipeline.
#
# Env: BESKID_RELEASE_VERSION (required stable version), CI_COMMIT_SHA, and the pins above.
# Credential handling: never enable xtrace here and never print the environment. GH_TOKEN is removed
# from the exported environment at start-up; only the publish mode hands it to woodpecker-release.sh,
# which passes it only to gh and the two GitHub publisher scripts.
set -euo pipefail
set +x
release_token="${GH_TOKEN:-}"
unset GH_TOKEN

[[ "$#" == 1 && "$1" =~ ^(prepare|verify|publish)$ ]] || {
  echo 'usage: woodpecker-release-lane.sh prepare|verify|publish' >&2; exit 2
}
mode="$1"
scripts="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$scripts/../.." && pwd)"
cd "$repo"

test_root="${WOODPECKER_RELEASE_TEST_ROOT:-}"
if [[ -n "$test_root" && "${CI_SYSTEM_NAME:-}" == woodpecker ]]; then
  echo 'WOODPECKER_RELEASE_TEST_ROOT is forbidden in Woodpecker' >&2; exit 2
fi
handoff_root="${test_root%/}/woodpecker-handoff"
[[ -n "$test_root" ]] || handoff_root=/woodpecker-handoff

# woodpecker-cli --var splits values on commas, so a JSON waiver cannot pass through it intact.
# A waiver may instead arrive as base64:<standard base64 of the JSON record>.
if [[ "${BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_JSON:-}" == base64:* ]]; then
  decoded="$(printf '%s' "${BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_JSON#base64:}" | base64 -d 2>/dev/null)" || {
    echo 'BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_JSON is not valid base64' >&2; exit 1
  }
  export BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_JSON="$decoded"
fi

case "$mode" in
  prepare) publish=0; [[ -z "$release_token" ]] || { echo 'release preparation must not receive GH_TOKEN' >&2; exit 1; } ;;
  verify)
    publish=0
    [[ -z "$release_token" ]] || { echo 'release verification must not receive GH_TOKEN' >&2; exit 1; }
    [[ -n "${BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_JSON:-}" ]] || {
      echo 'set BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_JSON' >&2; exit 1
    }
    ;;
  publish) publish=1; [[ -n "$release_token" ]] || { echo 'publication requires GH_TOKEN' >&2; exit 1; } ;;
esac
if [[ "$mode" != prepare ]]; then
  : "${BESKID_LINUX_BUILD:?pin the Linux build}" "${BESKID_MACOS_BUILD:?pin the macOS build}" "${BESKID_WINDOWS_BUILD:?pin the Windows build}"
fi

# Woodpecker's git plugin clones shallow even with depth: 0; resolving C walks ancestry.
bash "$scripts/woodpecker-full-history.sh" "$repo"
version="$(node "$scripts/release-version.mjs" "${BESKID_RELEASE_VERSION:?set stable version}" --stable-only)"
resolved="$(node "$scripts/release-user-observation.mjs" --platform-sources . "$version" "${CI_COMMIT_SHA:?}" \
  "${BESKID_RELEASE_CANDIDATE:-}" "${BESKID_LINUX_SOURCE:-}" "${BESKID_MACOS_SOURCE:-}" "${BESKID_WINDOWS_SOURCE:-}")"
source_sha="$(jq -r '.candidate' <<<"$resolved")"
sources="$(jq -r '[.sources.linux, .sources.macos, .sources.windows] | join(",")' <<<"$resolved")"
compiler_sha="$(git rev-parse "$source_sha:compiler")"
builds="$(bash "$scripts/woodpecker-fetch-handoffs.sh" "$sources" "$compiler_sha" "$version" "$handoff_root")"
case "$mode" in
  prepare) echo "collected candidate $source_sha (linux, macos, windows sources $sources): builds $builds" ;;
  verify) echo "verifying candidate $source_sha (linux, macos, windows sources $sources): builds $builds" ;;
  publish) echo "publishing candidate $source_sha (linux, macos, windows sources $sources): builds $builds" ;;
esac
read -r -a build_list <<<"$builds"
if [[ "$publish" == 1 ]]; then
  GH_TOKEN="$release_token" BESKID_PUBLISH_RELEASE=1 bash "$scripts/woodpecker-release.sh" "$version" "${build_list[@]}"
else
  BESKID_PUBLISH_RELEASE=0 bash "$scripts/woodpecker-release.sh" "$version" "${build_list[@]}"
fi
