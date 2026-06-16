---
title: Types - Contracts and edge cases
description: Normative contracts, edge cases, and invariants for the Beskid type system.
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

- **Nominal types only** — Structural equivalence is not user-definable in v0.1.
- **No `null`** — `null` literal and nullable reference types (`?T`, `T?`) are forbidden.
- **Option for absence** — `Option<T>` (corelib) or explicit enums with absent variants must model optional values.
- **Single type system** — `ref` is a passing mode, not a second class of types.
- **Fat-pointer arrays** — `T[]` shares one runtime representation per target.

## Diagnostic band E12xx

Reserved for type system diagnostics in `diagnostic_kinds.rs`:

| Code | Condition |
| --- | --- |
| **E1201** | Unknown type in expression or signature |
| **E1202** | Missing type annotation where inference fails |
| **E1203** | Missing generic type arguments |
| **E1204** | Generic argument arity mismatch |
| **E1205** | Call argument type mismatch |
| **E1206** | General type mismatch |
| **E1207** | Return type mismatch |
| **E1208** | Non-bool condition |
| **E1209** | Invalid binary operation |
| **E1210** | Invalid unary operation |
| **E1211** | Unknown struct field |
| **E1212** | Missing struct field in literal |
| **E1213** | Invalid member access target |
| **E1214** | Assignment to immutable binding |
| **E1215** | Non-iterable `for` target |

## Edge cases

- **Duplicate type names** — Same-scope `type Foo` and `enum Foo` collide with **E1006**.
- **Generic shadowing** — A generic parameter `T` on a type shadows an outer type named `T` within that type's scope only.
- **Self-referential types** — Direct recursive type definitions (for example `type Node { Node next; }`) are allowed; the compiler handles them through HIR lowering.
- **Empty structs** — `type Empty { }` is valid; it has size determined by the codegen backend.

## Invariants

- Every expression node in HIR must have a resolved type after `type_checking.rs` runs.
- `unit` is the statement-result type; functions without explicit return type default to `unit`.
- `never` is the bottom type for non-returning calls (for example `panic`).
