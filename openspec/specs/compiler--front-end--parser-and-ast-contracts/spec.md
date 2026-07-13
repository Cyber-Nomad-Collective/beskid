<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Parser and AST contracts Specification

## Purpose

Front-end contracts for grammar parsing, syntax item construction, and formatter AST consumption.

## Requirements

### Requirement: Feature hub authority: Decision [D-COMP-FRONT-0010]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-27F82326EB9D`  
**Legacy source:** `site/spec-content/platform-spec/compiler/front-end/parser-and-ast-contracts/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `5fe5802fbbd21d97d4f0c6170fa24e74ab9c2ed10047ea441fd30ba3322556f7`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-FRONT-0011]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-D3F721BCE18C`  
**Legacy source:** `site/spec-content/platform-spec/compiler/front-end/parser-and-ast-contracts/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `ea15f5423cf71b8529aa9149ab7f8738397a31fb633636cb257a9dfb44f9e09c`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Single pest grammar surface: Decision [D-COMP-FRONT-0012]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `beskid.pest` and `beskid_analysis::parsing` are the authoritative parse surface; AST contracts derive spans from this pipeline only.

**Stable ID:** `BSP-REQ-6AD9A39E6C85`  
**Legacy source:** `site/spec-content/platform-spec/compiler/front-end/parser-and-ast-contracts/adr/0003-pest-grammar-single-surface/content.md`  
**Source SHA-256:** `74c443e911fe484b03770163fefaff3aea24bd2c12ce6d3e83bf862a6bb04878`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Parser and AST contracts

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/parser-and-ast-contracts/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/parser-and-ast-contracts/content.md`  
**SHA-256:** `b7070bd0b1c0a41268b444a76201f55b75756aeeecdc9030dd1c65fd38a1a972`

<details>
<summary>Migrated source text</summary>

``````markdown
## What this feature governs

This feature defines how raw source text becomes the typed syntax model used by name resolution, semantic analysis, and formatting. The grammar lives in `beskid_analysis/src/beskid.pest`, while syntax item and type nodes under `beskid_analysis/src/syntax` form the canonical AST contract.

## Core guarantees

1. Parser entry points convert `pest` failures into diagnostics that preserve source ranges and actionable messages.
2. Syntax node builders in `syntax/items` and `syntax/types` are the single source of truth for declaration and type shapes.
3. Formatter paths consume these syntax nodes and do not maintain an independent parse model.
4. Parser updates must keep resolver and diagnostics consumers source-compatible or include coordinated downstream updates.

## Implementation anchors

- `compiler/crates/beskid_analysis/src/beskid.pest`
- `compiler/crates/beskid_analysis/src/parsing`
- `compiler/crates/beskid_analysis/src/syntax/items`
- `compiler/crates/beskid_analysis/src/syntax/types`
- `compiler/crates/beskid_analysis/src/resolve`
- `compiler/crates/beskid_analysis/src/analysis`
## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-FRONT-0010` … `D-COMP-FRONT-0012`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Design model](./articles/design-model/)
- [Examples](./articles/examples/)
- [FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Flow and algorithm](./articles/flow-and-algorithm/)
- [Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/parser-and-ast-contracts/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/parser-and-ast-contracts/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `5fe5802fbbd21d97d4f0c6170fa24e74ab9c2ed10047ea441fd30ba3322556f7`

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

- `site/website/src/content/docs/platform-spec/compiler/front-end/parser-and-ast-contracts/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/parser-and-ast-contracts/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/parser-and-ast-contracts/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `ea15f5423cf71b8529aa9149ab7f8738397a31fb633636cb257a9dfb44f9e09c`

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
- `compiler/crates/beskid_analysis/src/parsing`
- `compiler/crates/beskid_analysis/src/syntax/items`
``````

</details>

### Source Record: Single pest grammar surface

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/parser-and-ast-contracts/adr/0003-pest-grammar-single-surface/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/parser-and-ast-contracts/adr/0003-pest-grammar-single-surface/content.md`  
**SHA-256:** `74c443e911fe484b03770163fefaff3aea24bd2c12ce6d3e83bf862a6bb04878`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Multiple parser entrypoints caused span drift.

## Decision

`beskid.pest` and `beskid_analysis::parsing` are the authoritative parse surface; AST contracts derive spans from this pipeline only.

## Consequences

Alternate parsers must not ship without an ADR and conformance fixtures.

## Verification anchors

- `compiler/crates/beskid_analysis/src/beskid.pest`
- `compiler/crates/beskid_analysis/src/parsing`.
``````

</details>

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/parser-and-ast-contracts/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/parser-and-ast-contracts/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `9c76632eb518148f13d1868d9353018e8abe315fb6b9a833eed60f75b3424ab4`

<details>
<summary>Migrated source text</summary>

``````markdown
Key front-end contracts:

- Parse failures must map to source spans users can act on.
- Syntax nodes must preserve declaration identity needed by item resolution.
- Optional syntax forms (attributes, docs, modifiers) must have explicit absent-state semantics, not implicit null behavior.

Frequent edge cases:

- Unterminated grouped constructs should produce one primary error and avoid noisy cascades.
- Unknown tokens after valid prefixes should preserve partial nodes for downstream reporting when safe.
- Ambiguous grammar expansions must be resolved in parser logic, not deferred into semantic phases.
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/parser-and-ast-contracts/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/parser-and-ast-contracts/articles/design-model/content.md`  
**SHA-256:** `9038a89d1bcea4d98b943d48ee9b9224e4c15bf8e3d7bdc926b0759393907c55`

<details>
<summary>Migrated source text</summary>

``````markdown
The front-end is split into three layers:

1. **Grammar layer** (`beskid.pest`): token and production definitions.
2. **Parsing layer** (`src/parsing`): traversal helpers that map parse trees into typed syntax nodes.
3. **Syntax layer** (`src/syntax/items`, `src/syntax/types`): stable Rust structs/enums consumed by resolver, analysis, docs, and formatter paths.

For newcomers, the practical rule is simple: if a language construct changes, update grammar and syntax together, then confirm semantic passes still read the resulting nodes as expected.

## `extend type` in the module AST

**`extend type`** is a top-level module item for type extension (see **[extend type](/platform-spec/language-meta/program-structure/extend-type/)**). Parser responsibilities:

1. **Discovery order** — `Program.items` preserves source order; mod host discovery walks items deterministically.
2. **Merge semantics** — Generated `extend type` contributions merge with hand-authored extensions under host validation before semantic analysis.
3. **Legacy removal** — `MetaDefinition` AST nodes **must be removed** from parser output.

HIR lowering for `extend type` is documented in **[AST and HIR shape contract](/platform-spec/compiler/front-end/ast-hir-shape-contract/)**.
``````

</details>

### Source Record: Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/parser-and-ast-contracts/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/parser-and-ast-contracts/articles/examples/content.md`  
**SHA-256:** `6722474175108d9c396c4d3b78bf75c75dcb0dc206d2ff276433c1e17aec5a12`

<details>
<summary>Migrated source text</summary>

``````markdown
Example A: adding a new declaration form

1. Extend `beskid.pest` with the production.
2. Add/adjust syntax item parser in `src/syntax/items`.
3. Validate formatter behavior if the new node is printable.
4. Confirm resolver can discover names from the new declaration.

Example B: fixing a parser diagnostic

1. Reproduce failure in parser/analysis tests.
2. Adjust parse error mapping in `src/parsing`.
3. Ensure diagnostic code identity remains stable when routed through later phases.
``````

</details>

### Source Record: FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/parser-and-ast-contracts/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/parser-and-ast-contracts/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `b37f2fcbaecfc19de0532192c7f03642b582fe3a44d86be166add20fe17ab158`

<details>
<summary>Migrated source text</summary>

``````markdown
### Why does one syntax error produce many diagnostics?

Look for missing parser recovery boundaries. A single malformed token can cascade if parsing keeps consuming nodes with shifted spans.

### Where should I add a new language form first?

Start in `beskid.pest`, then add syntax node mapping, then update resolver/analysis consumers. Skipping syntax mapping leads to unresolved or partially shaped nodes.

### How do I know if a bug is parser or semantic?

If syntax nodes are malformed or missing fields, fix parser/syntax first. If nodes are correct but rule checks fail, continue in `analysis/rules` or resolver passes.
``````

</details>

### Source Record: Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/parser-and-ast-contracts/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/parser-and-ast-contracts/articles/flow-and-algorithm/content.md`  
**SHA-256:** `9bae924f904f9ddb8b1c1852ea4a770be5f76f9ff171a73c7dd2c9d60f10220f`

<details>
<summary>Migrated source text</summary>

``````markdown
The parsing flow is intentionally linear:

1. Read source units from project services.
2. Execute grammar entry points from `beskid.pest`.
3. Convert parse tree fragments into syntax item/type nodes in `src/syntax`.
4. Emit parser diagnostics for malformed input and continue when recovery is defined.
5. Hand syntax trees to resolver (`src/resolve`) and semantic passes (`src/analysis`).

Algorithmically, the important invariant is determinism: identical source text must produce identical syntax node graphs and stable diagnostic ordering.
``````

</details>

### Source Record: Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/parser-and-ast-contracts/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/parser-and-ast-contracts/articles/verification-and-traceability/content.md`  
**SHA-256:** `f87f733001f139029ff12852fdc40f7329b6f7c58062724da53bb087e3a9a6f1`

<details>
<summary>Migrated source text</summary>

``````markdown
Traceability map for this feature:

- **Grammar source:** `compiler/crates/beskid_analysis/src/beskid.pest`
- **Syntax node construction:** `compiler/crates/beskid_analysis/src/syntax/items`, `.../src/syntax/types`
- **Handoff consumers:** `.../src/resolve`, `.../src/analysis`

Recommended verification routine:

1. Run targeted parser and analysis tests after grammar or syntax edits.
2. Confirm diagnostics include expected code/category and stable source location mapping.
3. Run formatter checks when AST shape changes affect output ordering or spacing.
``````

</details>
