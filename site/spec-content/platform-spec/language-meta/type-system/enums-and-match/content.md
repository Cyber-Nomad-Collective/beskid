---
title: Enums and match
description: Algebraic enums and exhaustive `match` tie data representation to
  control flow. Lowering must preserve discriminant layout described in
  Execution where relevant.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-06
---

## Normative specification

### Scope

Defines **`enum` declarations**, **constructors**, **`match` expressions**, and **patterns**. Type rules integrate with [Types](/platform-spec/language-meta/type-system/types/) and [Control flow](/platform-spec/language-meta/evaluation/control-flow/).

### Enum declarations

- **`enum Name<G…> { variants }`** introduces a nominal sum type.
- Variants **may** be nullary (`Ok`) or carry fields (`Err(message: string)`).
- Duplicate variant names **must** error (**E1002**).

### Constructors and use

- **Qualified** construction **`Enum.Variant`** or **`Enum.Variant(args)`** is required when the enum type is not inferred from context (**E1303** if unqualified where ambiguous).
- For **nullary** variants (no declared fields), parentheses **may** be omitted: **`Enum.Variant`** and **`Enum.Variant()`** are equivalent.
- For variants with fields, **`Enum.Variant(args)`** **must** include parentheses; constructor arity **must** match the variant field list (**E1302**, **E1307**).
- Enum types in expressions **must** resolve to a known enum (**E1301**).

### `match` expressions

- **`match scrutinee { arms }`** evaluates the scrutinee once, then selects the first arm whose **pattern** matches.
- Each arm **`pattern => expression`** **must** produce the same type; mismatches **must** error (**E1305**).
- **`when guard`** on an arm **must** be `bool` (**E1308**).
- Patterns **may** be wildcard `_`, literals, identifiers (bind), or `Enum.Variant(subpatterns)`.
- **Exhaustiveness:** For enum scrutinees, arms **must** cover all variants or include `_`; non-exhaustive matches **must** error (**E1304**).

### Dynamic semantics

- Matching **must** bind pattern variables in the arm expression scope only.
- No fall-through between arms; order is significant for overlapping patterns (overlap **should** be rejected when detectable).

### Diagnostics

Enum/match band **E1301–E1308**. See [Diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/).

### Conformance

**L2** implementations **must** agree with reference tests on arity, exhaustiveness, and arm typing.

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->
