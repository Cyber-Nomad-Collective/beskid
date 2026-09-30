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
corelib_source="${WOODPECKER_RELEASE_GATE_CORELIB_SOURCE:-$root/compiler/corelib}"
verify_source_inventory() {
  bash "$root/scripts/ci/release-source-inventory.sh" "$root" root
  bash "$root/scripts/ci/release-source-inventory.sh" "$root/compiler" compiler
  bash "$root/scripts/ci/release-source-inventory.sh" "$root/compiler/corelib" corelib
  bash "$root/scripts/ci/release-source-inventory.sh" "$root/beskid_bsol" bsol
}
if [[ -n "${CI_COMMIT_SHA:-}" || -n "${CI_PIPELINE_NUMBER:-}" || "${CI_SYSTEM_NAME:-}" == woodpecker ]]; then
  [[ -z "${WOODPECKER_RELEASE_GATE_SCRIPT_DIR:-}" && -z "${WOODPECKER_RELEASE_GATE_CORELIB_SOURCE:-}" ]] || {
    echo 'test-only release gate overrides are forbidden in a pipeline' >&2; exit 2;
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

# Archive the exact Corelib Git tree for Cargo's embedded snapshot. A raw
# archive is not an authorized installed Corelib root: the CLI must materialize
# its embedded snapshot into a separate managed root before the matrix.
gate_temp="$(mktemp -d "${TMPDIR:-/tmp}/beskid-release-gates.XXXXXX")"
trap 'rm -rf -- "$gate_temp"' EXIT
mkdir "$gate_temp/corelib"
git -C "$corelib_source" archive HEAD | tar -xf - -C "$gate_temp/corelib"
if [[ -n "$(find "$gate_temp/corelib" -type l -print -quit)" ]]; then
  echo 'release Corelib source archive contains a symlink' >&2; exit 1
fi
export BESKID_CORELIB_SOURCE="$gate_temp/corelib"
export BESKID_RUNTIME_PREFIX="$gate_temp/runtime-kit"
export CARGO_TARGET_DIR="$root/compiler/target"
unset BESKID_CLI_BIN

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

# The Corelib gate materializes the pinned source into a verified managed root.
# Rust tests must consume that same root so they do not replay stale lock graphs
# from the raw checkout.
mkdir "$gate_temp/installed-corelib"
export BESKID_CORELIB_ROOT="$gate_temp/installed-corelib"
export BESKID_RELEASE_MANAGED_CORELIB=1
run_gate corelib matrix corelib-gate.sh
run_gate compiler rust-gate compiler-rust-gate.sh
if [[ -n "${CI_COMMIT_SHA:-}" || -n "${CI_PIPELINE_NUMBER:-}" || "${CI_SYSTEM_NAME:-}" == woodpecker ]]; then
  git -C "$root" diff --quiet
  git -C "$root/compiler" diff --quiet
  git -C "$root/compiler/corelib" diff --quiet
  git -C "$root/beskid_bsol" diff --quiet
  verify_source_inventory
fi
printf 'release gates passed for %s (%s, %s)\n' "$version" "$source" "$compiler"
