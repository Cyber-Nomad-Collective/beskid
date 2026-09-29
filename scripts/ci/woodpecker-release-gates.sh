#!/usr/bin/env bash
# Run the source-bound Linux release qualification gates on the build worker.
# Usage: woodpecker-release-gates.sh <stable-version> <platform-output-dir>
set -euo pipefail
[[ "$#" == 2 ]] || { echo 'usage: woodpecker-release-gates.sh <version> <output-dir>' >&2; exit 2; }
requested_version="$1"
output="$2"
root="$(cd "$(dirname "$0")/../.." && pwd)"
version="$(node "$root/scripts/ci/release-version.mjs" "$requested_version" --stable-only)"
source="$(git -C "$root" rev-parse HEAD)"
compiler="$(git -C "$root" rev-parse HEAD:compiler)"
gate_scripts="${WOODPECKER_RELEASE_GATE_SCRIPT_DIR:-$root/scripts/ci}"
verify_source_inventory() {
  bash "$root/scripts/ci/release-source-inventory.sh" "$root" root
  bash "$root/scripts/ci/release-source-inventory.sh" "$root/compiler" compiler
  bash "$root/scripts/ci/release-source-inventory.sh" "$root/compiler/corelib" corelib
  bash "$root/scripts/ci/release-source-inventory.sh" "$root/beskid_bsol" bsol
}
if [[ -n "${CI_COMMIT_SHA:-}" || -n "${CI_PIPELINE_NUMBER:-}" || "${CI_SYSTEM_NAME:-}" == woodpecker ]]; then
  [[ -z "${WOODPECKER_RELEASE_GATE_SCRIPT_DIR:-}" ]] || {
    echo 'test-only release gate script override is forbidden in a pipeline' >&2; exit 2;
  }
  corelib="$(git -C "$root/compiler" rev-parse HEAD:corelib)"
  bsol="$(git -C "$root" rev-parse HEAD:beskid_bsol)"
  [[ "${CI_COMMIT_SHA:-}" == "$source" && "$(git -C "$root/compiler" rev-parse HEAD)" == "$compiler" && \
    "$(git -C "$root/compiler/corelib" rev-parse HEAD)" == "$corelib" && \
    "$(git -C "$root/beskid_bsol" rev-parse HEAD)" == "$bsol" ]] || {
    echo 'release gate checkout does not match pinned source' >&2; exit 1;
  }
  git -C "$root" diff --quiet
  git -C "$root" diff --cached --quiet
  git -C "$root/compiler" diff --quiet
  git -C "$root/compiler" diff --cached --quiet
  git -C "$root/compiler/corelib" diff --quiet
  git -C "$root/compiler/corelib" diff --cached --quiet
  git -C "$root/beskid_bsol" diff --quiet
  git -C "$root/beskid_bsol" diff --cached --quiet
  verify_source_inventory
fi
mkdir -p "$output"

sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

run_gate() {
  local component="$1" stage="$2" script="$3" log report rc=0 digest
  log="release-gate-${component}.log"
  report="release-gate-${component}.json"
  [[ ! -e "$output/$log" && ! -e "$output/$report" ]] || {
    echo "release gate output already exists: $component" >&2; return 2;
  }
  if bash "$gate_scripts/$script" >"$output/$log" 2>&1; then
    rc=0
  else
    rc=$?
  fi
  digest="$(sha256_file "$output/$log")"
  jq -n --arg component "$component" --arg stage "$stage" --arg version "$version" \
    --arg source "$source" --arg compiler "$compiler" --arg log "$log" --arg digest "$digest" \
    --arg command "bash scripts/ci/$script" --argjson rc "$rc" '
    {schema_version:1,component:$component,stage:$stage,platform:"linux",version:$version,
     source:{superrepo_commit:$source,compiler_commit:$compiler},
     status:(if $rc == 0 then "success" else "failed" end),exit_code:$rc,
     command:$command,raw_log:$log,raw_log_sha256:$digest}
  ' >"$output/$report"
  if [[ "$rc" != 0 ]]; then
    echo "release gate failed: $component ($rc); see $output/$log" >&2
    return "$rc"
  fi
}

run_gate compiler rust-gate compiler-rust-gate.sh
run_gate corelib matrix corelib-gate.sh
if [[ -n "${CI_COMMIT_SHA:-}" || -n "${CI_PIPELINE_NUMBER:-}" || "${CI_SYSTEM_NAME:-}" == woodpecker ]]; then
  git -C "$root" diff --quiet
  git -C "$root/compiler" diff --quiet
  git -C "$root/compiler/corelib" diff --quiet
  git -C "$root/beskid_bsol" diff --quiet
  verify_source_inventory
fi
printf 'release gates passed for %s (%s, %s)\n' "$version" "$source" "$compiler"
