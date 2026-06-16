---
title: Design model
description: Core.Text.Parser module layout.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-10
---

## Module layout

`Core.Text.Parser` is a hub module that re-exports a combinator subdirectory tree under `Core/Text/Parser/`. Each submodule owns one combinator family; the hub preserves thin backward-compat aliases for pre-refactor call sites.

| Module | Role |
| --- | --- |
| **`Core.Text.Parser`** | Public API hub; re-exports submodules and legacy aliases |
| **`Core.Text.Parser.Result`** | `ParseErrorKind`, `ParseError`, `TextParseResult<T>`, `IsOk`, `RestOnOk` |
| **`Core.Text.Parser.Context`** | `ParseContext`, `WithWhiteSpaceParser` |
| **`Core.Text.Parser.Literals`** | Character and text primitives: `Text`, `Char`, `Any`, `Eof`, `Fail`, `Satisfy` |
| **`Core.Text.Parser.Terms`** | Term-level helpers: `WhiteSpace`, `NonWhiteSpace` |
| **`Core.Text.Parser.Combine`** | Sequential and alternative composition: `Or`, `And`, `AndSkip`, `SkipAnd` |
| **`Core.Text.Parser.Cardinality`** | Repeat and negation: `ZeroOrOne`, `ZeroOrMany`, `OneOrMany`, `Not` |
| **`Core.Text.Parser.Coordination`** | Delimited and separated forms: `Between`, `Separated` |
| **`Core.Text.Parser.Flow`** | Post-parse wiring: `Then`, `Discard`, `Always`, `Pure` |

On-disk layout mirrors module paths: `src/Core/Text/Parser/{Result,Context,Literals,...}.bd` with **PascalCase** stems per [code style and naming](/platform-spec/language-meta/program-structure/code-style-and-naming/).

## Combinator catalog

Public combinator callables **must** use **PascalCase** (types, functions, and type methods). Parameters and locals **must** use **camelCase**.

| Combinator | Module | v1 |
| --- | --- | --- |
| `Text` | `Literals` | P0 |
| `Char` | `Literals` | P0 |
| `Any` | `Literals` | P0 |
| `Eof` | `Literals` | P0 |
| `Fail` | `Literals` | P0 |
| `Satisfy` | `Literals` | P0 |
| `WhiteSpace` | `Terms` | P0 |
| `NonWhiteSpace` | `Terms` | P0 |
| `Or` | `Combine` | P0 |
| `And` | `Combine` | P0 |
| `AndSkip` | `Combine` | P1 |
| `SkipAnd` | `Combine` | P1 |
| `ZeroOrOne` | `Cardinality` | P0 |
| `ZeroOrMany` | `Cardinality` | P0 |
| `OneOrMany` | `Cardinality` | P0 |
| `Not` | `Cardinality` | P1 |
| `Between` | `Coordination` | P1 |
| `Separated` | `Coordination` | P1 |
| `Then` | `Flow` | P0 |
| `Discard` | `Flow` | P0 |
| `Always` | `Flow` | P0 |
| `Pure` | `Flow` | P0 |

## Hub backward-compat aliases

The hub **may** expose thin wrappers so existing imports compile without path churn. New code **should** import the submodule directly.

| Hub alias | Canonical target | Notes |
| --- | --- | --- |
| `Literal` | `Literals.Text` | Deprecated spelling; prefer `Literals.Text` |
| `Choice2` | `Combine.Or` | Two-branch `Or`; prefer `Combine.Or` |
| `Satisfy` | `Literals.Any` | Deprecated spelling; prefer `Literals.Any` |
| `Fail` | `Literals.Fail` | Unchanged (already PascalCase) |
| `Pure` | `Flow.Pure` | Unchanged |
| `IsOk` | `Result.IsOk` | Unchanged |
| `RestOnOk` | `Result.RestOnOk` | Unchanged |

## Implementation anchors

- Hub: `compiler/corelib/packages/foundation/src/Core/Text/Parser.bd`
- Submodules: `compiler/corelib/packages/foundation/src/Core/Text/Parser/`
