<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Grammar and parser contract Specification

## Purpose

Feature hub for the grammar and parser contract in the reference compiler.

## Requirements

### Requirement: Feature hub authority: Decision [D-COMP-FRONT-0004]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-74FB87C12CCD`  
**Legacy source:** `site/spec-content/platform-spec/compiler/front-end/grammar-and-parser-contract/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `0e18e084ccd613fe86978910290eb4feade27bc8769ba19c7382a8262cc0a139`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-FRONT-0005]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-6751E931AD4C`  
**Legacy source:** `site/spec-content/platform-spec/compiler/front-end/grammar-and-parser-contract/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `3651f135101b3922380115bcee8893a66a5c5fa082c829d917c37442d782e4ad`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Primary contract for Grammar and parser contract: Decision [D-COMP-FRONT-0006]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> The reference compiler **must** implement Grammar and parser contract as documented in this feature hub and its article bundle.

**Stable ID:** `BSP-REQ-05E5A4F46E98`  
**Legacy source:** `site/spec-content/platform-spec/compiler/front-end/grammar-and-parser-contract/adr/0003-primary-contract-choice/content.md`  
**Source SHA-256:** `5c60c11daee18ad8f94be6636fc76b98160517dc13427b417395e23a94f0ced2`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Grammar and parser contract

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/grammar-and-parser-contract/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/grammar-and-parser-contract/content.md`  
**SHA-256:** `324aebaf427885fd97b9973f4700eca0d5e6dfe910e767c3f90d3f5ad531302b`

<details>
<summary>Migrated source text</summary>

``````markdown
This feature hub defines the normative contract for **grammar and parser contract** and links newcomer-oriented reference articles.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/beskid.pest` defines the grammar tokens and precedence.
- `compiler/crates/beskid_analysis/src/syntax/` builds syntax items from parser output.
- `compiler/crates/beskid_analysis/src/syntax/items/parse_helpers.rs` contains shared parse helpers used by item parsers.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-FRONT-0004` … `D-COMP-FRONT-0006`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Grammar and parser contract - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Grammar and parser contract - Design model](./articles/design-model/)
- [Grammar and parser contract - Examples](./articles/examples/)
- [Grammar and parser contract - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Grammar and parser contract - Flow and algorithm](./articles/flow-and-algorithm/)
- [Grammar and parser contract - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/grammar-and-parser-contract/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/grammar-and-parser-contract/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `0e18e084ccd613fe86978910290eb4feade27bc8769ba19c7382a8262cc0a139`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Sibling articles under this feature previously restated requirements in inconsistent forms.

## Decision

This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

## Consequences

Contract changes start on the hub or in linked ADRs, then propagate to articles and implementation anchors.

## Verification anchors

- `site/website/src/content/docs/platform-spec/compiler/front-end/grammar-and-parser-contract/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/grammar-and-parser-contract/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/grammar-and-parser-contract/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `3651f135101b3922380115bcee8893a66a5c5fa082c829d917c37442d782e4ad`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Implementation crates accumulated informal notes that diverged from published contracts.

## Decision

Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

## Consequences

Engineers file spec/ADR updates when behavior changes; crate comments are non-authoritative for conformance arguments.

## Verification anchors

- `compiler/crates/beskid_analysis/src/beskid.pest`
- `compiler/crates/beskid_analysis/src/syntax/`
- `compiler/crates/beskid_analysis/src/syntax/items/parse_helpers.rs`
``````

</details>

### Source Record: Primary contract for Grammar and parser contract

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/grammar-and-parser-contract/adr/0003-primary-contract-choice/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/grammar-and-parser-contract/adr/0003-primary-contract-choice/content.md`  
**SHA-256:** `5c60c11daee18ad8f94be6636fc76b98160517dc13427b417395e23a94f0ced2`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

This feature hub defines the normative contract for **grammar and parser contract** and links newcomer-oriented reference articles.

## Decision

The reference compiler **must** implement Grammar and parser contract as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/src/beskid.pest`
- `compiler/crates/beskid_analysis/src/syntax/`
- `compiler/crates/beskid_analysis/src/syntax/items/parse_helpers.rs`
``````

</details>

### Source Record: Grammar and parser contract - Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/grammar-and-parser-contract/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/grammar-and-parser-contract/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `5d06d0b7d360531d5639898e4b5c7e64995de1cb465ffd419664cfdfd1bd47ad`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **contracts and edge cases** for **grammar and parser contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/beskid.pest` defines the grammar tokens and precedence.
- `compiler/crates/beskid_analysis/src/syntax/` builds syntax items from parser output.
- `compiler/crates/beskid_analysis/src/syntax/items/parse_helpers.rs` contains shared parse helpers used by item parsers.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Grammar and parser contract - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/grammar-and-parser-contract/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/grammar-and-parser-contract/articles/design-model/content.md`  
**SHA-256:** `e68cf84933fd61ccacef650049627d5ca8af0583bf612e3b030d770236ca77d5`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **design model** for **grammar and parser contract** in the reference compiler.

## Anchored code paths

- `compiler/crates/beskid_analysis/src/beskid.pest` defines grammar tokens and precedence.
- `compiler/crates/beskid_analysis/src/syntax/` builds syntax items from parser output.
- `compiler/crates/beskid_analysis/src/syntax/items/parse_helpers.rs` contains shared parse helpers.

## Metaprogramming grammar (removed)

The reference compiler **must not** define a language-level `meta` item grammar. Compiler mods use ordinary Beskid source plus SDK contracts (`Collector`, `Generator`, `Analyzer`, `Rewriter`).

Legacy `MetaDefinition` productions **must be removed** from `beskid.pest` and AST/HIR surfaces.

## `extend type` production (v0.2 target)

The grammar **must** define **`extend type`** as the normative type-extension syntax (see **[extend type](/platform-spec/language-meta/program-structure/extend-type/)**). Generators emit `extend type` blocks as typed AST contributions.

Implementation **must** pair pest rules with item parsers under `compiler/crates/beskid_analysis/src/syntax/items/` and snapshot tests under `compiler/crates/beskid_tests`.

## Language macro productions (v0.2 target)

The grammar **must** define:

| Production | Role |
| --- | --- |
| **`MacroDefinition`** | `Visibility?` `macro` `Identifier` `(` `MacroParameterList` `)` `Block` — module **`InnerItem`**. |
| **`MacroParameter`** | `MacroFragmentKind` `Identifier` (closed kind keywords). |
| **`MacroInvocation`** | `Identifier` `!` optional `(` `MacroArgumentList` `)` optional braced `Block` — **expression** position. |
| **`MacroMetavariableExpr`** | `$` `Identifier` — legal only inside **`MacroDefinition`** bodies. |

See **[Language macros](/platform-spec/language-meta/metaprogramming/macros/)**. Expansion is host-driven in **`macro.expand`**; the parser only materializes definitions and invocation sites.

## Practical notes

- Treat diagnostics and tests as part of the contract, not optional implementation details.
- When grammar changes, update this article and conformance tests in the same change.
``````

</details>

### Source Record: Grammar and parser contract - Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/grammar-and-parser-contract/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/grammar-and-parser-contract/articles/examples/content.md`  
**SHA-256:** `abd085ffb85e0659540fb60021acb56bc86a4bf7a6dbc4a73f173c0e6729feef`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **examples** for **grammar and parser contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/beskid.pest` defines the grammar tokens and precedence.
- `compiler/crates/beskid_analysis/src/syntax/` builds syntax items from parser output.
- `compiler/crates/beskid_analysis/src/syntax/items/parse_helpers.rs` contains shared parse helpers used by item parsers.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Grammar and parser contract - FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/grammar-and-parser-contract/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/grammar-and-parser-contract/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `b8cb2e57023f42b4343d0eecf43f1b771b8cf9d622a09a1948c01822f561e9e3`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **faq and troubleshooting** for **grammar and parser contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/beskid.pest` defines the grammar tokens and precedence.
- `compiler/crates/beskid_analysis/src/syntax/` builds syntax items from parser output.
- `compiler/crates/beskid_analysis/src/syntax/items/parse_helpers.rs` contains shared parse helpers used by item parsers.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Grammar and parser contract - Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/grammar-and-parser-contract/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/grammar-and-parser-contract/articles/flow-and-algorithm/content.md`  
**SHA-256:** `0d8db0c7b63ef789e548e3f16b4cdbf8f816d5298347fd312ddd4e0d208f923b`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **flow and algorithm** for **grammar and parser contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/beskid.pest` defines the grammar tokens and precedence.
- `compiler/crates/beskid_analysis/src/syntax/` builds syntax items from parser output.
- `compiler/crates/beskid_analysis/src/syntax/items/parse_helpers.rs` contains shared parse helpers used by item parsers.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Grammar and parser contract - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/grammar-and-parser-contract/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/grammar-and-parser-contract/articles/verification-and-traceability/content.md`  
**SHA-256:** `452f7d53813c57cf8dd3b31556e1a3e28d1685cc0df572580f1dee6faba674bb`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **verification and traceability** for **grammar and parser contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/beskid.pest` defines the grammar tokens and precedence.
- `compiler/crates/beskid_analysis/src/syntax/` builds syntax items from parser output.
- `compiler/crates/beskid_analysis/src/syntax/items/parse_helpers.rs` contains shared parse helpers used by item parsers.

## Grammar evidence

Verification **must** include:

- Removal of legacy `MetaDefinition` from `beskid.pest` and AST/HIR surfaces.
- Parser snapshot tests for **`extend type`** syntax.
- Formatter and LSP smoke tests when `extend type` affects structure-sensitive tooling.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>
