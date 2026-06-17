---
title: Error handling
description: Representing and propagating failures (`Result`, `try`, unwinding
  policy). Runtime lowering shares the ABI error envelope described in
  Execution.
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

## Error propagation flow

```mermaid
flowchart LR
  expr[expr with Result enum]
  tryOp[postfix ? operator]
  ok[unwrap success value]
  err[return / translate Err]
  expr --> tryOp
  tryOp -->|Ok variant| ok
  tryOp -->|Err variant| err
  ffi[FFI boundary] --> envelope[interop error envelope]
  err -.->|no silent throw| ffi
```

## Normative specification

### Scope

Defines how **recoverable failures** are represented and propagated in user code. ABI envelopes and unwind across FFI are in interop and execution chapters.

### `Result`, `Option<T>`, and enums

- Recoverable errors **should** use **`Core.Results.Result<TValue, TError>`** from corelib when the project links **Std** (prelude exposes `Core.Results`).
- In **App** projects with implicit **Std**, the assembly module path is **`Std::Core::Results`** (source may write ``Std.Core.Results.Result<i32, string>``); inside corelib shards the path remains ``Core.Results.Result<_, _>``.
- There is **no** built-in `Result<T,E>` type alias in v0.1 grammar; use the corelib generic enum with explicit type arguments.
- Projects **must not** define a second bare `enum Result` in the same scope as Std; use the corelib type or a distinct name.
- **Absence of value** (not failure) **must** use `Option<T>`, not `null` or sentinel pointers (**must** align with [Types](/platform-spec/language-meta/type-system/types/)).

### `try` postfix operator

- Postfix `expr?` (`TryOperator`) **must** apply only where the surrounding function or lambda declares a compatible error propagation target.
- Operand type **must** be a `Result`-shaped enum (typically ``Core.Results.Result<_, _>`` with `Ok` / `Error` variants); otherwise **invalid try target** (**E12xx** family in reference compiler).
- Successful path **must** unwrap the success payload type into the expression context; failure path **must** return or translate to the enclosing error type.
- Lowering **must** desugar `?` using the **resolved scrutinee enum** (variant names from that enum), not hard-coded identifier strings.
- **Analyze**, **compile** (`run` / `build`), and **LSP** **must** share the same typed-HIR spine: resolve, normalize (including `?` desugar), re-resolve, then type-check.

### Static rules

- `try` **must not** appear on non-enum/non-result expressions.
- Panic or abort semantics **are not** language keywords in v0.1; unrecoverable failures use host/runtime policies.

### Dynamic semantics

- Error propagation **must not** implicitly allocate; lowering rewrites `?` to branch sequences.
- FFI boundaries **must** map errors per [Interop contracts](/platform-spec/language-meta/interop/interop-contracts/) — no silent cross-language exceptions unless documented.

### Diagnostics

**InvalidTryTarget** and type mismatch on unwrap paths. Registry: [Diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/).

### Conformance

Programs using `?` **must** compile only when propagation types align; reference tests cover try lowering.

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Error handling - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Error handling - Design model](./articles/design-model/)
- [Error handling - Examples](./articles/examples/)
- [Error handling - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Error handling - Flow and algorithm](./articles/flow-and-algorithm/)
- [Error handling - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
