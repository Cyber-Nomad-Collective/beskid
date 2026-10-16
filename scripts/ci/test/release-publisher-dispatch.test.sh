#!/usr/bin/env bash
# Release publisher plugin dispatcher and release lane: settings validation, and each secret reaching
# only its one publisher command. Fake repository scripts record which credentials they received.
set -euo pipefail
root="$(cd "$(dirname "$0")/../../.." && pwd)"
dispatcher="$root/ci/plugins/release-publisher/dispatch.sh"
lane="$root/scripts/ci/woodpecker-release-lane.sh"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
fail() { echo "FAIL: $*" >&2; exit 1; }
unset CI CI_SYSTEM_NAME GH_TOKEN GITHUB_TOKEN BESKID_PCKG_API_KEY OVSX_PAT WOODPECKER_RELEASE_TEST_ROOT
sha=0123456789abcdef0123456789abcdef01234567
log="$tmp/calls.log"

# A fake checkout whose scripts record their name, arguments and credential exposure.
ws="$tmp/ws"; mkdir -p "$ws/scripts/ci"; git -C "$ws" init -q
recorder='printf "%s|%s|gh=%s|pckg=%s|ovsx=%s|plugin=%s\n" "$(basename "$0")" "$*" "${GH_TOKEN:-}" "${BESKID_PCKG_API_KEY:-}" "${OVSX_PAT:-}" "${PLUGIN_GH_TOKEN:-}${PLUGIN_PCKG_API_KEY:-}${PLUGIN_OVSX_PAT:-}" >>"$CALLS_LOG"'
for script in woodpecker-release-lane.sh init-submodules.sh corelib-publish.sh; do
  printf '#!/usr/bin/env bash\n%s\nprintf "pins=%%s,%%s,%%s|task=%%s\\n" "${BESKID_LINUX_BUILD:-}" "${BESKID_MACOS_BUILD:-}" "${BESKID_WINDOWS_BUILD:-}" "${BESKID_TASK:-}" >>"$CALLS_LOG.env"\n' "$recorder" >"$ws/scripts/ci/$script"
done
cat >"$ws/scripts/ci/prepare-pckg-toolchain.mjs" <<'NODE'
import {appendFileSync} from 'node:fs';const e=process.env;
appendFileSync(e.CALLS_LOG,`prepare-pckg-toolchain.mjs|${process.argv.slice(2).join(' ')}|gh=${e.GH_TOKEN??''}|pckg=${e.BESKID_PCKG_API_KEY??''}|ovsx=${e.OVSX_PAT??''}|plugin=\n`);
NODE
cat >"$ws/scripts/ci/prebuilt-editor-publish.py" <<'PY'
import os, sys
e = os.environ
with open(e["CALLS_LOG"], "a") as log:
    log.write(f"prebuilt-editor-publish.py|{' '.join(sys.argv[1:])}|gh={e.get('GH_TOKEN','')}|pckg={e.get('BESKID_PCKG_API_KEY','')}|ovsx={e.get('OVSX_PAT','')}|plugin=\n")
if sys.argv[1] == "publish":
    open(os.path.join(sys.argv[2], "publish-results.json"), "w").write("{}\n")
PY
snapshot="$tmp/root/woodpecker-output/editor-7-$sha"
mkdir -p "$snapshot/ovsx-toolchain/node_modules/.bin"
printf '#!/bin/sh\n' >"$snapshot/ovsx-toolchain/node_modules/.bin/ovsx"; chmod +x "$snapshot/ovsx-toolchain/node_modules/.bin/ovsx"

dispatch() {
  : >"$log"; : >"$log.env"
  env -i PATH="$PATH" HOME="$tmp" CALLS_LOG="$log" CI_WORKSPACE="$ws" BESKID_PUBLISHER_TEST_ROOT="$tmp/root" \
    CI_PIPELINE_NUMBER=7 CI_COMMIT_SHA="$sha" "$@" bash "$dispatcher"
}
expect_line() { grep -Fxq -- "$1" "$log" || { cat "$log" >&2; fail "missing call: $1"; }; }
expect_calls() { test "$(wc -l <"$log" | tr -d ' ')" -eq "$1" || { cat "$log" >&2; fail "expected $1 calls"; }; }

# release-publish: only the lane's publish call receives the token; the pins reach it.
dispatch PLUGIN_ACTION=release-publish PLUGIN_TASK=release-publish PLUGIN_GH_TOKEN=gh-secret PLUGIN_RELEASE_VERSION=0.6.0 \
  PLUGIN_LINUX_BUILD=11 PLUGIN_MACOS_BUILD=12 PLUGIN_WINDOWS_BUILD=13 PLUGIN_WINDOWS_INSTALLER_OWNER_WAIVER_JSON='{"a":1}'
expect_calls 1
expect_line 'woodpecker-release-lane.sh|publish|gh=gh-secret|pckg=|ovsx=|plugin='
grep -Fxq 'pins=11,12,13|task=release-publish' "$log.env" || fail 'release pins or task did not reach the lane'

# pckg-publish: the token reaches only the toolchain fetch, the publisher key only corelib-publish.sh.
dispatch PLUGIN_ACTION=pckg-publish PLUGIN_TASK=pckg-publish PLUGIN_GH_TOKEN=gh-secret PLUGIN_PCKG_API_KEY=pckg-secret \
  PLUGIN_COMPILER_RELEASE_VERSION=0.6.0
expect_calls 3
expect_line 'init-submodules.sh|compiler beskid_bsol beskid_templates beskid_distrib|gh=|pckg=|ovsx=|plugin='
expect_line "prepare-pckg-toolchain.mjs|0.6.0 $tmp/root/woodpecker-toolchain/prefix|gh=gh-secret|pckg=|ovsx=|plugin="
expect_line 'corelib-publish.sh||gh=|pckg=pckg-secret|ovsx=|plugin='

# editor-publish: the Open VSX token reaches only the publish call.
dispatch PLUGIN_ACTION=editor-publish PLUGIN_TASK=editor-publish PLUGIN_OVSX_PAT=ovsx-secret PLUGIN_EDITOR_VERSION=0.5.2
expect_calls 2
expect_line "prebuilt-editor-publish.py|verify $snapshot --version 0.5.2|gh=|pckg=|ovsx=|plugin="
expect_line "prebuilt-editor-publish.py|publish $snapshot --ovsx $snapshot/ovsx-toolchain/node_modules/.bin/ovsx --version 0.5.2|gh=|pckg=|ovsx=ovsx-secret|plugin="

# Fail closed before any script runs.
release_ok=(PLUGIN_ACTION=release-publish PLUGIN_TASK=release-publish PLUGIN_GH_TOKEN=gh-secret PLUGIN_RELEASE_VERSION=0.6.0
  PLUGIN_LINUX_BUILD=11 PLUGIN_MACOS_BUILD=12 PLUGIN_WINDOWS_BUILD=13)
rejects() {
  local reason="$1"; shift
  if dispatch "$@" 2>"$tmp/err"; then fail "accepted: $reason"; fi
  test ! -s "$log" || fail "ran a script although: $reason"
}
rejects 'task mismatch' "${release_ok[@]}" PLUGIN_TASK=release
rejects 'unknown action' "${release_ok[@]}" PLUGIN_ACTION=deploy PLUGIN_TASK=deploy
rejects 'missing token' "${release_ok[@]}" PLUGIN_GH_TOKEN=
rejects 'missing pin' "${release_ok[@]}" PLUGIN_MACOS_BUILD=
rejects 'malformed pin' "${release_ok[@]}" PLUGIN_WINDOWS_BUILD='13; rm -rf /'
rejects 'malformed source' "${release_ok[@]}" PLUGIN_LINUX_SOURCE=main
rejects 'malformed version' "${release_ok[@]}" PLUGIN_RELEASE_VERSION='0.6.0 --x'
rejects 'test root in Woodpecker' "${release_ok[@]}" CI_SYSTEM_NAME=woodpecker
rejects 'missing pckg key' PLUGIN_ACTION=pckg-publish PLUGIN_TASK=pckg-publish PLUGIN_GH_TOKEN=x PLUGIN_COMPILER_RELEASE_VERSION=0.6.0
rejects 'malformed bump' PLUGIN_ACTION=pckg-publish PLUGIN_TASK=pckg-publish PLUGIN_GH_TOKEN=x PLUGIN_PCKG_API_KEY=y \
  PLUGIN_COMPILER_RELEASE_VERSION=0.6.0 PLUGIN_VERSION_BUMP=huge
rejects 'missing ovsx token' PLUGIN_ACTION=editor-publish PLUGIN_TASK=editor-publish
grep -Fq 'setting ovsx_pat is required' "$tmp/err" || fail 'missing ovsx token was not diagnosed'

# The release lane: collection helpers never see GH_TOKEN; only the publishing release call does.
lws="$tmp/lane"; mkdir -p "$lws/scripts/ci" "$tmp/bin"; cp "$lane" "$lws/scripts/ci/"
for script in woodpecker-full-history.sh woodpecker-fetch-handoffs.sh woodpecker-release.sh; do
  printf '#!/usr/bin/env bash\n%s\n' "$recorder" >"$lws/scripts/ci/$script"
done
printf 'echo "21 22 23"\n' >>"$lws/scripts/ci/woodpecker-fetch-handoffs.sh"
for script in release-version.mjs release-user-observation.mjs; do
  cat >"$lws/scripts/ci/$script" <<NODE
import {appendFileSync} from 'node:fs';const e=process.env;
appendFileSync(e.CALLS_LOG,\`$script|\${e.GH_TOKEN??''}\n\`);
process.stdout.write('$script'==='release-version.mjs'?process.argv[2]:JSON.stringify({candidate:'$sha',sources:{linux:'$sha',macos:'$sha',windows:'$sha'}}));
NODE
done
printf '#!/bin/sh\necho %s\n' "$sha" >"$tmp/bin/git"; chmod +x "$tmp/bin/git"
run_lane() {
  : >"$log"
  env -i PATH="$tmp/bin:$PATH" HOME="$tmp" CALLS_LOG="$log" WOODPECKER_RELEASE_TEST_ROOT="$tmp/lane-root" \
    CI_COMMIT_SHA="$sha" BESKID_RELEASE_VERSION=0.6.0 BESKID_LINUX_BUILD=21 BESKID_MACOS_BUILD=22 BESKID_WINDOWS_BUILD=23 \
    "$@" bash "$lws/scripts/ci/woodpecker-release-lane.sh" "${LANE_MODE:?}" >/dev/null
}
LANE_MODE=publish run_lane GH_TOKEN=gh-secret
expect_line "woodpecker-full-history.sh|$lws|gh=|pckg=|ovsx=|plugin="
expect_line 'release-version.mjs|'
expect_line 'release-user-observation.mjs|'
expect_line "woodpecker-fetch-handoffs.sh|$sha,$sha,$sha $sha 0.6.0 $tmp/lane-root/woodpecker-handoff|gh=|pckg=|ovsx=|plugin="
expect_line 'woodpecker-release.sh|0.6.0 21 22 23|gh=gh-secret|pckg=|ovsx=|plugin='
test "$(head -1 "$log" | cut -d'|' -f1)" = woodpecker-full-history.sh || fail 'the lane resolved the candidate before full history'
LANE_MODE=verify run_lane BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_JSON='{}'
expect_line 'woodpecker-release.sh|0.6.0 21 22 23|gh=|pckg=|ovsx=|plugin='
LANE_MODE=prepare run_lane
expect_line 'woodpecker-release.sh|0.6.0 21 22 23|gh=|pckg=|ovsx=|plugin='
if LANE_MODE=publish run_lane 2>/dev/null; then fail 'the lane published without GH_TOKEN'; fi
if LANE_MODE=verify run_lane GH_TOKEN=gh-secret BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_JSON='{}' 2>/dev/null; then fail 'verification accepted GH_TOKEN'; fi
if LANE_MODE=verify run_lane 2>/dev/null; then fail 'verification ran without the owner waiver'; fi
if LANE_MODE=verify run_lane BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_JSON='{}' BESKID_MACOS_BUILD= 2>/dev/null; then fail 'verification ran without a pin'; fi

echo 'Release publisher dispatcher tests OK'
