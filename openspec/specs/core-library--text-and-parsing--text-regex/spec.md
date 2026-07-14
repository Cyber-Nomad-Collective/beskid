<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Core.Text.Regex Specification

## Purpose

This capability preserves and governs the migrated Beskid standard contract for Core.Text.Regex, including its legacy provenance and review status.

## Requirements

### Requirement: Core.Text.Regex conformance status
This capability SHALL remain non-conformant and MUST NOT be cited as an implemented Beskid guarantee until a validated OpenSpec change adds explicit behavioral requirements.

**Stable ID:** `BSP-REQ-67253417E17B`

#### Scenario: Capability has descriptive material only
- **GIVEN** the migrated sources contain no uppercase BCP-14 obligation or accepted ADR decision
- **WHEN** an implementation reports Beskid conformance
- **THEN** it MUST NOT claim conformance based on this capability

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Core.Text.Regex

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/text-and-parsing/text-regex/`  
**Source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-regex/content.md`  
**SHA-256:** `cf75dec6a7c218eb88ffe84d76d1fca9b22a04fe70e58c54bccd1ac769eaeb70`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`Core.Text.Regex` wraps a generated parser from `regex.pest`; no hand-written NFA engine.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/corelib/packages/foundation/src/Core/Text/Regex.bd`
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
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

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/text-and-parsing/text-regex/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-regex/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `03301bfa873af757cc76a2ec6869eecbeb04e5b2f5adc204f9e949d103081405`

<details>
<summary>Migrated source text</summary>

``````markdown
## Normative requirements

| ID | Requirement |
| --- | --- |
| **REGEX-001** | Pattern syntax **must** be defined by `regex.pest`. |
| **REGEX-002** | Input length **must** be capped at 1 MiB code units. |
| **REGEX-003** | `Match` **must** return `Option<MatchSpan>` with byte offsets. |
| **REGEX-004** | `Find` **must** return the leftmost first match anywhere in the subject. |
| **REGEX-005** | `FindAll` **must** return non-overlapping matches in left-to-right order. |
| **REGEX-006** | Invalid patterns **must** yield `None` / empty results without panic. |
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/text-and-parsing/text-regex/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-regex/articles/design-model/content.md`  
**SHA-256:** `61d3493c65bc8b8c658779f2e1966a247bb9a62dbedb88b3523996afa2639426`

<details>
<summary>Migrated source text</summary>

``````markdown
## Module layout

| Symbol | Role |
| --- | --- |
| `Core.Text.Regex` | Public API hub (`Match`, `Find`, `FindAll`) |
| `Core.Text.Regex.Generated` | Checked-in combinator parsers from `regex.pest` |
| `grammars/regex.pest` | Canonical bounded pattern language (REGEX-001) |

## Pattern language (bounded v1)

| Construct | Example | Notes |
| --- | --- | --- |
| Literal | `abc` | Concatenated code units |
| Class | `[a-z]`, `[^0-9]` | Inclusive or negated ranges and singletons |
| Quantifier | `*`, `+`, `?` | Greedy; zero-width repeats error (PARSER-003) |
| Grouping | `(foo\|bar)` | Alternation inside group |
| Alternation | `a\|b` | Left-to-right first match |
| Anchors | `^`, `$` | Start/end of subject |
| Escapes | `\d`, `\w`, `\s`, and negated variants | Uses generated text-atom parsers |
| Dot | `.` | Any code unit via `Parse_any_unit` |
``````

</details>

### Source Record: Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/text-and-parsing/text-regex/articles/examples/`  
**Source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-regex/articles/examples/content.md`  
**SHA-256:** `817550368f86692709d0ebf15a9cac727c4dcb20343ab20e65c95873ce16566c`

<details>
<summary>Migrated source text</summary>

``````markdown
## Examples

```beskid
use Core.Text.Regex;
use Query.Contracts;

// Prefix match at position 0
Contracts.HasValue(Regex.Match("[a-z]+", "abc123")); // true → span 0..3

// Leftmost search
Contracts.HasValue(Regex.Find("[0-9]+", "x99y")); // true → span 1..3

// Non-overlapping enumeration
!Regex.IsFindAllEmpty(Regex.FindAll("[a-z]+", "a1bb2ccc"));
```

Implementation anchors: `compiler/corelib/packages/foundation/src/Core/Text/Regex.bd`, generated parsers in `Core/Text/Regex/Generated.bd` (regen via `regen_grammar_parsers.sh`).
``````

</details>

### Source Record: FAQ

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/text-and-parsing/text-regex/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-regex/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `c9e82320021496b8e24534a2636d2588518635fb5e7c73a9ff1358a6ab48d587`

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
**Legacy path:** `/platform-spec/core-library/text-and-parsing/text-regex/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-regex/articles/flow-and-algorithm/content.md`  
**SHA-256:** `83da80a920206fa5ac49a63d3082ff38f35cfd2dd49548513eb8de98d8fb91d0`

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
**Legacy path:** `/platform-spec/core-library/text-and-parsing/text-regex/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/core-library/text-and-parsing/text-regex/articles/verification-and-traceability/content.md`  
**SHA-256:** `ed1b8b8a64b1ed8aad218a08b653f06351585ce3ae016804f3f175757e5cc2f6`

<details>
<summary>Migrated source text</summary>

``````markdown
## Conformance

- `compiler/corelib/beskid_corelib/tests/corelib_tests/src/text/TextRegexTests.bd`
- `compiler/corelib/packages/foundation/grammars/regex.pest`
- `compiler/crates/beskid_pest_gen/` (host codegen)
- Contract IDs: **REGEX-***
``````

</details>
