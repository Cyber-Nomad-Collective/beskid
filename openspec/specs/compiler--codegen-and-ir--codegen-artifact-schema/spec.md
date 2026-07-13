<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Codegen artifact schema Specification

## Purpose

Feature hub for the codegen artifact schema in the reference compiler.

## Requirements

### Requirement: Feature hub authority: Decision [D-COMP-IR-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-B6AB1BF1DEE9`  
**Legacy source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `8321a9c3d1ecacba84fef0dac068cd5a329b820356c1a7ebe2d7ea6fb2f24956`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-IR-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-D95254F94CF8`  
**Legacy source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `e17f1bae62c4ce637b8b7d6616b1359a28e2312160b837781062422e686d6b53`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Primary contract for Codegen artifact schema: Decision [D-COMP-IR-0003]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> The reference compiler **must** implement Codegen artifact schema as documented in this feature hub and its article bundle.

**Stable ID:** `BSP-REQ-DAAFAA887C58`  
**Legacy source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/adr/0003-primary-contract-choice/content.md`  
**Source SHA-256:** `c597aad3881629e978e70a7f8c63d521715a76980b433040ecf9a58edbf14682`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Codegen artifact schema

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/content.md`  
**SHA-256:** `28bd98933f165ee5c9bcf0ca098a9a6cfefc08a7a47dc791e9337c0241087fe7`

<details>
<summary>Migrated source text</summary>

``````markdown
This feature hub defines the normative contract for **codegen artifact schema** and links newcomer-oriented reference articles.

## Implementation anchors
- `compiler/crates/beskid_engine/src/jit_module.rs` consumes generated artifact fields.
- `compiler/crates/beskid_tests/src/runtime/jit.rs` validates runtime execution from codegen output.
- `compiler/crates/beskid_tests/src/abi/contracts.rs` checks ABI-level schema compatibility.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-IR-0001` … `D-COMP-IR-0003`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Codegen artifact schema - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Codegen artifact schema - Design model](./articles/design-model/)
- [Codegen artifact schema - Examples](./articles/examples/)
- [Codegen artifact schema - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Codegen artifact schema - Flow and algorithm](./articles/flow-and-algorithm/)
- [Codegen artifact schema - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `8321a9c3d1ecacba84fef0dac068cd5a329b820356c1a7ebe2d7ea6fb2f24956`

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

- `site/website/src/content/docs/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `e17f1bae62c4ce637b8b7d6616b1359a28e2312160b837781062422e686d6b53`

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

- `compiler/crates/beskid_engine/src/jit_module.rs`
- `compiler/crates/beskid_tests/src/runtime/jit.rs`
- `compiler/crates/beskid_tests/src/abi/contracts.rs`
``````

</details>

### Source Record: Primary contract for Codegen artifact schema

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/adr/0003-primary-contract-choice/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/adr/0003-primary-contract-choice/content.md`  
**SHA-256:** `c597aad3881629e978e70a7f8c63d521715a76980b433040ecf9a58edbf14682`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

This feature hub defines the normative contract for **codegen artifact schema** and links newcomer-oriented reference articles.

## Decision

The reference compiler **must** implement Codegen artifact schema as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_engine/src/jit_module.rs`
- `compiler/crates/beskid_tests/src/runtime/jit.rs`
- `compiler/crates/beskid_tests/src/abi/contracts.rs`
``````

</details>

### Source Record: Codegen artifact schema - Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `e31fd664749ac728821e3541f26defe0e0ff2f45ab959491012f530247d6d003`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **contracts and edge cases** for **codegen artifact schema** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_engine/src/jit_module.rs` consumes generated artifact fields.
- `compiler/crates/beskid_tests/src/runtime/jit.rs` validates runtime execution from codegen output.
- `compiler/crates/beskid_tests/src/abi/contracts.rs` checks ABI-level schema compatibility.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Codegen artifact schema - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/articles/design-model/content.md`  
**SHA-256:** `6da3fc4b71dc21ec7e11af0ae0d9ad8d26942f747e01f6dad847cd567ac11552`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **design model** for **codegen artifact schema** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_engine/src/jit_module.rs` consumes generated artifact fields.
- `compiler/crates/beskid_tests/src/runtime/jit.rs` validates runtime execution from codegen output.
- `compiler/crates/beskid_tests/src/abi/contracts.rs` checks ABI-level schema compatibility.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Codegen artifact schema - Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/articles/examples/content.md`  
**SHA-256:** `9d654a1352f6589704f995be56f672e9dcb85f3de773c45d24e9f8de3a84a9bf`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **examples** for **codegen artifact schema** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_engine/src/jit_module.rs` consumes generated artifact fields.
- `compiler/crates/beskid_tests/src/runtime/jit.rs` validates runtime execution from codegen output.
- `compiler/crates/beskid_tests/src/abi/contracts.rs` checks ABI-level schema compatibility.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Codegen artifact schema - FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `70413eb1da1280e7868afdf987a9c71d6847934447e33106bc3aafe9862c9085`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **faq and troubleshooting** for **codegen artifact schema** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_engine/src/jit_module.rs` consumes generated artifact fields.
- `compiler/crates/beskid_tests/src/runtime/jit.rs` validates runtime execution from codegen output.
- `compiler/crates/beskid_tests/src/abi/contracts.rs` checks ABI-level schema compatibility.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Codegen artifact schema - Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/articles/flow-and-algorithm/content.md`  
**SHA-256:** `f7fcba717ed2eddb7062dadc72b1709a7e1deb40abce6eb8723b519592a35b08`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **flow and algorithm** for **codegen artifact schema** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_engine/src/jit_module.rs` consumes generated artifact fields.
- `compiler/crates/beskid_tests/src/runtime/jit.rs` validates runtime execution from codegen output.
- `compiler/crates/beskid_tests/src/abi/contracts.rs` checks ABI-level schema compatibility.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Codegen artifact schema - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/codegen-artifact-schema/articles/verification-and-traceability/content.md`  
**SHA-256:** `d73ef026d1929db9355d1e24bac58e564c698b7d6e373fef743b60295df27bd6`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **verification and traceability** for **codegen artifact schema** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_engine/src/jit_module.rs` consumes generated artifact fields.
- `compiler/crates/beskid_tests/src/runtime/jit.rs` validates runtime execution from codegen output.
- `compiler/crates/beskid_tests/src/abi/contracts.rs` checks ABI-level schema compatibility.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>
