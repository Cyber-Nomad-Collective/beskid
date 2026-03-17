# M5 — Diagnostics Hardening + JIT/AOT Parity

## Goal
Harden diagnostics and guarantee parity across backends for newly introduced semantics.

## Execution constraints (normative)
- Run tests sequentially only (no parallel cargo invocations).
- Prefer minimal, upstream fixes over broad downstream workarounds.
- Keep each patch slice narrowly scoped (diagnostics vs backend parity vs tests).
- Do not refactor unrelated modules while closing M5 gaps.

## Current grounded status
- Existing parity tests focus on builtins/runtime symbol paths:
  - `crates/beskid_tests/src/runtime/parity.rs`
- Existing codegen lowering tests cover loops/methods/basic control flow:
  - `crates/beskid_tests/src/codegen/lowering.rs`
- Diagnostic taxonomy is centralized and extensible:
  - `crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
  - `crates/beskid_analysis/src/analysis/diagnostics.rs`

## Gap register (tracked)

### G1 — invalid `?` target
- Status: closed.
- Gap: dedicated type error/issue kind/test matrix must fully enforce `Result`-only try target behavior and stable contract.

### G2 — conformance declaration misuse
- Status: closed.
- Gap: resolver must reject non-contract conformance targets with dedicated issue kind and pipeline-level assertion.

### G3 — event misuse diagnostics completeness
- Status: closed.
- Gap: event misuse variants exist, but full diagnostics + parity stress coverage still needs closure.

### G4 — backend parity expansion
- Status: closed.
- Gap: parity scenarios added for contracts/events/identity/range/try need full stabilization; currently known AOT event path exposes missing runtime symbol (`event_len`) during object build.

### G5 — lowering-level parity assertions
- Status: closed.
- Gap: `codegen/lowering.rs` needs explicit assertions for newly covered semantics so regressions are caught pre-runtime.

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

#### 1.1 Try target diagnostics closure
- Files:
  - `crates/beskid_analysis/src/types/context/context.rs`
  - `crates/beskid_analysis/src/types/context/expressions.rs`
  - `crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
  - `crates/beskid_analysis/src/analysis/rules/types.rs`
  - `crates/beskid_tests/src/analysis/types.rs`
  - `crates/beskid_tests/src/analysis/diagnostics.rs`
- Actions:
  - Keep one dedicated `TypeError` for invalid try targets.
  - Ensure mapping emits one stable semantic issue code/label/message/help.
  - Add positive + negative typing tests for `Result` and non-`Result` targets.

#### 1.2 Conformance misuse diagnostics closure
- Files:
  - `crates/beskid_analysis/src/resolve/errors.rs`
  - `crates/beskid_analysis/src/resolve/resolver.rs`
  - `crates/beskid_analysis/src/analysis/rules/resolve.rs`
  - `crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
  - `crates/beskid_tests/src/analysis/resolve.rs`
  - `crates/beskid_tests/src/analysis/pipeline/core.rs`
  - `crates/beskid_tests/src/analysis/diagnostics.rs`
- Actions:
  - Reject non-contract conformance targets at resolve stage.
  - Emit dedicated issue kind and help text.
  - Assert diagnostic code through pipeline tests.

#### 1.3 Event misuse + identity domain completion
- Files:
  - `crates/beskid_analysis/src/types/context/expressions.rs`
  - `crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
  - `crates/beskid_analysis/src/analysis/rules/types.rs`
  - `crates/beskid_tests/src/analysis/types.rs`
  - `crates/beskid_tests/src/analysis/diagnostics.rs`
- Actions:
  - Ensure event misuse emits dedicated, non-generic diagnostics in all target paths.
  - Ensure identity equality rejects out-of-domain operands with stable diagnostics.

### 2) Backend parity expansion
- Add parity scenarios for:
  - try propagation paths (`Ok`/`Error`)
  - generalized iterator loops and range fast path
  - contract-constrained dispatch outcomes
  - event subscribe/unsubscribe/dispatch (`event Name(...)` / `event{N} Name(...)` forms)
  - identity equality behavior
- Extend both:
  - `runtime/parity.rs`
  - `codegen/lowering.rs`

#### 2.1 Runtime parity matrix
- Add/keep scenarios for:
  - try propagation behavior (`Ok` path + failure path validity)
  - generalized iterable loops and `range` fast path
  - contract dispatch outcome equivalence
  - event lifecycle for both `event Name(...)` and `event{N} Name(...)`
  - identity equality behavior

#### 2.2 Fix AOT event runtime symbol gap
- Files (expected):
  - `crates/beskid_runtime/src/interop.rs`
  - `crates/beskid_runtime/src/builtins.rs`
  - `crates/beskid_aot/*` symbol wiring if needed
  - `crates/beskid_codegen/*` event lowering call target wiring if needed
- Actions:
  - Trace exact symbol lookup path for event helpers used by AOT object build.
  - Wire missing event helper(s), including `event_len`, with minimal ABI-consistent fix.
  - Add regression parity test proving object build succeeds after fix.

#### 2.3 Codegen lowering assertions
- File:
  - `crates/beskid_tests/src/codegen/lowering.rs`
- Actions:
  - Add assertions for generated artifacts/call paths tied to try/iterable/contracts/events/identity.
  - Ensure lowering tests fail fast before runtime parity when metadata paths regress.

## Ordered execution plan (implementation sequence)
1. Finish diagnostics closure for G1/G2 first (low blast radius).
2. Complete event/identity diagnostics in analysis tests (G3).
3. Fix AOT event symbol gap (`event_len`) and stabilize runtime parity (G4).
4. Extend lowering assertions to lock backend behavior earlier in pipeline (G5).
5. Run full sequential validation and compare against acceptance matrix.

## Test gates (sequential)

### Gate A — diagnostics targeted
- `cargo test -p beskid_tests analysis::types::typing_rejects_invalid_try_target -- --nocapture`
- `cargo test -p beskid_tests analysis::resolve::non_contract_conformance_target_is_error -- --nocapture`
- `cargo test -p beskid_tests analysis::pipeline::core::analysis_emits_invalid_conformance_target_errors -- --nocapture`
- Event/identity-focused analysis diagnostics tests.

### Gate B — parity targeted
- Contract dispatch parity test.
- Event lifecycle parity tests (both declaration forms).
- Identity/range/try parity tests.

### Gate C — lowering targeted
- New `codegen/lowering.rs` targeted tests for M5 scenarios.

### Gate D — full regression
- `cargo test -p beskid_tests --lib`

## Acceptance criteria
- New semantics are covered by both unit/integration and parity-level tests.
- Diagnostic behavior is predictable and documented through tests.
- No backend-specific divergence for language-level behavior.

## Done checklist
- [x] G1 closed and test-backed.
- [x] G2 closed and test-backed.
- [x] G3 closed and test-backed.
- [x] G4 closed and test-backed.
- [x] G5 closed and test-backed.
- [x] Full sequential regression passes.

## Exit command set
- `cargo test -p beskid_tests --lib`
- Targeted suites for affected areas under parsing/analysis/codegen/runtime.
