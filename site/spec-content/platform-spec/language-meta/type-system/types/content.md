---
title: Types
description: The type grammar (nominal types, generics, Option T) is the
  backbone of static checking. All analysis phases share these definitions.
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

Defines the **type grammar**, **nominal type declarations**, and static rules shared by resolution, type checking, and lowering. Expression typing is completed in [Type inference](/platform-spec/language-meta/type-system/type-inference/); dispatch in [Method dispatch](/platform-spec/language-meta/type-system/method-dispatch/).

### Type expressions

A **type expression** (`BeskidType`) **must** be exactly one of:

| Form | Syntax | Meaning |
| --- | --- | --- |
| Primitive | `bool`, `i32`, `i64`, `u8`, `f64`, `char`, `string`, `unit` | Builtin scalar types |
| Named | `Path` with optional `GenericArguments` | Nominal reference to `type`, `enum`, or generic parameter |
| Array | `T[]` | Homogeneous slice-like sequence; runtime ABI uses fat pointer layout |
| Function | `T(params)` or `(params) => R` | Function types for values and signatures |

Primitives **must** map to `HirPrimitiveType` variants in the reference compiler.

### Type declarations

- `type Name<G…> : Contracts… { members }` introduces a nominal record-like type.
- **Members** **may** be:
  - value fields (`T name`), `event` fields (see [Events](/platform-spec/language-meta/evaluation/events/)), or `inject` fields (composition only);
  - methods (`pub R Name(params) { body }`) with implicit receiver access to the type's fields (see [Method dispatch](/platform-spec/language-meta/type-system/method-dispatch/)).
- Inline methods in the owning type body **may** access all fields (public and private) of that type.
- **Conformance list** (`: I, J`) declares contract implementations checked in [Contracts](/platform-spec/language-meta/contracts-and-effects/contracts/).
- `enum` declarations are specified in [Enums and match](/platform-spec/language-meta/type-system/enums-and-match/).
- `extend type` adds members **externally** to a type defined elsewhere per [extend type](/platform-spec/language-meta/program-structure/extend-type/). Use inline methods when the behavior belongs with the type definition; use `extend type` for cross-module extension or generated contributions.

### Static rules

- Duplicate type or member names in the same scope **must** error (**E1001**, **E1006**).
- Unknown types in definitions **must** error (**E1005**, **E1201**).
- Generic arity **must** match at use sites (**E1203**, **E1204**).
- `unit` is the statement-result type; `never` is the bottom type for non-returning calls.
- There is **no** `null` literal and **no** nullable reference type (`?T`, `T?`, or `optional` keyword) in v0.1.
- Optional presence **must** use `Option<T>` (`Query.Contracts.Option` in corelib) or an explicit `enum` with a dedicated absent variant at API boundaries.
### Dynamic semantics

Types describe compile-time properties; runtime representation is defined by lowering and execution ABI. Array values **must** use the `BeskidArray` layout documented in execution ABI material.

### Diagnostics

Type band **E12xx** (unknown type, mismatch, missing annotation, member access). Registry: [Diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/).

### Conformance

**L2** conforming implementations **must** reject programs with unknown types, arity mismatches, and invalid field access per the reference `beskid_analysis` type tests.

## Decisions

- **D-LM-TYP-001 — Nominal types:** Beskid uses nominal, path-resolved types; structural equivalence is not user-definable in v0.1.
- **D-LM-TYP-002 — `Option<T>` only:** Optional values use `Option<T>` or explicit enums; `null` and `optional` keyword are forbidden.
- **D-LM-TYP-003 — `T[]` fat pointer:** Array types share one runtime representation across targets unless a profile documents otherwise.
- **D-LM-TYP-004 — Single type system:** No parallel reference/value kinds in v0.1; parameters pass by value unless documented heap handles apply.
- **D-LM-TYP-005 — Inline type methods:** Methods **may** appear in the owning `type` body; they share the type's scope for field access. `extend type` remains the extension mechanism for types defined elsewhere.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/types/` — type declaration, nominal resolution, and `BeskidArray` layout
- `compiler/crates/beskid_analysis/src/hir/` — HIR type representations consumed by lowering
- `compiler/crates/beskid_codegen/src/` — type lowering to Cranelift IR

## Platform view

The type grammar (nominal types, generics, `Option<T>`) is the backbone of static checking. All analysis phases share these definitions.
