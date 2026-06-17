#!/usr/bin/env bash
# Compiler Rust gate: legacy type-system guard + corelib-tests parity + clippy
# (deny warnings) + workspace tests.
#
# Ported verbatim from the Dagger `compilerRustGate` (beskid_infra/dagger/src/gates.ts)
# so the gate runs directly on a Blacksmith runner / Testbox VM instead of inside a
# Dagger container. Run from the superrepo root; the compiler workspace lives in
# `compiler/` and resolves its `../beskid_bsol` path dependency against the sibling
# `beskid_bsol/` submodule.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}/compiler"

# Corelib lowering can recurse deeply; match the Dagger gate's stack bump.
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
cargo test --workspace --exclude beskid_e2e_tests -- --test-threads=1
