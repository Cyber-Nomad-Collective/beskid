#!/usr/bin/env bash
# Compiler Rust gate: legacy type-system guard + corelib-tests parity + clippy
# (deny warnings) + workspace tests.
#
# Runs directly on a native CI worker or contributor machine. Run from the
# superrepo root; the compiler workspace lives in
# `compiler/` and resolves its `../beskid_bsol` path dependency against the sibling
# `beskid_bsol/` submodule.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}/compiler"

# Corelib lowering can recurse deeply; preserve the required stack bump.
export RUST_MIN_STACK="${RUST_MIN_STACK:-67108864}"
gate_phase="${1:-all}"

run_bounded_phase() {
  local label="$1"
  local timeout_seconds="$2"
  shift 2

  if [[ "${timeout_seconds}" == "0" ]]; then
    echo "==> ${label} (internal timeout disabled; worker limit applies)"
    "$@"
    return
  fi

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

run_lint_phase() {
  # Guard: retired type-system internals must not be reintroduced in compiler sources.
  local legacy_patterns=(
    "expr_types"
    "TypeContext"
    "types/context/"
    "type_prefetched_source_path"
    "seed_definitions_from_source_path"
  )
  local pattern
  for pattern in "${legacy_patterns[@]}"; do
    if rg -n --glob '*.rs' "${pattern}" crates/ >/dev/null 2>&1; then
      echo "legacy type-system pattern reintroduced: ${pattern}" >&2
      rg -n --glob '*.rs' "${pattern}" crates/ >&2 || true
      return 1
    fi
  done

  if [[ -f scripts/verify-corelib-tests-parity.sh ]]; then
    bash scripts/verify-corelib-tests-parity.sh
  fi
  echo "no legacy type-system patterns in compiler .rs sources"

  # Clippy denies warnings. `--no-deps` keeps the gate scoped to workspace crates.
  rustup component add clippy >/dev/null 2>&1 || true
  run_bounded_phase "Clippy" "${BESKID_CLIPPY_TIMEOUT:-600}" \
    cargo clippy --workspace --all-targets --no-deps -- -D warnings
}

run_runtime_phase() {
  run_runtime_kit_build_phase
  run_runtime_kit_verify_phase

  # Tests run serially, so a deadlocked lowering test cannot consume the whole job.
  local test_timeout="${BESKID_TEST_TIMEOUT:-1800}"
  if [[ "${test_timeout}" == "0" ]]; then
    cargo test --workspace --exclude beskid_e2e_tests -- --test-threads=1
    return
  fi

  set +e
  timeout --kill-after=60s "${test_timeout}" \
    cargo test --workspace --exclude beskid_e2e_tests -- --test-threads=1
  local status=$?
  set -e
  if [[ "${status}" -eq 124 ]]; then
    echo "::error::Workspace tests exceeded ${test_timeout}s hard cap; a test is hung or looping. Failing fast instead of burning the job timeout." >&2
  fi
  return "${status}"
}

run_runtime_kit_build_phase() {
  # Build a fresh canonical runtime kit for this exact native host. Hosted CI can hand the
  # immutable result to a separate verifier job without duplicating the canonical builder.
  export BESKID_RUNTIME_PREFIX="${BESKID_RUNTIME_PREFIX:-${CARGO_TARGET_DIR:-${ROOT}/compiler/target}/native-runtime-kit}"
  export BESKID_RUNTIME_KIT_PROFILE=debug
  run_bounded_phase "Native ABI-v5 runtime-kit build" "${BESKID_RUNTIME_KIT_TIMEOUT:-600}" \
    bash scripts/stage-native-runtime-kit.sh build
}

run_runtime_kit_verify_phase() {
  export BESKID_RUNTIME_PREFIX="${BESKID_RUNTIME_PREFIX:-${CARGO_TARGET_DIR:-${ROOT}/compiler/target}/native-runtime-kit}"
  export BESKID_RUNTIME_KIT_PROFILE=debug
  run_bounded_phase "Native ABI-v5 runtime-kit verification" "${BESKID_RUNTIME_KIT_VERIFY_TIMEOUT:-1800}" \
    bash scripts/stage-native-runtime-kit.sh verify
}

case "${gate_phase}" in
  all)
    run_lint_phase
    run_runtime_phase
    ;;
  lint)
    run_lint_phase
    ;;
  runtime)
    run_runtime_phase
    ;;
  runtime-kit-build)
    run_runtime_kit_build_phase
    ;;
  runtime-kit-verify)
    run_runtime_kit_verify_phase
    ;;
  *)
    echo "unsupported compiler Rust gate phase: ${gate_phase}" >&2
    exit 2
    ;;
esac
