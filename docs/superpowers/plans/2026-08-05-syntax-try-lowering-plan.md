# Syntax Try Lowering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lower `TryExpression` through generation-bound syntax/Salsa facts and verified ISLE without an HIR fallback.

**Architecture:** Queries prove a Result operand and compatible enclosing Result return. The ISLE adapter consumes that fact to branch on the canonical enum layout, yielding an Ok payload or returning the matching Err value. Every unresolved, stale, foreign, non-Result, or incompatible-return source fails closed before CLIF.

**Tech Stack:** Rust 2024, Salsa 0.26, expanded syntax, generated Cranelift ISLE.

## Global Constraints

- Production remains `TypedProgram` → `CodegenInput` → generated ISLE → verified CLIF.
- No HIR, `Lowerable`, legacy codegen, dynamic dispatch, or fabricated Result values.
- `CodeStringLiteral`, iterator `for`, and standalone ranges keep their explicit 0.4 rejection behavior.

---

### Task 1: Add the syntax Try fact

**Files:** `compiler/crates/beskid_queries/src/semantic_contract.rs`, `compiler/crates/beskid_queries/src/lib.rs`, `compiler/crates/beskid_queries/tests/semantic_facts.rs`.

- [ ] Write `try_expression_fact_resolves_result_payload_and_enclosing_error_return` using `Result<i32, Error> Main(Result<i32, Error> value) { return try value; }`; assert hand-derived `i32` payload and `Error` return compatibility.
- [ ] Run `CARGO_TARGET_DIR="$PWD/compiler/target" RUSTC_WRAPPER= cargo test -p beskid_queries --test semantic_facts try_expression_fact_resolves_result_payload_and_enclosing_error_return -- --exact`; it must initially fail because no Try fact exists.
- [ ] Define `TryExpressionFact { expression, operand, payload_type, error_type, enclosing_return }` and one tracked, registered query. Resolve only direct syntax children, Result variants, and the enclosing syntax item; return `SemanticError::unavailable("try_expression")` otherwise.
- [ ] Re-run that test, then `cargo test -p beskid_queries --tests -- --test-threads=1`; both must pass.
- [ ] Commit only the fact and regression: `feat(queries): resolve syntax try facts`.

### Task 2: Add the generated ISLE lowering

**Files:** `compiler/crates/beskid_codegen/src/isle_adapter/facts_node.rs`, `compiler/crates/beskid_isle/src/lib.rs`, `compiler/crates/beskid_isle/isle/expressions.isle`, `compiler/crates/beskid_codegen/tests/isle_adapter.rs`.

- [ ] Write `parsed_result_try_lowers_to_verified_syntax_isle_control_flow`, invoking `emit_isle_item` on the Task 1 source and asserting verified CLIF contains a branch.
- [ ] Run its exact test; it must initially fail with `MissingRuleOrFact` at `TryExpression`.
- [ ] Expose the Task 1 fact through one `NodeFacts` method. Add `emit_try_expression` and the one `(node_kind (NodeKind.TryExpression))` rule. The constructor uses existing enum layout and match emission helpers only, returning a span-bearing lowering error when facts are absent.
- [ ] Re-run the exact test and prove it passes without an import or runtime call.
- [ ] Commit only this lowering/regression: `feat(isle): lower proven syntax try expressions`.

### Task 3: Prove fail-closed boundaries and record evidence

**Files:** `compiler/crates/beskid_queries/tests/semantic_facts.rs`, `compiler/crates/beskid_codegen/tests/isle_adapter.rs`, `compiler/CHANGELOG.md`, `openspec/changes/hir-free-isle-abi-v5-native-runtime/tasks.md`.

- [ ] Add and first run real-source regressions for non-Result Try, incompatible enclosing return, and stale generation; each asserts unavailable before CLIF.
- [ ] Run `cargo test -p beskid_queries --tests -- --test-threads=1` and `cargo test -p beskid_codegen --test isle_adapter`.
- [ ] Add a changelog/task-ledger entry only when the commands pass, then commit `docs: record syntax try lowering evidence`.
