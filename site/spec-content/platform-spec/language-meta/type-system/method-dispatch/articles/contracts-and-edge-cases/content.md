---
title: Method dispatch - Contracts and edge cases
description: Normative contracts, edge cases, and invariants for Beskid method dispatch.
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

- **Static dispatch default** — v0.1 uses compile-time member selection; dynamic polymorphism is deferred.
- **Receiver static type** — Dispatch keys off the static type of the receiver expression, not runtime tags.
- **No `null` receiver** — Calls on possibly-absent values must use `Option<T>` and `match`, not null checks.
- **extend over impl** — `extend type` is the normative extension syntax; `impl` remains parse-compatible during migration.

## Diagnostic bands

| Code | Condition |
| --- | --- |
| **E1101** | Unknown value (includes unresolved method) |
| **E1107** | Private item access |
| **E1204** | Call arity mismatch |
| **E1205** | Call argument type mismatch |
| **E1213** | Invalid member access target |
| **E1511** | `extend type` private member access |

## Edge cases

- **Ambiguous overloads** — When two methods have the same name and compatible signatures, the compiler emits an error rather than picking one.
- **Receiver type unknown** — If the receiver type cannot be resolved, member lookup is skipped and **E1201** is emitted.
- **Contract method vs type method** — When a contract and a type both define the same method name, the type method wins for instance calls; contract namespace calls require explicit qualification.
- **Generic method on generic type** — `Type<T>.method<U>()` requires both type and method generic arguments to be resolved.

## Invariants

- Every member call in HIR must resolve to a single callable target after dispatch.
- `extend type` methods must obey the same visibility rules as declared methods.
- Codegen must preserve the statically selected symbol through lowering.
