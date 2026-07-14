<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Rules and diagnostics catalog Specification

## Purpose

Semantic rule execution model and diagnostic-kind catalog contract for compiler analysis.

## Requirements

### Requirement: Feature hub authority: Decision [D-COMP-SEM-0007]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-4915527FBF75`  
**Legacy source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `1974f5d70995f909b0a38cce3a464cd0ebf1dfbbade690ac1cb8b7e4584268e6`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-SEM-0008]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-9F71487BA198`  
**Legacy source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `dd2afbf65a9baae1a35014c396b52aa620dcb37801a9413ecb2bc1cfee1ea454`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Primary contract for Rules and diagnostics catalog: Decision [D-COMP-SEM-0009]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> The reference compiler **must** implement Rules and diagnostics catalog as documented in this feature hub and its article bundle.

**Stable ID:** `BSP-REQ-D5711F9DC5B8`  
**Legacy source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/adr/0003-primary-contract-choice/content.md`  
**Source SHA-256:** `a3154103445273012196ee8e8a1602cbfa4ba4827a69f05310dd0b8b979b5422`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Rules and diagnostics catalog

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/content.md`  
**SHA-256:** `03b7b3b3d3ccef878e298bf087786422c980086cc5d32bbd35bcdabe278d800b`

<details>
<summary>Migrated source text</summary>

``````markdown
## What this feature governs

This feature defines how semantic rules are scheduled and how their findings map to stable diagnostic kinds. The primary implementation roots are `beskid_analysis/src/analysis`, staged rule modules under `analysis/rules/staged`, and services that expose diagnostics to CLI/LSP consumers.

## Core guarantees

1. Semantic checks run on resolved project state and must produce deterministic diagnostic ordering.
2. Diagnostic kind identity is anchored in `analysis/diagnostic_kinds.rs`.
3. Error-severity diagnostics are compilation blockers in diagnostics-enabled paths.
4. CLI and LSP surfaces may differ in rendering but must preserve diagnostic kind and source span identity.

## Documentation diagnostics (snapshot)

Documentation-only findings use stable warning codes **W1610–W1615** and **W1620–W1625** (see **[Diagnostic code registry design model](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/design-model/)**). They are computed in `beskid_analysis::doc::collect_doc_diagnostics` and attached to `DocumentAnalysisSnapshot::doc_diagnostics` so editors can merge them with staged semantic diagnostics without re-running HIR-heavy rules on the hot path.

## Implementation anchors

- `compiler/crates/beskid_analysis/src/analysis`
- `compiler/crates/beskid_analysis/src/analysis/rules/staged`
- `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
- `compiler/crates/beskid_analysis/src/doc/validate.rs`
- `compiler/crates/beskid_analysis/src/services/`
- `compiler/crates/beskid_lsp/src/diagnostics.rs`
## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-SEM-0007` … `D-COMP-SEM-0009`); use the reader **ADRs** tab for expandable detail.
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
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `1974f5d70995f909b0a38cce3a464cd0ebf1dfbbade690ac1cb8b7e4584268e6`

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

- `site/website/src/content/docs/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `dd2afbf65a9baae1a35014c396b52aa620dcb37801a9413ecb2bc1cfee1ea454`

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

- `compiler/crates/beskid_analysis/src/analysis`
- `compiler/crates/beskid_analysis/src/analysis/rules/staged`
- `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
``````

</details>

### Source Record: Primary contract for Rules and diagnostics catalog

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/adr/0003-primary-contract-choice/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/adr/0003-primary-contract-choice/content.md`  
**SHA-256:** `a3154103445273012196ee8e8a1602cbfa4ba4827a69f05310dd0b8b979b5422`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

This feature defines how semantic rules are scheduled and how their findings map to stable diagnostic kinds. The primary implementation roots are `beskid_analysis/src/analysis`, staged rule modules under `analysis/rules/staged`, and services that expose diagnostics to CLI/LSP consumers.

## Decision

The reference compiler **must** implement Rules and diagnostics catalog as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/src/analysis`
- `compiler/crates/beskid_analysis/src/analysis/rules/staged`
- `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
``````

</details>

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `cce95b01b1a70e82ff346ca15689111e5be654f776b4d00e910afe1dbf16ec6a`

<details>
<summary>Migrated source text</summary>

``````markdown
Contracts enforced by semantic rules:

- Rules must report through canonical issue kinds, not ad-hoc string identifiers.
- Rules should not mutate resolver state while validating semantic constraints.
- Rule failures must preserve source spans that point to user-owned code.

Edge cases to monitor:

- Forward references across modules with cyclical dependencies.
- Generic-like type usage that resolves in parser form but fails in semantic type passes.
- Method and contract member collisions discovered only after full symbol table assembly.
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/articles/design-model/content.md`  
**SHA-256:** `5632df6b84333ab02cf4194720a47cfdc2ccfc72937243fed1365d99b219c612`

<details>
<summary>Migrated source text</summary>

``````markdown
Semantic analysis is modeled as a staged rule engine:

- Resolver prepares symbol and type context.
- Rule modules read that context and emit typed issues.
- Issue kinds map to stable code/category metadata.
- Service adapters project the same issue identity into CLI and LSP output models.

For newcomers, the key idea is separation of concerns: rule logic decides **what is wrong**, while diagnostics infrastructure decides **how it is labeled and surfaced**.

## Meta and meta-host diagnostics

Codes **E1801–E1899** are owned by manifest, workspace, mod host, emit merge, and mod contract validation—not by ordinary semantic rules. When adding mod-related failures, update **[Diagnostic code registry / design model](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/)** first, then reference the new code from rule modules or manifest validators so the catalog remains single-sourced.
``````

</details>

### Source Record: Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/articles/examples/content.md`  
**SHA-256:** `ca50ca21e11cf1f56af10db450a73aa3b10bf87fa8d35709db0d54d80bfa140b`

<details>
<summary>Migrated source text</summary>

``````markdown
Example A: duplicate symbol definition

1. Resolver exposes two declarations with the same identity in one scope.
2. Definition-stage rule reports a duplicate-definition issue kind.
3. CLI and LSP render different message shells but reference the same issue code.

Example B: invalid method signature usage

1. Parsed node is syntactically valid.
2. Semantic rule validates contract/method constraints against resolved type context.
3. Failure emits a semantic diagnostic code with spans pointing to the offending signature and related declaration.
``````

</details>

### Source Record: FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `ddf625cb462bada18224fd3ffe6fdb1b287197178e84491ef1121ad68880a90c`

<details>
<summary>Migrated source text</summary>

``````markdown
### Why do semantic tests fail after parser changes?

Rules often assume specific syntax node shapes. Re-check parser output and resolver binding before changing rule logic.

### Where should a new diagnostic kind be added?

Add it in `analysis/diagnostic_kinds.rs`, then wire rule emission to the new kind. Do not introduce one-off string codes inside rule modules.

### Why do CLI and LSP messages look different?

Presentation may differ, but code identity and source spans must match. Validate through shared diagnostics tests and adapter checks.
``````

</details>

### Source Record: Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/articles/flow-and-algorithm/content.md`  
**SHA-256:** `f51ad1d5c83874f4494b9a281a9b5bb48c373c32871c0f0ac767ea48aea97cf0`

<details>
<summary>Migrated source text</summary>

``````markdown
High-level semantic algorithm:

1. Collect resolved declarations and references from resolver outputs.
2. Execute staged semantic rules over definitions, expressions, and contract items.
3. Normalize findings into issue kinds from `diagnostic_kinds.rs`.
4. Attach source location and contextual message payloads.
5. Emit diagnostics through analysis services to CLI/LSP pipelines.

The deterministic contract is important for test stability: the same input project must produce the same set and ordering of semantic diagnostics.
``````

</details>

### Source Record: Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/articles/verification-and-traceability/content.md`  
**SHA-256:** `24483ccf441798739592c34932025745448d1ace30da941c24180f61568eb33b`

<details>
<summary>Migrated source text</summary>

``````markdown
Traceability anchors:

- Rule definitions: `compiler/crates/beskid_analysis/src/analysis/rules`
- Staged definitions: `.../analysis/rules/staged/definitions.rs`
- Diagnostic catalog: `.../analysis/diagnostic_kinds.rs`
- Surface adapters: `.../beskid_analysis/src/services/`, `.../beskid_lsp/src/diagnostics.rs`

Verification checklist:

1. Run semantic diagnostics tests and fixture suites after rule edits.
2. Confirm new issues are assigned stable diagnostic codes.
3. Verify CLI and LSP report equivalent issue identities and spans.
``````

</details>
