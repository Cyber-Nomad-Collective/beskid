---
title: Control flow
description: Conditionals, loops, and structured control transfer. Lowering to
  HIR/CLIF follows the evaluation order defined here.
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

Defines **statement-level control flow** and structured transfer. Expression-level `match` is in [Enums and match](/platform-spec/language-meta/type-system/enums-and-match/).

### Statements

| Construct | Rule |
| --- | --- |
| **`if (cond) block else block`** | `cond` **must** be `bool` (**non-bool condition** diagnostic) |
| **`while (cond) block`** | `cond` **must** be `bool`; body may loop |
| **`for id in expr block`** | `expr` **must** be iterable per type rules (v0.1: range and array-like forms as implemented) |
| **`return expr?;`** | Returns from the innermost function; `expr` **must** match return type when present |
| **`break;` / `continue;`** | **Must** appear inside a loop; otherwise **E1401** / **E1402** |
| **`let` / typed `let`** | Introduces locals; see [Type inference](/platform-spec/language-meta/type-system/type-inference/) |

### Evaluation order

- Function arguments **must** be evaluated left to right before the call.
- Binary operators **must** evaluate left operand before right for `&&` and `||` with short-circuit semantics.
- Assignment **must** evaluate the right-hand side before storing.

### Static rules

- Unreachable code after unconditional transfer **may** warn (**W1403**).
- HIR lowering **must** normalize control flow graphs (**E1154** if non-normalized).

### Dynamic semantics

- `if` and `while` execute the taken branch block sequentially.
- `break` exits the innermost `while`/`for`; `continue` jumps to the next iteration.

### Diagnostics

Control band **E1401–E1403**; bool condition errors in type band. Registry: [Diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/).

### Conformance

**L3** semantic tests for break/continue and return paths **must** pass.

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Control flow - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Control flow - Design model](./articles/design-model/)
- [Control flow - Examples](./articles/examples/)
- [Control flow - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Control flow - Flow and algorithm](./articles/flow-and-algorithm/)
- [Control flow - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
