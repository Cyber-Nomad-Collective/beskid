#!/usr/bin/env bash
# Compiler Rust gate: clippy (report-only) + runtime-kit staging + workspace tests.
#
# Clippy is lint, non-blocking for release: the lint phase logs every finding and their count and
# never fails the gate. Runtime-kit staging and the workspace tests stay blocking.
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
  # Clippy is report-only for the release gate: it logs findings with a count and does not fail.
  # `--no-deps` keeps the report scoped to workspace crates.
  rustup component add clippy >/dev/null 2>&1 || true
  local report status findings
  report="$(mktemp "${TMPDIR:-/tmp}/beskid-clippy.XXXXXX")"
  set +e
  run_bounded_phase "Clippy (report-only)" "${BESKID_CLIPPY_TIMEOUT:-600}" \
    cargo clippy --workspace --all-targets --no-deps -- -D warnings 2>&1 | tee "${report}"
  status="${PIPESTATUS[0]}"
  set -e
  # One finding per diagnostic header; summary lines ("generated N warnings", "could not compile",
  # "aborting due to") are not findings.
  findings="$(grep -E '^(warning|error)(\[[^]]+\])?: ' "${report}" \
    | grep -cvE 'generated [0-9]+ (warning|error)|could not compile|aborting due to|build failed' || true)"
  rm -f "${report}"
  echo "clippy findings: ${findings} (exit ${status}; report-only, non-blocking for release)"
  return 0
}

run_runtime_phase() {
  # Build a fresh canonical runtime kit for this exact native host, then run workspace tests.
  # Debug tests resolve only the debug profile; cross-target publication remains a separate gate.
  export BESKID_RUNTIME_PREFIX="${BESKID_RUNTIME_PREFIX:-${CARGO_TARGET_DIR:-${ROOT}/compiler/target}/native-runtime-kit}"
  export BESKID_RUNTIME_KIT_PROFILE=debug
  run_bounded_phase "Native ABI-v5 runtime-kit staging and verification" "${BESKID_RUNTIME_KIT_TIMEOUT:-600}" \
    bash scripts/stage-native-runtime-kit.sh

  # The installed-prefix harnesses (the beskid_tests_release crate and beskid_tests_interop
  # interop::glue_owned) need a qualified installation prefix and refuse developer overrides;
  # the release cases run them against the installed prefix, so this source-tree run leaves them out.
  # The one glue_owned test that needs no prefix (the driver is denied from the build tree) runs
  # here by its exact name, and the gate fails unless exactly that one test ran and passed.
  run_build_tree_driver_denial
  # Tests run serially. Leave room for the measured full suite while retaining
  # a hard cap for a deadlocked lowering test.
  local test_timeout="${BESKID_TEST_TIMEOUT:-10800}"
  if [[ "${test_timeout}" == "0" ]]; then
    cargo test --workspace --exclude beskid_e2e_tests --exclude beskid_tests_release -- --test-threads=1 --skip interop::glue_owned::
    return
  fi

  set +e
  timeout --kill-after=60s "${test_timeout}" \
    cargo test --workspace --exclude beskid_e2e_tests --exclude beskid_tests_release -- --test-threads=1 --skip interop::glue_owned::
  local status=$?
  set -e
  if [[ "${status}" -eq 124 ]]; then
    echo "::error::Workspace tests exceeded ${test_timeout}s hard cap; a test is hung or looping. Failing fast instead of burning the job timeout." >&2
  fi
  return "${status}"
}

run_build_tree_driver_denial() {
  local report status
  report="$(mktemp "${TMPDIR:-/tmp}/beskid-driver-denial.XXXXXX")"
  set +e
  run_bounded_phase "Glue driver denial from the build tree" "${BESKID_DRIVER_DENIAL_TIMEOUT:-1800}" \
    cargo test -p beskid_tests_interop --lib -- --exact interop::glue_owned::v06_glue_driver_denied_from_build_tree \
    2>&1 | tee "${report}"
  status="${PIPESTATUS[0]}"
  set -e
  if [[ "${status}" -eq 0 ]] && ! grep -Eq '^test result: ok\. 1 passed; 0 failed' "${report}"; then
    echo "::error::the build-tree Glue driver denial test did not run exactly once" >&2
    status=1
  fi
  rm -f "${report}"
  return "${status}"
}

run_proof_selftest_phase() {
  # The stability-proof harness scripts (ICE sweep, onboarding check) have Python unit tests that
  # otherwise run only by hand; a broken harness would silently pass the proof gate.
  run_bounded_phase "Proof harness self-test" "${BESKID_PROOF_SELFTEST_TIMEOUT:-300}" \
    python3 -I scripts/proof/test-proof-common.py
}

run_runtime_kit_phase() {
  # Keep the platform lane focused on runtime-kit staging and verification.
  export BESKID_RUNTIME_PREFIX="${BESKID_RUNTIME_PREFIX:-${CARGO_TARGET_DIR:-${ROOT}/compiler/target}/native-runtime-kit}"
  export BESKID_RUNTIME_KIT_PROFILE=debug
  run_bounded_phase "Native ABI-v5 runtime-kit staging and verification" "${BESKID_RUNTIME_KIT_TIMEOUT:-600}" \
    bash scripts/stage-native-runtime-kit.sh
}

case "${gate_phase}" in
  all)
    run_lint_phase
    run_proof_selftest_phase
    run_runtime_phase
    ;;
  lint)
    run_lint_phase
    ;;
  runtime)
    run_proof_selftest_phase
    run_runtime_phase
    ;;
  proof-selftest)
    run_proof_selftest_phase
    ;;
  runtime-kit)
    run_runtime_kit_phase
    ;;
  *)
    echo "unsupported compiler Rust gate phase: ${gate_phase}" >&2
    exit 2
    ;;
esac
