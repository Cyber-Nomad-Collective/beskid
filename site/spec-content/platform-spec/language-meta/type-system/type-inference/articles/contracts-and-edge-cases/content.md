---
title: Type inference - Contracts and edge cases
description: Normative contracts, edge cases, and invariants for Beskid type inference.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Proposed
lastReviewed: 2026-06-16
---

## Hard requirements

- **Fail on ambiguity** — Prefer errors over guessing when multiple types satisfy constraints.
- **Public API annotations** — Exported functions should declare return types even when inference succeeds.
- **No nullable inference** — Inference must not introduce nullable or `optional` types; use `Option<T>` explicitly.
- **Contextual lambdas** — Untyped lambda parameters require an expected function type from the enclosing expression.

## Diagnostic band E12xx

| Code | Condition |
| --- | --- |
| **E1202** | Missing type annotation (ambiguous inference) |
| **E1203** | Missing generic type arguments |
| **E1206** | Type mismatch after inference |
| **W1203** | Implicit numeric cast detected |

## Edge cases

- **Enum constructor inference** — Enum constructors and struct literals must have sufficient context to resolve the target type or require explicit qualification.
- **Nested lambdas** — Inner lambdas may infer parameter types from the outer lambda's expected type.
- **Generic recursion** — Recursive generic calls may require explicit type arguments to break ambiguity.
- **Empty collections** — `[]` without context cannot infer element type; explicit annotation required.

## Invariants

- Every `let` binding must have a resolved type after `TypeChecker::finish` completes.
- Inference does not mutate HIR; solved types are recorded in `TypeResult.node_types` and `TypeResult.local_types`.
- Re-inference on incremental edits must produce the same result as full compilation for unchanged sites.
