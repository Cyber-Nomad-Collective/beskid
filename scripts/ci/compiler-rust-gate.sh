#!/usr/bin/env bash
# Compiler Rust gate: legacy type-system guard + corelib-tests parity + clippy
# (deny warnings) + workspace tests.
#
# Runs directly on a Blacksmith runner / Testbox VM. Run from the superrepo root;
# the compiler workspace lives in
# `compiler/` and resolves its `../beskid_bsol` path dependency against the sibling
# `beskid_bsol/` submodule.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}/compiler"

# Corelib lowering can recurse deeply; preserve the required stack bump.
export RUST_MIN_STACK="${RUST_MIN_STACK:-67108864}"

run_bounded_phase() {
  local label="$1"
  local timeout_seconds="$2"
  shift 2

  echo "==> ${label} (timeout: ${timeout_seconds}s)"
  set +e
  timeout --kill-after=60s "${timeout_seconds}" "$@"
  local status=$?
  set -e

  if [[ "${status}" -eq 124 ]]; then
    echo "::error::${label} exceeded its ${timeout_seconds}s hard cap; failing the gate with phase evidence." >&2
  fi
  return "${status}"
}

# Guard: retired type-system internals must not be reintroduced in compiler sources.
legacy_patterns=(
  "expr_types"
  "TypeContext"
  "types/context/"
  "type_prefetched_source_path"
  "seed_definitions_from_source_path"
)
for pattern in "${legacy_patterns[@]}"; do
  if rg -n --glob '*.rs' "${pattern}" crates/ >/dev/null 2>&1; then
    echo "legacy type-system pattern reintroduced: ${pattern}" >&2
    rg -n --glob '*.rs' "${pattern}" crates/ >&2 || true
    exit 1
  fi
done

if [[ -f scripts/verify-corelib-tests-parity.sh ]]; then
  bash scripts/verify-corelib-tests-parity.sh
fi
echo "no legacy type-system patterns in compiler .rs sources"

# clippy (deny warnings). `--no-deps` keeps the gate scoped to workspace crates.
rustup component add clippy >/dev/null 2>&1 || true
run_bounded_phase "Clippy" "${BESKID_CLIPPY_TIMEOUT:-600}" \
  cargo clippy --workspace --all-targets --no-deps -- -D warnings

# Build a fresh canonical runtime kit for this exact native host, then run workspace tests.
# Debug tests resolve only the debug profile; cross-target publication remains a separate gate.
export BESKID_RUNTIME_PREFIX="${BESKID_RUNTIME_PREFIX:-${CARGO_TARGET_DIR:-${ROOT}/compiler/target}/native-runtime-kit}"
export BESKID_RUNTIME_KIT_PROFILE=debug
run_bounded_phase "Native ABI-v5 runtime-kit staging and verification" "${BESKID_RUNTIME_KIT_TIMEOUT:-600}" \
  bash scripts/stage-native-runtime-kit.sh

# Hard cap the test phase. Tests run serially (--test-threads=1), so a single
# deadlocked or infinitely-looping test (e.g. a mis-lowered loop executed under
# JIT) would otherwise block the whole suite until GitHub's 6h job cap. Fail in
# minutes instead. Override with BESKID_TEST_TIMEOUT (seconds); 0 disables.
test_timeout="${BESKID_TEST_TIMEOUT:-1800}"
if [[ "${test_timeout}" != "0" ]]; then
  set +e
  timeout --kill-after=60s "${test_timeout}" \
    cargo test --workspace --exclude beskid_e2e_tests -- --test-threads=1
  status=$?
  set -e
  if [[ "${status}" -ne 0 ]]; then
    if [[ "${status}" -eq 124 ]]; then
      echo "::error::Workspace tests exceeded ${test_timeout}s hard cap; a test is hung or looping. Failing fast instead of burning the job timeout." >&2
    fi
    exit "${status}"
  fi
else
  cargo test --workspace --exclude beskid_e2e_tests -- --test-threads=1
fi
