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
grep -Fq 'validate_distribution_version "${version}"' "${workflow}" || fail "distribution does not use the shared stable/unstable version validator"

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
grep -Fq 'needs: [resolve-rolling, windows-msi, macos-brew, macos-dmg, ubuntu-deb, linux-snap, container-images]' "${workflow}" || fail "completion marker must wait for every platform job"
grep -Fq "needs.windows-msi.result == 'success'" "${workflow}" || fail "completion marker must require successful Windows publication"
grep -Fq "needs.macos-brew.result == 'success'" "${workflow}" || fail "completion marker must require successful macOS publication"
grep -Fq "needs.macos-dmg.result == 'success'" "${workflow}" || fail "completion marker must require successful macOS DMG publication"
grep -Fq "needs.ubuntu-deb.result == 'success'" "${workflow}" || fail "completion marker must require successful Debian publication"
grep -Fq "needs.linux-snap.result == 'success'" "${workflow}" || fail "completion marker must require successful Snap publication"
grep -Fq "needs.container-images.result == 'success'" "${workflow}" || fail "completion marker must require successful container image publication"
if grep -Eq 'arch-aur|AUR_|PKGBUILD|beskid-bin' "${workflow}"; then
  fail "AUR support must be removed from distribute.yml"
fi

# Unstable compiler releases may feed retry-safe installer and container lanes,
# but must never mutate stable-only package channels.
homebrew_block="$(sed -n '/^  macos-brew:/,/^  macos-dmg:/p' "${workflow}")"
grep -Fq "needs.resolve-rolling.outputs.release_channel == 'stable'" <<<"${homebrew_block}" || \
  fail "unstable distribution can overwrite the stable Homebrew formula"
snap_block="$(sed -n '/^  linux-snap:/,/^  container-images:/p' "${workflow}")"
grep -Fq "needs.resolve-rolling.outputs.release_channel == 'stable'" <<<"${snap_block}" || \
  fail "unstable distribution can publish to the Snap stable channel"
container_block="$(sed -n '/^  container-images:/,/^  record-complete-marker:/p' "${workflow}")"
grep -Fq 'beskid:${{ needs.resolve-rolling.outputs.release_channel }}' <<<"${container_block}" || \
  fail "generic container does not publish the canonical stable/unstable rolling tag"
grep -Fq 'beskid-runner:${{ needs.resolve-rolling.outputs.release_channel }}' <<<"${container_block}" || \
  fail "runner container does not publish the canonical stable/unstable rolling tag"
if grep -Fq 'outputs.cli_rolling_tag' <<<"${container_block}"; then
  fail "container rolling tags must not inherit CLI release tag names"
fi

# build-deb.sh consumes the immutable release asset filenames. Renaming them to
# the installed command names during fetch makes the package builder fail before
# dpkg-deb runs.
ubuntu_block="$(sed -n '/^  ubuntu-deb:/,/^  linux-snap:/p' "${workflow}")"
grep -Fq 'fetch-release-assets.sh cli "${VERSION}" x86_64-unknown-linux-gnu' <<<"${ubuntu_block}" || \
  fail "Debian job does not fetch the immutable CLI asset"
grep -Fq 'fetch-release-assets.sh lsp "${VERSION}" x86_64-unknown-linux-gnu' <<<"${ubuntu_block}" || \
  fail "Debian job does not fetch the immutable LSP asset"
if grep -Eq 'fetch-release-assets\.sh cli "\$\{VERSION\}" x86_64-unknown-linux-gnu beskid$' <<<"${ubuntu_block}"; then
  fail "Debian job renames the CLI asset away from build-deb.sh's required filename"
fi
if grep -Eq 'fetch-release-assets\.sh lsp "\$\{VERSION\}" x86_64-unknown-linux-gnu beskid_lsp$' <<<"${ubuntu_block}"; then
  fail "Debian job renames the LSP asset away from build-deb.sh's required filename"
fi

# The rolling CLI tag is what resolve-rolling uses. It must be the final commit point:
# if a versioned marker upload fails, a retry must still see no completed marker.
marker_block="$(sed -n '/record-complete-marker:/,$p' "${workflow}")"
# shellcheck disable=SC2016 # Match the literal workflow shell commands.
versioned_marker_line="$(printf '%s\n' "${marker_block}" | grep -n -F 'gh release upload "$tag" --repo "${COMPILER_REPO}" distrib-version.txt --clobber' | cut -d: -f1)"
# shellcheck disable=SC2016 # Match the literal workflow shell commands.
rolling_marker_line="$(printf '%s\n' "${marker_block}" | grep -n -F 'gh release upload "${{ needs.resolve-rolling.outputs.cli_rolling_tag }}" --repo "${COMPILER_REPO}" distrib-version.txt --clobber' | cut -d: -f1)"
[[ -n "${versioned_marker_line}" ]] || fail "missing versioned completion marker upload"
[[ -n "${rolling_marker_line}" ]] || fail "missing rolling completion marker upload"
[[ "${versioned_marker_line}" -lt "${rolling_marker_line}" ]] || fail "rolling marker must be written only after the versioned marker succeeds"

echo "distribution workflow contract tests OK"
