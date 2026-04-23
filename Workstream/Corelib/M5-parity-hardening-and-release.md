# M5 — Parity Hardening + Release Readiness

## Goal
Stabilize corelib behavior, parity, and release criteria.

## Tasks
1. Add analysis/type/codegen/runtime parity tests for corelib APIs.
2. Validate JIT/AOT parity for corelib-backed behavior.
3. Add docs-sync gate: each implemented module maps to canonical doc contract.
4. Add compatibility notes for additive vs breaking changes.

## Acceptance
- Sequential test gates pass.
- No backend divergence for corelib semantics.
- Program-level done definition satisfied.
