<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Registry and overrides contract Specification

## Purpose

Feature hub for the registry and overrides contract in the reference compiler.

## Requirements

### Requirement: Feature hub authority: Decision [D-COMP-PROJ-0007]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-FF5FF891D448`  
**Legacy source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `411bec9cc57adc0d171cecc694b593dfaf58396fd5fb98164363a1741655708e`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-PROJ-0008]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-C5EF7A7578DB`  
**Legacy source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `12a6c3fc25e0e12f771f05ae2bece45aea34e875b5eb6d8e12d94e1e31b10626`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Primary contract for Registry and overrides contract: Decision [D-COMP-PROJ-0009]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> The reference compiler **must** implement Registry and overrides contract as documented in this feature hub and its article bundle.

**Stable ID:** `BSP-REQ-ADE20C343970`  
**Legacy source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/adr/0003-primary-contract-choice/content.md`  
**Source SHA-256:** `8b0982b99c601760b27b0b4e378cf1d1f70201747b60d520ca5bbcd41db10787`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Registry and overrides contract

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/content.md`  
**SHA-256:** `765af171a4412c320612f4b1153feb13ea61b1311a36af9d0e9e5187b531d809`

<details>
<summary>Migrated source text</summary>

``````markdown
This feature hub defines the normative contract for **registry and overrides contract** and links newcomer-oriented reference articles.

## Implementation anchors
- `compiler/crates/beskid_tests/src/projects/corelib/mod.rs` validates project source selection behavior.
- `compiler/crates/beskid_cli/src/commands/` provides CLI-level switches for registry interaction.
- `compiler/crates/beskid_pckg_server/` is the registry-side system consumed by compiler/project tooling.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-PROJ-0007` … `D-COMP-PROJ-0009`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Registry and overrides contract - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Registry and overrides contract - Design model](./articles/design-model/)
- [Registry and overrides contract - Examples](./articles/examples/)
- [Registry and overrides contract - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Registry and overrides contract - Flow and algorithm](./articles/flow-and-algorithm/)
- [Registry and overrides contract - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `411bec9cc57adc0d171cecc694b593dfaf58396fd5fb98164363a1741655708e`

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

- `site/website/src/content/docs/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `12a6c3fc25e0e12f771f05ae2bece45aea34e875b5eb6d8e12d94e1e31b10626`

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

- `compiler/crates/beskid_tests/src/projects/corelib/mod.rs`
- `compiler/crates/beskid_cli/src/commands/`
``````

</details>

### Source Record: Primary contract for Registry and overrides contract

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/adr/0003-primary-contract-choice/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/adr/0003-primary-contract-choice/content.md`  
**SHA-256:** `8b0982b99c601760b27b0b4e378cf1d1f70201747b60d520ca5bbcd41db10787`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

This feature hub defines the normative contract for **registry and overrides contract** and links newcomer-oriented reference articles.

## Decision

The reference compiler **must** implement Registry and overrides contract as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_tests/src/projects/corelib/mod.rs`
- `compiler/crates/beskid_cli/src/commands/`
``````

</details>

### Source Record: Registry and overrides contract - Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `bcdbbdb57e3422d72f9f97c8233aba5211915dbeaec333f5bd935e6bacd0aafb`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **contracts and edge cases** for **registry and overrides contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_tests/src/projects/corelib/mod.rs` validates project source selection behavior.
- `compiler/crates/beskid_cli/src/commands/` provides CLI-level switches for registry interaction.
- `compiler/crates/beskid_pckg_server/` is the registry-side system consumed by compiler/project tooling.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Registry and overrides contract - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/articles/design-model/content.md`  
**SHA-256:** `eb9c93cf75a181d77999d7010ab77fdb82543cd04e9807c30721825201549227`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **design model** for **registry and overrides contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_tests/src/projects/corelib/mod.rs` validates project source selection behavior.
- `compiler/crates/beskid_cli/src/commands/` provides CLI-level switches for registry interaction.
- `compiler/crates/beskid_pckg_server/` is the registry-side system consumed by compiler/project tooling.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Registry and overrides contract - Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/articles/examples/content.md`  
**SHA-256:** `9171e1984abb1c460b7ab48a9d435aa43c03c29f662d1218186f07a8aba1ffb0`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **examples** for **registry and overrides contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_tests/src/projects/corelib/mod.rs` validates project source selection behavior.
- `compiler/crates/beskid_cli/src/commands/` provides CLI-level switches for registry interaction.
- `compiler/crates/beskid_pckg_server/` is the registry-side system consumed by compiler/project tooling.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Registry and overrides contract - FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `7480e497b07e0b3bcaa10c03b3e50c3d591b242a4fee10fcedcf1ff4dd48d90d`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **faq and troubleshooting** for **registry and overrides contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_tests/src/projects/corelib/mod.rs` validates project source selection behavior.
- `compiler/crates/beskid_cli/src/commands/` provides CLI-level switches for registry interaction.
- `compiler/crates/beskid_pckg_server/` is the registry-side system consumed by compiler/project tooling.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Registry and overrides contract - Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/articles/flow-and-algorithm/content.md`  
**SHA-256:** `1e140523998e8f29099373ed6ae6c09f99e9c2039acb9b9d228ebbb5929a19ae`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **flow and algorithm** for **registry and overrides contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_tests/src/projects/corelib/mod.rs` validates project source selection behavior.
- `compiler/crates/beskid_cli/src/commands/` provides CLI-level switches for registry interaction.
- `compiler/crates/beskid_pckg_server/` is the registry-side system consumed by compiler/project tooling.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Registry and overrides contract - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/registry-and-overrides-contract/articles/verification-and-traceability/content.md`  
**SHA-256:** `a699c852297d0bb7e66954b98a0bb08b407902a2e2cdaf16f174ae787d4936fd`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **verification and traceability** for **registry and overrides contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_tests/src/projects/corelib/mod.rs` validates project source selection behavior.
- `compiler/crates/beskid_cli/src/commands/` provides CLI-level switches for registry interaction.
- `compiler/crates/beskid_pckg_server/` is the registry-side system consumed by compiler/project tooling.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>
