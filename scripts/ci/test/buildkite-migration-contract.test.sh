#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
PIPELINE="${ROOT}/.buildkite/pipeline.yml"
ENTRYPOINT="${ROOT}/scripts/ci/appveyor-entrypoint.sh"
INSTALLER="${ROOT}/scripts/ci/appveyor-install.sh"
fail() { echo "buildkite contract failure: $*" >&2; exit 1; }

[[ -f "${PIPELINE}" ]] || fail "Buildkite pipeline is missing"
grep -q 'appveyor-entrypoint.sh' "${PIPELINE}" || fail "Buildkite pipeline does not reuse the POSIX lane entrypoint"
grep -q 'appveyor-entrypoint.ps1' "${PIPELINE}" || fail "Buildkite pipeline does not reuse the Windows lane entrypoint"

for lane in linux-compiler-lint linux-compiler-runtime macos-compiler windows-compiler vscode-extension zed-extension; do
  grep -q "BESKID_CI_LANE=${lane}\|BESKID_CI_LANE = \"${lane}\"" "${PIPELINE}" || \
    fail "Buildkite pipeline is missing ${lane}"
done

grep -q 'linux-compiler-runtime)' "${ENTRYPOINT}" || \
  fail "Buildkite full-runtime lane is missing from the shared dispatcher"
grep -q 'linux-compiler-runtime|linux-runtime-kit-build' "${INSTALLER}" || \
  fail "Buildkite full-runtime lane is missing from the shared installer"

if grep -q 'appveyor-platform-publish\|appveyor-package-publish\|appveyor-platform-promote' "${PIPELINE}"; then
  fail "Buildkite pipeline must not gain registry publication authority"
fi

echo "Buildkite migration contract OK"
