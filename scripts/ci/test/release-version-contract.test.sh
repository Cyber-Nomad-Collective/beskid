#!/usr/bin/env bash
# Release workflow contract: compiler CI is the only mint and downstream
# consumers read the exact version emitted by that compiler run.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
compiler_workflow="${root}/.github/workflows/compiler.yml"
open_vsx_workflow="${root}/.github/workflows/publish-open-vsx.yml"
distribute_workflow="${root}/.github/workflows/distribute.yml"

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

grep -Fq 'GITHUB_RUN_NUMBER: ${{ github.run_number }}' "${compiler_workflow}" || \
  fail 'compiler workflow does not provide its run number to the global version resolver'
grep -Fq 'name: Emit global release version' "${compiler_workflow}" || \
  fail 'compiler workflow does not emit its minted version as an artifact'
grep -Fq 'name: release-version' "${compiler_workflow}" || \
  fail 'compiler workflow does not name the version artifact release-version'

grep -Fq 'workflow_run:' "${open_vsx_workflow}" || \
  fail 'Open VSX is not triggered by a completed Compiler workflow run'
grep -Fq 'workflows: [Compiler]' "${open_vsx_workflow}" || \
  fail 'Open VSX does not consume Compiler workflow runs'
grep -Fq 'github.event.workflow_run.id' "${open_vsx_workflow}" || \
  fail 'Open VSX does not download the triggering Compiler run artifact'
grep -Fq -- '--name release-version' "${open_vsx_workflow}" || \
  fail 'Open VSX does not consume the compiler release-version artifact'
grep -Fq 'BESKID_RELEASE_VERSION: ${{ steps.release-version.outputs.version }}' "${open_vsx_workflow}" || \
  fail 'Open VSX does not pass the consumed compiler version to its publisher'
resolver_workflows="$(rg -l 'resolve-beskid-version\.sh' "${root}/.github/workflows" -g '*.yml' -g '*.yaml' || true)"
if [[ "${resolver_workflows}" != "${compiler_workflow}" ]]; then
  fail "only compiler.yml may mint a release version (found: ${resolver_workflows:-none})"
fi


grep -Fq 'workflow_run:' "${distribute_workflow}" || \
  fail 'Distribute is not triggered by a completed Compiler workflow run'
grep -Fq 'workflows: [Compiler]' "${distribute_workflow}" || \
  fail 'Distribute does not consume Compiler workflow runs'
grep -Fq -- '--name release-version' "${distribute_workflow}" || \
  fail 'Distribute does not consume the compiler release-version artifact'
grep -Fq '^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$' "${distribute_workflow}" || \
  fail 'Distribute does not fail closed on a non-strict semver version'

printf 'Global release version workflow contract tests OK\n'
