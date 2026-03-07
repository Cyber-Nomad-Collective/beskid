# M5 — Diagnostics Hardening + JIT/AOT Parity

## Goal
Harden diagnostics and guarantee parity across backends for newly introduced semantics.

## Current grounded status
- Existing parity tests focus on builtins/runtime symbol paths:
  - `crates/beskid_tests/src/runtime/parity.rs`
- Existing codegen lowering tests cover loops/methods/basic control flow:
  - `crates/beskid_tests/src/codegen/lowering.rs`
- Diagnostic taxonomy is centralized and extensible:
  - `crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
  - `crates/beskid_analysis/src/analysis/diagnostics.rs`

## Task list

### 1) Diagnostics completeness pass
- Add/normalize issue kinds for:
  - invalid `?` target
  - invalid iterable in `for in`
  - conformance declaration misuse
  - event declaration/usage violations
  - invalid identity equality domain
- Ensure codes, labels, messages, and help entries are consistent.
- Add span-focused negative tests.

### 2) Backend parity expansion
- Add parity scenarios for:
  - try propagation paths (`Ok`/`Error`)
  - generalized iterator loops and range fast path
  - contract-constrained dispatch outcomes
  - event subscribe/unsubscribe/dispatch
  - identity equality behavior
- Extend both:
  - `runtime/parity.rs`
  - `codegen/lowering.rs`

### 3) Regression matrix and CI confidence
- Build per-feature test matrix (parse -> syntax -> resolve -> type -> normalize -> codegen -> runtime parity).
- Ensure all milestone-introduced diagnostics have at least one asserting test.

## Acceptance criteria
- New semantics are covered by both unit/integration and parity-level tests.
- Diagnostic behavior is predictable and documented through tests.
- No backend-specific divergence for language-level behavior.

## Exit command set
- `cargo test -p beskid_tests --lib`
- Targeted suites for affected areas under parsing/analysis/codegen/runtime.
