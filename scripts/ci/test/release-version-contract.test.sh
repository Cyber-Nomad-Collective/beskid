#!/usr/bin/env bash
# Release workflow contract: compiler CI is the only mint and downstream
# consumers read the exact version emitted by that compiler run.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
compiler_workflow="${root}/.github/workflows/compiler.yml"
release_workflow="${root}/.github/workflows/compiler-release.yml"
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

# Legacy in-workflow publishing is removed; the dedicated release workflow
# is the sole CLI, LSP, and bundle publisher.
for release_job in release-cli-build release-cli-publish release-lsp-build release-lsp-publish release-bundle-build release-bundle-publish; do
  if grep -Eq "^  ${release_job}:" "${compiler_workflow}"; then
    fail "${release_job} duplicates compiler-release.yml"
  fi
done

grep -Fq 'workflows: [Compiler]' "${release_workflow}" || \
  fail 'compiler release workflow is not triggered by Compiler completion'
grep -Fq 'github.event.workflow_run.run_number' "${release_workflow}" || \
  fail 'compiler release workflow does not preserve the triggering Compiler run number'
grep -Fq "github.event.workflow_run.conclusion == 'success' && 'stable' || 'unstable'" "${release_workflow}" || \
  fail 'automatic compiler release channel does not follow the gate conclusion'
grep -Fq 'bash ./scripts/ci/build-release-platform.sh' "${release_workflow}" || \
  fail 'compiler release workflow does not use the structured platform wrapper'
grep -Fq 'name: compiler-release-${{ matrix.target }}' "${release_workflow}" || \
  fail 'compiler release workflow does not retain independent platform reports'
grep -Fq 'name: compiler-release-state' "${release_workflow}" || \
  fail 'compiler release workflow does not retain machine-readable release state'
grep -Fq "if: \${{ always() && needs.state.result == 'success' && needs.state.outputs.publishable == 'true' }}" "${release_workflow}" || \
  fail 'compiler release publication is not explicitly allowed after a partial platform failure'

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
resolver_workflows="$(rg -l 'resolve-beskid-version\.sh' "${root}/.github/workflows" -g '*.yml' -g '*.yaml' | sort || true)"
expected_resolvers="$(printf '%s\n%s\n' "${release_workflow}" "${compiler_workflow}" | sort)"
if [[ "${resolver_workflows}" != "${expected_resolvers}" ]]; then
  fail "only compiler and compiler-release workflows may resolve the central version (found: ${resolver_workflows:-none})"
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
