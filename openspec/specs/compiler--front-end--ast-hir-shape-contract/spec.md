<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# AST and HIR shape contract Specification

## Purpose

Feature hub for the ast and hir shape contract in the reference compiler.

## Requirements

### Requirement: Feature hub authority: Decision [D-COMP-FRONT-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-A48953A9D3B1`  
**Legacy source:** `site/spec-content/platform-spec/compiler/front-end/ast-hir-shape-contract/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `9e518b0af93021171e9923a5926adf78444a4467ebc8e8234d03726834cf7c5e`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-FRONT-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-5DF4CF708B47`  
**Legacy source:** `site/spec-content/platform-spec/compiler/front-end/ast-hir-shape-contract/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `c1e98ade3240503d7b0b4a32255a06cb5e5ee39bd9a16f003f65b2090d324930`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Primary contract for AST and HIR shape contract: Decision [D-COMP-FRONT-0003]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> The reference compiler **must** implement AST and HIR shape contract as documented in this feature hub and its article bundle.

**Stable ID:** `BSP-REQ-52D88061B76D`  
**Legacy source:** `site/spec-content/platform-spec/compiler/front-end/ast-hir-shape-contract/adr/0003-primary-contract-choice/content.md`  
**Source SHA-256:** `c5ab45e2e537661ab1a0e6f9f6a69e6534402f08edf1d557b61cee6aa1401a5b`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: AST and HIR shape contract

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/ast-hir-shape-contract/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/ast-hir-shape-contract/content.md`  
**SHA-256:** `a8bf1a364efac977a91384fc9972fa5dca1089ed81f809a8314c78d608ee9b86`

<details>
<summary>Migrated source text</summary>

``````markdown
This feature hub defines the normative contract for **ast and hir shape contract** and links newcomer-oriented reference articles.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/syntax/items/` exposes AST-like syntax node shapes.
- `compiler/crates/beskid_analysis/src/resolve/items.rs` maps parsed items into resolved structures.
- `compiler/crates/beskid_analysis/src/analysis/` consumes those shapes for semantic passes.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-FRONT-0001` … `D-COMP-FRONT-0003`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [AST and HIR shape contract - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [AST and HIR shape contract - Design model](./articles/design-model/)
- [AST and HIR shape contract - Examples](./articles/examples/)
- [AST and HIR shape contract - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [AST and HIR shape contract - Flow and algorithm](./articles/flow-and-algorithm/)
- [AST and HIR shape contract - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/ast-hir-shape-contract/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/ast-hir-shape-contract/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `9e518b0af93021171e9923a5926adf78444a4467ebc8e8234d03726834cf7c5e`

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

- `site/website/src/content/docs/platform-spec/compiler/front-end/ast-hir-shape-contract/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/ast-hir-shape-contract/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/ast-hir-shape-contract/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `c1e98ade3240503d7b0b4a32255a06cb5e5ee39bd9a16f003f65b2090d324930`

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

- `compiler/crates/beskid_analysis/src/syntax/items/`
- `compiler/crates/beskid_analysis/src/resolve/items.rs`
- `compiler/crates/beskid_analysis/src/analysis/`
``````

</details>

### Source Record: Primary contract for AST and HIR shape contract

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/ast-hir-shape-contract/adr/0003-primary-contract-choice/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/ast-hir-shape-contract/adr/0003-primary-contract-choice/content.md`  
**SHA-256:** `c5ab45e2e537661ab1a0e6f9f6a69e6534402f08edf1d557b61cee6aa1401a5b`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

This feature hub defines the normative contract for **ast and hir shape contract** and links newcomer-oriented reference articles.

## Decision

The reference compiler **must** implement AST and HIR shape contract as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/src/syntax/items/`
- `compiler/crates/beskid_analysis/src/resolve/items.rs`
- `compiler/crates/beskid_analysis/src/analysis/`
``````

</details>

### Source Record: AST and HIR shape contract - Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/ast-hir-shape-contract/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/ast-hir-shape-contract/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `83bb55c5e17ea9e50b345c073290ab135766f0960a7c4bf4a81e5f3a25a0ecf2`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **contracts and edge cases** for **ast and hir shape contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/syntax/items/` exposes AST-like syntax node shapes.
- `compiler/crates/beskid_analysis/src/resolve/items.rs` maps parsed items into resolved structures.
- `compiler/crates/beskid_analysis/src/analysis/` consumes those shapes for semantic passes.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: AST and HIR shape contract - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/ast-hir-shape-contract/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/ast-hir-shape-contract/articles/design-model/content.md`  
**SHA-256:** `f28cd13b4724f155f43d019ad7f86b39cb30329eb3efb4647a8bff6ff1a723b6`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **design model** for **ast and hir shape contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/syntax/items/` exposes AST-like syntax node shapes.
- `compiler/crates/beskid_analysis/src/resolve/items.rs` maps parsed items into resolved structures.
- `compiler/crates/beskid_analysis/src/analysis/` consumes those shapes for semantic passes.

## `extend type` and HIR

`extend type` lowers to HIR member metadata attached to the extended type symbol. Generated extensions from mod contracts follow the same lowering path as hand-authored extensions. HIR **must not** partially encode unmerged generator contributions.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: AST and HIR shape contract - Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/ast-hir-shape-contract/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/ast-hir-shape-contract/articles/examples/content.md`  
**SHA-256:** `047a82a90bc39aa28067b905c2113d9f685d6c7b1f247bcf81ed461e4f77922c`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **examples** for **ast and hir shape contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/syntax/items/` exposes AST-like syntax node shapes.
- `compiler/crates/beskid_analysis/src/resolve/items.rs` maps parsed items into resolved structures.
- `compiler/crates/beskid_analysis/src/analysis/` consumes those shapes for semantic passes.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: AST and HIR shape contract - FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/ast-hir-shape-contract/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/ast-hir-shape-contract/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `405793b74be8423c28411a43fa0c3e99360cb1377051ef4492a5693475713e30`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **faq and troubleshooting** for **ast and hir shape contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/syntax/items/` exposes AST-like syntax node shapes.
- `compiler/crates/beskid_analysis/src/resolve/items.rs` maps parsed items into resolved structures.
- `compiler/crates/beskid_analysis/src/analysis/` consumes those shapes for semantic passes.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: AST and HIR shape contract - Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/ast-hir-shape-contract/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/ast-hir-shape-contract/articles/flow-and-algorithm/content.md`  
**SHA-256:** `02d26cf0dafa45aaf75da3561b88c796f179281c582c9a69d0e216a49eab39af`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **flow and algorithm** for **ast and hir shape contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/syntax/items/` exposes AST-like syntax node shapes.
- `compiler/crates/beskid_analysis/src/resolve/items.rs` maps parsed items into resolved structures.
- `compiler/crates/beskid_analysis/src/analysis/` consumes those shapes for semantic passes.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: AST and HIR shape contract - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/ast-hir-shape-contract/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/ast-hir-shape-contract/articles/verification-and-traceability/content.md`  
**SHA-256:** `1e78903a10ebe510c86f5f5923897d9c5c80fbae187c7912b2c17ffc4e740baa`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **verification and traceability** for **ast and hir shape contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/syntax/items/` exposes AST-like syntax node shapes.
- `compiler/crates/beskid_analysis/src/resolve/items.rs` maps parsed items into resolved structures.
- `compiler/crates/beskid_analysis/src/analysis/` consumes those shapes for semantic passes.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>
