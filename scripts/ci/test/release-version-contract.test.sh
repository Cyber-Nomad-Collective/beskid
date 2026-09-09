#!/usr/bin/env bash
# Release workflow contract: AppVeyor is the CI authority while GitHub remains
# the explicit, GitHub-native release publisher.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
release_workflow="${root}/.github/workflows/compiler-release.yml"
open_vsx_workflow="${root}/.github/workflows/publish-open-vsx.yml"
distribute_workflow="${root}/.github/workflows/distribute.yml"
cleanup_workflow="${root}/.github/workflows/compiler-handoff-cleanup.yml"
windows_llvm_action="${root}/.github/actions/setup-native-llvm-windows/action.yml"

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

for workflow in "${release_workflow}" "${cleanup_workflow}" "${distribute_workflow}"; do
  if rg -Fq 'blacksmith-' "${workflow}"; then
    fail "retained GitHub-native publication still depends on Blacksmith: ${workflow}"
  fi
done

[[ -f "${windows_llvm_action}" ]] || fail 'missing shared pinned Windows LLVM setup action'
grep -Fq 'default: "20.1.8"' "${windows_llvm_action}" || \
  fail 'Windows LLVM setup does not pin the native tooling version'
for tool in llvm-nm.exe llvm-readobj.exe llvm-ml.exe clang.exe; do
  grep -Fq "${tool}" "${windows_llvm_action}" || \
    fail "Windows LLVM setup does not require ${tool}"
done
[[ ! -e "${root}/.github/workflows/compiler.yml" ]] || \
  fail 'GitHub still contains the superseded Compiler validation workflow'
grep -Fq 'uses: ./.github/actions/setup-native-llvm-windows' "${release_workflow}" || \
  fail 'Windows release path does not install the shared pinned LLVM toolchain'

if grep -Fq 'workflow_run:' "${release_workflow}"; then
  fail 'compiler release still couples publication to a GitHub validation workflow'
fi
grep -Fq 'source_sha:' "${release_workflow}" || \
  fail 'manual compiler release does not require the AppVeyor-validated source SHA'
grep -Fq 'appveyor_build_version:' "${release_workflow}" || \
  fail 'manual compiler release does not record its AppVeyor evidence identity'
grep -Fq 'appveyor_gate_result:' "${release_workflow}" || \
  fail 'manual compiler release does not record the AppVeyor gate result'
grep -Fq 'MANUAL_SOURCE_SHA: ${{ inputs.source_sha }}' "${release_workflow}" || \
  fail 'manual compiler release does not consume the validated source SHA'
grep -Fq 'MANUAL_GATE_RESULT: ${{ inputs.appveyor_gate_result }}' "${release_workflow}" || \
  fail 'manual compiler release does not consume the AppVeyor gate result'
grep -Fq 'appveyor-build.txt' "${release_workflow}" || \
  fail 'compiler release does not retain AppVeyor build evidence'
grep -Fq 'bash ./scripts/ci/build-release-platform.sh' "${release_workflow}" || \
  fail 'compiler release workflow does not use the structured platform wrapper'
grep -Fq 'handoff_tag: ${{ steps.release.outputs.handoff_tag }}' "${release_workflow}" || \
  fail 'compiler release workflow does not expose its GitHub Release handoff tag'
grep -Fq 'handoff_tag=compiler-handoff-${GITHUB_RUN_ID}' "${release_workflow}" || \
  fail 'compiler release handoff identity is not stable across failed-job reruns'
if grep -Fq 'handoff_tag=compiler-handoff-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}' "${release_workflow}"; then
  fail 'compiler release handoff identity still changes across failed-job reruns'
fi
grep -Fq "find release-assets -name 'platform-result-*.json'" "${release_workflow}" || \
  fail 'compiler release workflow does not retain independent platform reports in its handoff release'
grep -Fq 'release-state.json' "${release_workflow}" || \
  fail 'compiler release workflow does not retain machine-readable release state'
grep -Fq "if: \${{ always() && needs.state.result == 'success' && needs.state.outputs.publishable == 'true' }}" "${release_workflow}" || \
  fail 'compiler release publication is not explicitly allowed after a partial platform failure'

grep -Fq 'workflow_run:' "${open_vsx_workflow}" || \
  fail 'Open VSX is not triggered by a completed workflow run'
grep -Fq 'workflows: [Compiler release]' "${open_vsx_workflow}" || \
  fail 'Open VSX does not consume Compiler release workflow runs'
grep -Fq 'compiler-handoff-${{ github.event.workflow_run.id }}' "${open_vsx_workflow}" || \
  fail 'Open VSX does not address the triggering compiler GitHub Release handoff'
if grep -Fq 'github.event.workflow_run.run_attempt' "${open_vsx_workflow}"; then
  fail 'Open VSX handoff lookup changes across failed-job reruns'
fi
grep -Fq -- '--pattern release-state.json' "${open_vsx_workflow}" || \
  fail 'Open VSX does not consume release state from the compiler GitHub Release handoff'
grep -Fq 'BESKID_RELEASE_VERSION: ${{ steps.release-version.outputs.version }}' "${open_vsx_workflow}" || \
  fail 'Open VSX does not pass the consumed compiler version to its publisher'
resolver_workflows="$(rg -l 'resolve-beskid-version\.sh' "${root}/.github/workflows" -g '*.yml' -g '*.yaml' | sort || true)"
if [[ "${resolver_workflows}" != "${release_workflow}" ]]; then
  fail "only compiler-release may resolve the central version (found: ${resolver_workflows:-none})"
fi


grep -Fq 'workflow_run:' "${distribute_workflow}" || \
  fail 'Distribute is not triggered by a completed workflow run'
grep -Fq 'workflows: [Compiler release]' "${distribute_workflow}" || \
  fail 'Distribute does not consume Compiler release workflow runs'
grep -Fq 'compiler-handoff-${{ github.event.workflow_run.id }}' "${distribute_workflow}" || \
  fail 'Distribute does not address the triggering compiler GitHub Release handoff'
if grep -Fq 'github.event.workflow_run.run_attempt' "${distribute_workflow}"; then
  fail 'Distribute handoff lookup changes across failed-job reruns'
fi
grep -Fq -- '--pattern release-state.json' "${distribute_workflow}" || \
  fail 'Distribute does not consume release state from the compiler GitHub Release handoff'
grep -Fq 'validate_distribution_version "${version}"' "${distribute_workflow}" || \
  fail 'Distribute does not validate the compiler-owned stable/unstable version shape'

printf 'Global release version workflow contract tests OK\n'
