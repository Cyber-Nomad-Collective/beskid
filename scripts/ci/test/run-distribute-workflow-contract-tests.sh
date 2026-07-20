#!/usr/bin/env bash
# Contract tests for retry-safe distribution workflow orchestration.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
workflow="${root}/.github/workflows/distribute.yml"
foundation_suite="${root}/scripts/ci/test/run-cicd-foundation-tests.sh"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

grep -Fq 'run-distribute-workflow-contract-tests.sh' "${foundation_suite}" || fail "distribution workflow contract is not run by the CI/CD foundation suite"

grep -Fq 'name: Require distribution GitHub token' "${workflow}" || fail "missing DISTRIB_GH_PAT preflight"
grep -Fq 'DISTRIB_GH_PAT must be configured before distribution can read or publish release artifacts.' "${workflow}" || fail "preflight does not fail closed"

preflight_line="$(grep -n -F 'name: Require distribution GitHub token' "${workflow}" | cut -d: -f1)"
submodule_line="$(grep -n -F 'name: Init beskid_distrib submodule (shallow)' "${workflow}" | cut -d: -f1)"
[[ "${preflight_line}" -lt "${submodule_line}" ]] || fail "credential preflight must precede release-asset setup"

if grep -Fq 'stamp-marker:' "${workflow}"; then
  fail "marker must not be stamped before platform publication"
fi

if grep -Fq 'needs: [resolve-rolling, stamp-marker]' "${workflow}"; then
  fail "distribution jobs must not depend on the retired stamp-marker job"
fi

grep -Fq 'record-complete-marker:' "${workflow}" || fail "missing post-publication marker job"
grep -Fq 'needs: [resolve-rolling, windows-msi, macos-brew, macos-dmg, ubuntu-deb, linux-snap]' "${workflow}" || fail "completion marker must wait for every platform job"
grep -Fq "needs.windows-msi.result == 'success'" "${workflow}" || fail "completion marker must require successful Windows publication"
grep -Fq "needs.macos-brew.result == 'success'" "${workflow}" || fail "completion marker must require successful macOS publication"
grep -Fq "needs.macos-dmg.result == 'success'" "${workflow}" || fail "completion marker must require successful macOS DMG publication"
grep -Fq "needs.ubuntu-deb.result == 'success'" "${workflow}" || fail "completion marker must require successful Debian publication"
grep -Fq "needs.linux-snap.result == 'success'" "${workflow}" || fail "completion marker must require successful Snap publication"
if grep -Eq 'arch-aur|AUR_|PKGBUILD|beskid-bin' "${workflow}"; then
  fail "AUR support must be removed from distribute.yml"
fi

# `cli-latest` is what resolve-rolling reads. It must be the final commit point:
# if a versioned marker upload fails, a retry must still see no completed marker.
marker_block="$(sed -n '/record-complete-marker:/,$p' "${workflow}")"
# shellcheck disable=SC2016 # Match the literal workflow shell commands.
versioned_marker_line="$(printf '%s\n' "${marker_block}" | grep -n -F 'gh release upload "$tag" --repo "${COMPILER_REPO}" distrib-version.txt --clobber' | cut -d: -f1)"
# shellcheck disable=SC2016 # Match the literal workflow shell commands.
latest_marker_line="$(printf '%s\n' "${marker_block}" | grep -n -F 'gh release upload cli-latest --repo "${COMPILER_REPO}" distrib-version.txt --clobber' | cut -d: -f1)"
[[ -n "${versioned_marker_line}" ]] || fail "missing versioned completion marker upload"
[[ -n "${latest_marker_line}" ]] || fail "missing cli-latest completion marker upload"
[[ "${versioned_marker_line}" -lt "${latest_marker_line}" ]] || fail "cli-latest marker must be written only after the versioned marker succeeds"

echo "distribution workflow contract tests OK"
