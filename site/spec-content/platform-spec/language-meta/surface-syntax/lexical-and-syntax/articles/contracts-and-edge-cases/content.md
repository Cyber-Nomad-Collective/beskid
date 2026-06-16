---
title: Lexical and syntax - Contracts and edge cases
description: Normative contracts, edge cases, and invariants for Beskid lexical and syntax.
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

- **Pest as grammar source** — The checked-in pest file is the single syntactic truth.
- **`///` documentation** — Triple-slash doc lines attach only via `ItemWithDocs`; four-or-more slashes are never doc comments.
- **Reserved async/await** — Tokens exist for forward compatibility; semantic use is forbidden.

## Diagnostic band E11xx

| Code | Condition |
| --- | --- |
| **E1151** | Invalid HIR span |
| **E1152** | Unresolved HIR value path |
| **E1153** | Unresolved HIR type path |
| **E1154** | Non-normalized HIR control flow |

## Edge cases

- **Empty file** — A file with no items is valid; it produces an empty `Program`.
- **BOM** — UTF-8 BOM at file start is accepted and skipped.
- **Invalid escape** — Unrecognized string escapes are parse errors.
- **Unclosed string** — Missing closing quote is a parse error.
- **Keyword as identifier** — Reserved keywords cannot be used as identifiers unless escaped (not supported in v0.1).

## Invariants

- Lexical and syntactic validity does not imply semantic validity.
- Phases after parsing must reject programs that parse but violate module, type, or contract rules.
- A tool claiming L0 conformance must accept the same token stream as `beskid.pest`.
