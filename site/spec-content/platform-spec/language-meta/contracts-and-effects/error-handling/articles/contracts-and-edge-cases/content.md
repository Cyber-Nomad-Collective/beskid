---
title: Error handling - Contracts and edge cases
description: Normative contracts, edge cases, and invariants for Beskid error handling.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Proposed
lastReviewed: 2026-06-05
---

## Hard requirements

- **Enum-first errors** — Explicit sum types over magic result types.
- **No exceptions keyword** — Cross-language unwinding is interop-scoped, not a Beskid `throw` statement.
- **`Option` vs `Result`** — `Option<T>` models missing data; `Result`-shaped enums model failures.
- **Postfix `?` only** — No `try` statement form in v0.1.

## Diagnostic band

| Code | Condition |
| --- | --- |
| **E1222** | Invalid try target (not a Result-shaped enum) |

## Edge cases

- **Nested `?`** — `expr?.field?` is valid if both operands are Result-shaped; each `?` desugars independently.
- **`?` in lambda** — The failure path returns from the lambda, not the enclosing function.
- **`?` without enclosing return type** — If the surrounding function does not declare a compatible error type, the desugared `return` may fail type checking.
- **Non-Result enums** — A user-defined enum with `Ok`/`Error` variants is accepted as a try target if it matches the expected shape.

## Invariants

- `?` lowering must not implicitly allocate; it rewrites to branch sequences.
- FFI boundaries must map errors per interop contracts — no silent cross-language exceptions.
- Analyze, compile, and LSP must share the same typed-HIR spine.
