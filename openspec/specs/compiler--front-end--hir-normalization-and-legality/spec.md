<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# HIR normalization and legality Specification

## Purpose

Feature hub for the hir normalization and legality in the reference compiler.

## Requirements

### Requirement: Feature hub authority: Decision [D-COMP-FRONT-0007]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-84D33E560EAE`  
**Legacy source:** `site/spec-content/platform-spec/compiler/front-end/hir-normalization-and-legality/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `924b4426feb684b4d08aae2df8af0f1ddea8320e0b7fffcc74a5c5aeeb10ff3d`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-FRONT-0008]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-E43035C57534`  
**Legacy source:** `site/spec-content/platform-spec/compiler/front-end/hir-normalization-and-legality/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `dcc2b825dff4ef4ca4e24df265ec74857f5d115a3d3a562925b78395b0e1883b`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Primary contract for HIR normalization and legality: Decision [D-COMP-FRONT-0009]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> The reference compiler **must** implement HIR normalization and legality as documented in this feature hub and its article bundle.

**Stable ID:** `BSP-REQ-0CFFA5901CDF`  
**Legacy source:** `site/spec-content/platform-spec/compiler/front-end/hir-normalization-and-legality/adr/0003-primary-contract-choice/content.md`  
**Source SHA-256:** `370394e7798a2cd00f88a9753477bd3d2d13de196bff428fbbeb502f98961a65`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: HIR normalization and legality

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/hir-normalization-and-legality/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/hir-normalization-and-legality/content.md`  
**SHA-256:** `665de56a38e58e69b0e403b957552fab25d115e9e5a98afe738b199fc8095d5e`

<details>
<summary>Migrated source text</summary>

``````markdown
This feature hub defines the normative contract for **hir normalization and legality** and links newcomer-oriented reference articles.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/resolve/mod.rs` orchestrates normalization boundaries.
- `compiler/crates/beskid_analysis/src/resolve/resolver.rs` enforces legality while resolving symbols.
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/definitions.rs` validates post-normalization invariants.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-FRONT-0007` … `D-COMP-FRONT-0009`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [HIR normalization and legality - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [HIR normalization and legality - Design model](./articles/design-model/)
- [HIR normalization and legality - Examples](./articles/examples/)
- [HIR normalization and legality - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [HIR normalization and legality - Flow and algorithm](./articles/flow-and-algorithm/)
- [HIR normalization and legality - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/hir-normalization-and-legality/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/hir-normalization-and-legality/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `924b4426feb684b4d08aae2df8af0f1ddea8320e0b7fffcc74a5c5aeeb10ff3d`

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

- `site/website/src/content/docs/platform-spec/compiler/front-end/hir-normalization-and-legality/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/hir-normalization-and-legality/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/hir-normalization-and-legality/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `dcc2b825dff4ef4ca4e24df265ec74857f5d115a3d3a562925b78395b0e1883b`

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

- `compiler/crates/beskid_analysis/src/resolve/mod.rs`
- `compiler/crates/beskid_analysis/src/resolve/resolver.rs`
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/definitions.rs`
``````

</details>

### Source Record: Primary contract for HIR normalization and legality

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/hir-normalization-and-legality/adr/0003-primary-contract-choice/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/hir-normalization-and-legality/adr/0003-primary-contract-choice/content.md`  
**SHA-256:** `370394e7798a2cd00f88a9753477bd3d2d13de196bff428fbbeb502f98961a65`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

This feature hub defines the normative contract for **hir normalization and legality** and links newcomer-oriented reference articles.

## Decision

The reference compiler **must** implement HIR normalization and legality as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/src/resolve/mod.rs`
- `compiler/crates/beskid_analysis/src/resolve/resolver.rs`
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/definitions.rs`
``````

</details>

### Source Record: HIR normalization and legality - Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/hir-normalization-and-legality/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/hir-normalization-and-legality/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `70c44f9bc2e235aed198812a685626a6c4d19434e142017eaf65de40b0cc3e71`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **contracts and edge cases** for **hir normalization and legality** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/resolve/mod.rs` orchestrates normalization boundaries.
- `compiler/crates/beskid_analysis/src/resolve/resolver.rs` enforces legality while resolving symbols.
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/definitions.rs` validates post-normalization invariants.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: HIR normalization and legality - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/hir-normalization-and-legality/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/hir-normalization-and-legality/articles/design-model/content.md`  
**SHA-256:** `2db383e2dffcd441e9ef7b98a8d523515bd49b004f5f5612762a723c71184587`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **design model** for **hir normalization and legality** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/resolve/mod.rs` orchestrates normalization boundaries.
- `compiler/crates/beskid_analysis/src/resolve/resolver.rs` enforces legality while resolving symbols.
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/definitions.rs` validates post-normalization invariants.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: HIR normalization and legality - Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/hir-normalization-and-legality/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/hir-normalization-and-legality/articles/examples/content.md`  
**SHA-256:** `7252e7216cec137c6c38f408579f1c85b707addf1ee44b5462709e54b8d1bd8f`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **examples** for **hir normalization and legality** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/resolve/mod.rs` orchestrates normalization boundaries.
- `compiler/crates/beskid_analysis/src/resolve/resolver.rs` enforces legality while resolving symbols.
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/definitions.rs` validates post-normalization invariants.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: HIR normalization and legality - FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/hir-normalization-and-legality/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/hir-normalization-and-legality/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `9c423bbcf203b803c57315cca2fb58ecb10b26c5f52c68157e3ec662031a3409`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **faq and troubleshooting** for **hir normalization and legality** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/resolve/mod.rs` orchestrates normalization boundaries.
- `compiler/crates/beskid_analysis/src/resolve/resolver.rs` enforces legality while resolving symbols.
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/definitions.rs` validates post-normalization invariants.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: HIR normalization and legality - Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/hir-normalization-and-legality/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/hir-normalization-and-legality/articles/flow-and-algorithm/content.md`  
**SHA-256:** `162a3debc3ca18c2842d607c2d6669565d2434df5be3200ed781cb1521fbf4fc`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **flow and algorithm** for **hir normalization and legality** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/resolve/mod.rs` orchestrates normalization boundaries.
- `compiler/crates/beskid_analysis/src/resolve/resolver.rs` enforces legality while resolving symbols.
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/definitions.rs` validates post-normalization invariants.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: HIR normalization and legality - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/front-end/hir-normalization-and-legality/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/front-end/hir-normalization-and-legality/articles/verification-and-traceability/content.md`  
**SHA-256:** `b846940016daf32d21bc7b75bdfc2f6bd7e91be6e5c6fa80320473235a9de75c`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **verification and traceability** for **hir normalization and legality** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/resolve/mod.rs` orchestrates normalization boundaries.
- `compiler/crates/beskid_analysis/src/resolve/resolver.rs` enforces legality while resolving symbols.
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/definitions.rs` validates post-normalization invariants.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>
