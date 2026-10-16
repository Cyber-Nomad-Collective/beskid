#!/usr/bin/env bash
# Entrypoint of the Beskid release publisher plugin image.
#
# Woodpecker gives an image-filtered secret only to a plugin step, and a plugin
# step receives its `settings:` as PLUGIN_* variables but no manual pipeline
# variables; those are substituted into `settings:` when the workflow is parsed.
# This dispatcher validates the settings, maps them onto the variables the
# reviewed repository scripts expect, and runs those scripts from the checked-out
# workspace ($CI_WORKSPACE). It holds no publication logic of its own.
#
# PLUGIN_ACTION selects the lane and must equal PLUGIN_TASK (the BESKID_TASK of
# the pipeline):
#   release-publish  stable compiler release   (secret: gh_token)
#   pckg-publish     corelib and templates      (secrets: gh_token, pckg_api_key)
#   editor-publish   Open VSX editor release    (secret: ovsx_pat)
#
# Credential handling: never enable xtrace here and never print the environment.
# Each secret is read once, removed from the exported environment, and handed
# only to the one publisher command that needs it, as a process environment
# value. Collection, validation and every other helper run without it.
set -euo pipefail
set +x

gh_token="${PLUGIN_GH_TOKEN:-}"
pckg_api_key="${PLUGIN_PCKG_API_KEY:-}"
ovsx_pat="${PLUGIN_OVSX_PAT:-}"
unset PLUGIN_GH_TOKEN PLUGIN_PCKG_API_KEY PLUGIN_OVSX_PAT GH_TOKEN GITHUB_TOKEN BESKID_PCKG_API_KEY OVSX_PAT OVSX_TOKEN

fail() { echo "release publisher: $*" >&2; exit 1; }
# setting <name> <pattern> [default]: a validated PLUGIN_<NAME> value.
setting() {
  local variable="PLUGIN_${1^^}" value
  value="${!variable:-${3:-}}"
  [[ -z "$value" || "$value" =~ $2 ]] || fail "setting $1 is malformed"
  printf '%s' "$value"
}
required() { [[ -n "$2" ]] || fail "setting $1 is required"; }

sha='^[0-9a-f]{7,40}$'
semver='^[0-9]+\.[0-9]+\.[0-9]+$'
build='^[1-9][0-9]*$'

action="$(setting action '^(release-publish|pckg-publish|editor-publish)$')"
required action "$action"
task="$(setting task '^[a-z0-9-]+$')"
[[ "$task" == "$action" ]] || fail "action $action does not match the pipeline task"
export BESKID_TASK="$action"

# Test fixtures may relocate the container-root paths; a real pipeline may not.
test_root="${BESKID_PUBLISHER_TEST_ROOT:-}"
if [[ -n "$test_root" && "${CI_SYSTEM_NAME:-}" == woodpecker ]]; then
  fail 'BESKID_PUBLISHER_TEST_ROOT is forbidden in Woodpecker'
fi
toolchain_root="${test_root%/}/woodpecker-toolchain"
output_root="${test_root%/}/woodpecker-output"
[[ -n "$test_root" ]] || { toolchain_root=/woodpecker-toolchain; output_root=/woodpecker-output; }

workspace="${CI_WORKSPACE:-$PWD}"
[[ -d "$workspace/.git" || -f "$workspace/.git" ]] || fail "workspace $workspace is not a checkout"
cd "$workspace"

case "$action" in
  release-publish)
    required gh_token "$gh_token"
    release_version="$(setting release_version "$semver")"; required release_version "$release_version"
    for role in linux macos windows; do
      pin="$(setting "${role}_build" "$build")"; required "${role}_build" "$pin"
      source_pin="$(setting "${role}_source" "$sha")"
      export "BESKID_${role^^}_BUILD=$pin" "BESKID_${role^^}_SOURCE=$source_pin"
    done
    candidate="$(setting release_candidate "$sha")"
    export BESKID_RELEASE_CANDIDATE="$candidate"
    waiver="${PLUGIN_WINDOWS_INSTALLER_OWNER_WAIVER_JSON:-}"
    (( ${#waiver} <= 4096 )) || fail 'setting windows_installer_owner_waiver_json is too large'
    export BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_JSON="$waiver"

    # The lane fetches full history, collects and re-validates the pinned handoffs without the token,
    # and hands it only to woodpecker-release.sh.
    GH_TOKEN="$gh_token" bash scripts/ci/woodpecker-release-lane.sh publish
    ;;

  pckg-publish)
    required gh_token "$gh_token"
    required pckg_api_key "$pckg_api_key"
    compiler_version="$(setting compiler_release_version "$semver")"; required compiler_release_version "$compiler_version"
    bump="$(setting version_bump '^(patch|minor|major|[0-9]+\.[0-9]+\.[0-9]+)$' patch)"

    bash scripts/ci/init-submodules.sh compiler beskid_bsol beskid_templates beskid_distrib
    mkdir -p "$toolchain_root"
    GH_TOKEN="$gh_token" node scripts/ci/prepare-pckg-toolchain.mjs "$compiler_version" "$toolchain_root/prefix"
    BESKID_PCKG_API_KEY="$pckg_api_key" BESKID_PCKG_VERSION_BUMP="$bump" BESKID_TOOLCHAIN_PREFIX="$toolchain_root/prefix" \
      bash scripts/ci/corelib-publish.sh
    ;;

  editor-publish)
    required ovsx_pat "$ovsx_pat"
    editor_version="$(setting editor_version "$semver" 0.5.1)"
    snapshot="$output_root/editor-${CI_PIPELINE_NUMBER:?}-${CI_COMMIT_SHA:?}"
    ovsx="$snapshot/ovsx-toolchain/node_modules/.bin/ovsx"
    [[ -x "$ovsx" ]] || fail "the prepared ovsx toolchain is missing from $snapshot"
    python3 scripts/ci/prebuilt-editor-publish.py verify "$snapshot" --version "$editor_version"
    OVSX_PAT="$ovsx_pat" python3 scripts/ci/prebuilt-editor-publish.py publish "$snapshot" --ovsx "$ovsx" --version "$editor_version"
    [[ -s "$snapshot/publish-results.json" ]] || fail 'the editor publisher wrote no results'
    ;;
esac
