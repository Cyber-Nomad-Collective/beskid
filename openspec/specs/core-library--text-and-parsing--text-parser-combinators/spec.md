<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Core.Text.Parser Specification

## Purpose

This capability preserves and governs the migrated Beskid standard contract for Core.Text.Parser, including its legacy provenance and review status.

## Requirements

### Requirement: Combinator runtime contracts: Decision [D-CORE-TEXT-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | ID | Rule |
> | --- | --- |
> | **D-CORE-TEXT-0002** | Backtracking **must** occur only at `Choice` boundaries; no unbounded memoization in v1. |
> | **D-CORE-TEXT-0003** | `Many`/`Many1` on a zero-width parser **must** error at runtime or be rejected at codegen. |
> | **D-CORE-TEXT-0004** | Regex and generated parsers **must** enforce a default 1 MiB input cap. |
> | **D-CORE-TEXT-0005** | Generated parsers **must** attach Pest rule names to `ParseResult::Err`. |

**Stable ID:** `BSP-REQ-B4EB7BCE8E3E`  
**Legacy source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-parser-combinators/adr/0001-combinator-runtime-contracts/content.md`  
**Source SHA-256:** `8b523e3c8819cc718df7d3281dc23d60e6a9864e62fb1dd9e583cc140d8236a2`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Core.Text.Parser

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/text-and-parsing/text-parser-combinators/`  
**Source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-parser-combinators/content.md`  
**SHA-256:** `2b610b306df65f3ee8cd715c6eb9fd3767a0108b93cb99fb44ad607b031ffd5b`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`Core.Text.Parser` exposes primitive combinators returning `ParseResult<T>`.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/corelib/packages/foundation/src/Core/Text/Parser.bd`
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-CORE-TEXT-0002`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Design model](./articles/design-model/)
- [Examples](./articles/examples/)
- [FAQ](./articles/faq-and-troubleshooting/)
- [Flow and algorithm](./articles/flow-and-algorithm/)
- [Verification](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Combinator runtime contracts

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/text-and-parsing/text-parser-combinators/adr/0001-combinator-runtime-contracts/`  
**Source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-parser-combinators/adr/0001-combinator-runtime-contracts/content.md`  
**SHA-256:** `8b523e3c8819cc718df7d3281dc23d60e6a9864e62fb1dd9e583cc140d8236a2`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Hand-rolled parsers (`Console.Format.Markdown`) and future Pest-generated parsers need one predictable combinator substrate.

## Decision

| ID | Rule |
| --- | --- |
| **D-CORE-TEXT-0002** | Backtracking **must** occur only at `Choice` boundaries; no unbounded memoization in v1. |
| **D-CORE-TEXT-0003** | `Many`/`Many1` on a zero-width parser **must** error at runtime or be rejected at codegen. |
| **D-CORE-TEXT-0004** | Regex and generated parsers **must** enforce a default 1 MiB input cap. |
| **D-CORE-TEXT-0005** | Generated parsers **must** attach Pest rule names to `ParseResult::Err`. |

## Consequences

- Simpler runtime than Packrat parsing.
- Grammar authors must avoid left recursion and zero-width loops (codegen **E18xx**).

## Verification anchors

- `compiler/corelib/packages/foundation/src/Core/Text/Parser.bd`
- `compiler/corelib/beskid_corelib/tests/corelib_tests/src/text/`
``````

</details>

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/text-and-parsing/text-parser-combinators/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-parser-combinators/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `2348b938752d58c7f30acfdde320411421e87a981ca816c48f547ab20f739616`

<details>
<summary>Migrated source text</summary>

``````markdown
## Normative requirements

| ID | Requirement |
| --- | --- |
| **PARSER-001** | `ParseResult<T>` **must** be `Ok` or `Err` with offset and rule label. |
| **PARSER-002** | `Choice` **must** restore cursor on branch failure. |
| **PARSER-003** | `Many` on zero-width parser **must** error. |
| **PARSER-004** | Combinators **must not** panic on malformed input. |
| **PARSER-005** | Generated and hand-authored parser callables **must** use **PascalCase** identifiers (`ParseDigit`, `ZeroOrMany`). Locals and parameters **must** use **camelCase** (`choice0`, `seqCur`, `manyCount`). Diagnostic `rule` label strings **may** retain Pest **snake_case** spellings (`"digit"`, `"lower_run"`)—they are string literals, not Beskid identifiers. Emitters **must not** produce snake_case Beskid callables or underscored locals (for example `Parse_digit`, `choice_0`). |

### PARSER-005 examples

| Surface | Normative | Rejected |
| --- | --- | --- |
| Rule callable | `ParseLowerRun` | `Parse_lower_run`, `Parse_lowerRun` |
| Local | `choice0` | `choice_0` |
| Local | `seqCur` | `seq_cur` |
| Diagnostic label | `"lower_run"` | — (Pest spelling allowed in strings) |

Naming authority: [code style and naming](/platform-spec/language-meta/program-structure/code-style-and-naming/). Pest codegen applies the same rules via [Pest parser generator](/platform-spec/compiler/compiler-mods/pest-parser-generator/).
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/text-and-parsing/text-parser-combinators/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-parser-combinators/articles/design-model/content.md`  
**SHA-256:** `817357bb75f99f9bd8b66d1da2ef6687b4abf96c5bbb28a86c2bd8e44ac62218`

<details>
<summary>Migrated source text</summary>

``````markdown
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
``````

</details>

### Source Record: Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/text-and-parsing/text-parser-combinators/articles/examples/`  
**Source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-parser-combinators/articles/examples/content.md`  
**SHA-256:** `255cbadbd994716fcf70668ebba28decffef5c75ed1298e6353db186add38fd0`

<details>
<summary>Migrated source text</summary>

``````markdown
## Examples

See implementation anchors: `compiler/corelib/packages/foundation/src/Core/Text/Parser.bd`
``````

</details>

### Source Record: FAQ

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/text-and-parsing/text-parser-combinators/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-parser-combinators/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `e88aa8a5ac4cbe6f25f43b6b8c55d400cce96fc94f612a72a15cf5ae15fcc0e6`

<details>
<summary>Migrated source text</summary>

``````markdown
## FAQ

### Why combinator-first?

One substrate for markup, regex, and future DSL parsers.
``````

</details>

### Source Record: Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/text-and-parsing/text-parser-combinators/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-parser-combinators/articles/flow-and-algorithm/content.md`  
**SHA-256:** `1ba5d8ca0640b7ab3f44c966c240f894fb16142159e52cb78dd702302c263308`

<details>
<summary>Migrated source text</summary>

``````markdown
## Algorithm

1. Construct `Cursor` from source.
2. Run combinator or generated parser.
3. Return `ParseResult`.
``````

</details>

### Source Record: Verification

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/text-and-parsing/text-parser-combinators/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-parser-combinators/articles/verification-and-traceability/content.md`  
**SHA-256:** `13903d2e4b5ea8c3b839136b181a2101752ce11872d9332f97b25a4a877aa4cb`

<details>
<summary>Migrated source text</summary>

``````markdown
## Conformance

- `compiler/corelib/beskid_corelib/tests/corelib_tests/src/text/`
- Contract IDs: **PARSER-***
``````

</details>
