#!/usr/bin/env bash
# Contract tests for retry-safe distribution workflow orchestration.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
workflow="${root}/.github/workflows/distribute.yml"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

grep -Fq 'name: Require distribution GitHub token' "${workflow}" || fail "missing DISTRIB_GH_PAT preflight"
grep -Fq 'DISTRIB_GH_PAT must be configured before distribution can read or publish release artifacts.' "${workflow}" || fail "preflight does not fail closed"

preflight_line="$(grep -n -F 'name: Require distribution GitHub token' "${workflow}" | cut -d: -f1)"
submodule_line="$(grep -n -F 'name: Init beskid_distrib submodule (shallow)' "${workflow}" | cut -d: -f1)"
[[ "${preflight_line}" -lt "${submodule_line}" ]] || fail "credential preflight must precede release-asset setup"

if grep -Fq 'stamp-marker:' "${workflow}"; then
  fail "marker must not be stamped before platform publication"
fi

grep -Fq 'record-complete-marker:' "${workflow}" || fail "missing post-publication marker job"
grep -Fq 'needs: [resolve-rolling, windows-msi, macos-brew, arch-aur, ubuntu-deb, linux-snap]' "${workflow}" || fail "completion marker must wait for every platform job"
grep -Fq "needs.windows-msi.result == 'success'" "${workflow}" || fail "completion marker must require successful Windows publication"
grep -Fq "needs.macos-brew.result == 'success'" "${workflow}" || fail "completion marker must require successful macOS publication"
grep -Fq "needs.arch-aur.result == 'success'" "${workflow}" || fail "completion marker must require successful Arch publication"
grep -Fq "needs.ubuntu-deb.result == 'success'" "${workflow}" || fail "completion marker must require successful Debian publication"
grep -Fq "needs.linux-snap.result == 'success'" "${workflow}" || fail "completion marker must require successful Snap publication"

echo "distribution workflow contract tests OK"
