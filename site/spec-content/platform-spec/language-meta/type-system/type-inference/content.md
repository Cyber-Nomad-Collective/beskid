---
title: Type inference
description: Local type inference reduces annotation burden while keeping
  programs predictable. The inference algorithm is specified here; diagnostics
  reference these rules.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-21
---

## Normative specification

### Scope

Defines when types **must** be written explicitly and when the compiler **may** infer types from context. Ground rules for type expressions are in [Types](/platform-spec/language-meta/type-system/types/).

### Inference sites

- **`let name = expr`** (inferred let) **must** infer the variable type from `expr` when unambiguous.
- **`let T name = expr`** (typed let) **must** check `expr` against `T`; no inference of `T` from the initializer alone.
- **Function return types** on top-level functions **should** be explicit; when omitted, inference **may** use body yield rules; explicit annotation is **recommended** for public APIs.
- **Generic arguments** at call sites **may** be inferred from parameter types when a unique solution exists (**E1203** when missing).
- **Lambda** parameter types **may** be inferred from expected function type; untyped lambda parameters require contextual type (**E1202** when missing).

### Static rules

- Inference **must not** widen beyond the declared or inferred constraint (no implicit numeric promotion across unrelated primitives in v0.1).
- Ambiguous inference **must** error with **E1202** (missing annotation) rather than pick an arbitrary type.
- **Enum constructors** and **struct literals** **must** have sufficient context to resolve the target type or require explicit qualification.

### Dynamic semantics

Inference affects compile-time only; no runtime reflection of inferred types beyond debug metadata.

### Diagnostics

**E1202** missing annotation; **E1206** mismatch after inference. Registry: [Diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/).

### Conformance

Reference compiler tests for `let` inference and generic call inference **must** pass for **L2** claims.

## Decisions

- **D-LM-INF-001 — Fail on ambiguity:** Prefer errors over guessing when multiple types satisfy constraints.
- **D-LM-INF-002 — Public API annotations:** Exported functions **should** declare return types even when inference succeeds.
- **D-LM-INF-003 — No nullable inference:** Inference **must not** introduce nullable or `optional` types; use `Option<T>` explicitly.
- **D-LM-INF-004 — Contextual lambdas:** Untyped lambda parameters require an expected function type from the enclosing expression.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/types/` — type inference engine and constraint solving
- `compiler/crates/beskid_analysis/src/analysis/` — diagnostic emission for inference failures (E1202, E1206)

## Platform view

Local type inference reduces annotation burden while keeping programs predictable. The inference algorithm is specified here; diagnostics reference these rules.
