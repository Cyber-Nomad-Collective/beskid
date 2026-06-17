---
title: Method dispatch
description: Virtual dispatch, overload resolution, and receiver rules decide
  which code runs. Interop and codegen consume the same dispatch table model.
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

Defines how **member access** (`receiver.method(args)`) and **free functions** resolve to callable targets. Type shapes come from [Types](/platform-spec/language-meta/type-system/types/); symbols from [Name resolution](/platform-spec/language-meta/program-structure/name-resolution/).

### Receivers and members

- **Instance calls** use postfix `.Identifier` after a **primary** expression that denotes a value type.
- The receiver’s **static type** **must** expose a callable member with matching name and signature, or the call **must** error (**E1101**, **E1213**).
- **`extend type`** members participate in the member set of the extended type with the same visibility rules as declared members.

### Overload resolution (v0.1)

- Overloading **must** be resolved by arity and argument types at the call site; there is no ad hoc ranking beyond signature match.
- Ambiguous overload sets **must** error rather than pick a candidate.
- **Contracts** used as namespaces (`Contract.method()`) follow resolver fallback for contract-as-namespace calls.

### `impl` blocks

- Legacy **`impl Receiver { … }`** blocks **may** still parse; new code **should** use **`extend type`** per [extend type](/platform-spec/language-meta/program-structure/extend-type/).
- Methods in `impl` / `extend type` **must** obey visibility and access rules of the target type.

### Dynamic semantics

- Dispatch is **static** in v0.1: the callee is known at compile time from the receiver’s static type (no virtual table polymorphism for user classes unless introduced by a future decision).
- Interop thunks **must** preserve the statically selected symbol through lowering.

### Diagnostics

Resolution **E1101**; type/call **E1204–E1205**; invalid member **E1213**. Registry: [Diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/).

### Conformance

Call resolution tests in `beskid_analysis` **must** pass for **L2** claims.

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Method dispatch - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Method dispatch - Design model](./articles/design-model/)
- [Method dispatch - Examples](./articles/examples/)
- [Method dispatch - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Method dispatch - Flow and algorithm](./articles/flow-and-algorithm/)
- [Method dispatch - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
