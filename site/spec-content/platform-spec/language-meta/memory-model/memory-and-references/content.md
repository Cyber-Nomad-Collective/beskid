---
title: Memory and references
description: Locals, mut bindings, heap objects under a concurrent GC, and fiber
  sharing rules. Runtime write barriers and collector phases defer to execution
  specs; /execution/ is a non-normative legacy bridge.
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

Defines **local storage**, **`mut` bindings**, **GC-managed heap objects**, **arrays**, and **cross-fiber sharing** at the language level. Collector algorithms and write barriers **must** match execution platform-spec; the `/execution/` doc tree is informative only.

### Locals and assignment

- Locals live in function activation records unless captured by closures (see [Lambdas and closures](/platform-spec/language-meta/evaluation/lambdas-and-closures/)).
- Assignment to immutable bindings **must** error (**E1214**).
- `mut` **must** appear as a **prefix modifier** before the type or after `let` to allow reassignment:
  - Typed locals: `mut T name = expr` (for example `mut i64 acc = 0`).
  - Inferred locals: `let mut name = expr`.
  - Parameters: `mut T name` (for example `fn f(mut u8[] buf)`).
- Legacy suffix form `T mut name` **must** be rejected by the parser.

### Parameter passing

- Parameters are passed **by value** in v0.1. Callees that must update caller-visible state **must** return values or use heap/`T[]` handles per the array ABI.
- `ref` and `out` parameter modifiers are **not** part of v0.1.

### Arrays

- `T[]` values use the fat-pointer layout (`BeskidArray`) described in execution ABI material.
- Element access **must** respect bounds checks in safe builds (lowering inserts checks unless proven).

### Heap and garbage collection

- Reference-bearing values that escape their defining frame **must** live on the **GC heap** traced by the runtime collector (concurrent tri-color mark-sweep in the reference implementation).
- User code **must not** expose manual `free` or untracked pointers in v0.1.
- Pointer stores to heap objects **must** execute **write barriers** when required by the active GC phase (see execution memory contracts).
- `null` **must not** appear as a value; optional absence uses `Option<T>` per [Types](/platform-spec/language-meta/type-system/types/).

### Fibers and sharing

- Values **must not** be shared across fibers by alias unless immutability is proven or synchronization uses `Channel<T>` per [Fibers and spawn](/platform-spec/language-meta/evaluation/fibers-and-spawn/).
- Capturing mutable shared state in `spawn` closures **should** be rejected when detectable.

### Dynamic semantics

- Stack frames are tied to call/return; `return` ends the frame and invalidates temporaries.
- Closure environments **must** outlive uses tracked by the compiler’s capture analysis.

### Diagnostics

Immutability **E1214**; member access **E1211–E1213**. Registry: [Diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/).

### Conformance

Memory rules enforced in `beskid_analysis` **must** be preserved in codegen for **L3** claims.

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Memory and references - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Memory and references - Design model](./articles/design-model/)
- [Memory and references - Examples](./articles/examples/)
- [Memory and references - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Memory and references - Flow and algorithm](./articles/flow-and-algorithm/)
- [Memory and references - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
