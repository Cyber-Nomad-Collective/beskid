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
cargo clippy --workspace --all-targets --no-deps -- -D warnings

# Build the runtime bridge archive AOT tests resolve, then run workspace tests.
bash scripts/ensure-runtime-bridge.sh

# Hard cap the test phase. Tests run serially (--test-threads=1), so a single
# deadlocked or infinitely-looping test (e.g. a mis-lowered loop executed under
# JIT) would otherwise block the whole suite until GitHub's 6h job cap. Fail in
# minutes instead. Override with BESKID_TEST_TIMEOUT (seconds); 0 disables.
test_timeout="${BESKID_TEST_TIMEOUT:-1800}"
if [[ "${test_timeout}" != "0" ]]; then
  if ! timeout --kill-after=60s "${test_timeout}" \
    cargo test --workspace --exclude beskid_e2e_tests -- --test-threads=1; then
    status=$?
    if [[ "${status}" -eq 124 ]]; then
      echo "::error::Workspace tests exceeded ${test_timeout}s hard cap; a test is hung or looping. Failing fast instead of burning the job timeout." >&2
    fi
    exit "${status}"
  fi
else
  cargo test --workspace --exclude beskid_e2e_tests -- --test-threads=1
fi
