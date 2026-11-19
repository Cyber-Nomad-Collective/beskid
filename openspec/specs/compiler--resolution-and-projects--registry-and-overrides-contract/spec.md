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

### Requirement: Strict registry coordinates and stable addition
Requested exact coordinates SHALL resolve only to that non-yanked version; missing/yanked requests, unknown aliases, malformed responses and unavailable required artifacts SHALL fail without substitution or warning-only executable success. Diagnostics SHALL identify package, requested version and registry with credential-free recovery guidance. Bare add SHALL select the greatest non-yanked stable semantic version by semantic-version precedence; stable SHALL have no prerelease component. Equal-precedence build-metadata variants SHALL use lexicographically greatest full version text as deterministic tie-break. Response order SHALL NOT affect selection. Malformed version data SHALL fail; no eligible stable version SHALL produce explicit-version guidance. Selected intent SHALL be exact and SHALL NOT introduce range solving.

#### Scenario: DEP06-02 Exact request
- **GIVEN** requested version absent while another active version exists
- **WHEN** add or required resolution runs
- **THEN** it fails without substitution and mutation preserves original manifest/lock

#### Scenario: DEP06-02 Required unavailable
- **GIVEN** unlocked required package and malformed response or registry 503
- **WHEN** add/build attempts resolution
- **THEN** it fails rather than reporting successful unresolved warning

#### Scenario: DEP06-02 Stable policy
- **GIVEN** stable 1.0.0 and 2.0.0 plus 3.0.0-rc.1 in arbitrary response order
- **WHEN** bare add selects intent
- **THEN** it records exact 2.0.0 independent of response order

### Requirement: Transitive registry closure with one version per package
Resolution SHALL include every registry package reachable from the declared dependencies. After it selects a registry package, it SHALL read the dependencies that the verified artifact manifest declares and SHALL resolve each registry dependency with the same pin, cache, selection and workspace override rules as a declared dependency. A registry dependency of a published package SHALL use the registry rules of the consuming workspace; an unknown alias SHALL fail. Each package name SHALL have exactly one coordinate in the resolved graph: all requests for one name SHALL name the same registry and the same requested version text. Different requests SHALL fail without lock, manifest or materialization change, and the diagnostic SHALL name both requesters and both requested coordinates and SHALL recommend a workspace override. Identical requests for one package from different requesters SHALL resolve to one package with one materialized destination. Two dependency declarations SHALL NOT share one materialized destination: when one requester declares the same registry package twice, or when two different packages or dependency sources resolve to the same materialized destination, resolution SHALL fail before any lock write or materialization, and the diagnostic SHALL name the materialized destination conflict. Resolution SHALL NOT select two versions of one package and SHALL NOT perform range solving. A requirement cycle among registry packages SHALL fail with a diagnostic that names the cycle. A published package SHALL declare only registry dependencies, except the implicit Corelib `Core` dependency without a path; a path or Git dependency in a downloaded manifest SHALL fail with the package coordinate and dependency name. The lock SHALL record every reachable registry package with its exact version and artifact digest. Ordinary, locked, offline and frozen resolution SHALL replay the transitive pins and verified cached artifacts without a network request when the lock and cache cover the closure. A reachable package without a pin SHALL fail locked and offline resolution with update guidance, and a pin that is not reachable SHALL make the lock stale. A mutation SHALL select a new coordinate for a transitive package only when the package has no pin or its pin no longer matches the request, and SHALL keep every other valid pin. Add, remove and update change reports, including `--json` change records, SHALL list each registry package that no manifest declares directly and whose locked coordinate is added, removed or changed, marked as transitive, with its old and new version and artifact digest; an unchanged transitive pin SHALL NOT appear as a change.

#### Scenario: DEP06-03 Shared transitive survives removal
- **GIVEN** direct packages Alpha and Beta that both require Shared 1.0.0, and Alpha also requires OnlyAlpha
- **WHEN** the user removes Alpha
- **THEN** the lock keeps Beta and the byte-identical Shared pin and drops Alpha and OnlyAlpha

#### Scenario: DEP06-03 Conflicting transitive requests
- **GIVEN** Alpha 1.0.0 requires Shared 1.0.0 and Beta 1.0.0 requires Shared 2.0.0
- **WHEN** add or update resolves both
- **THEN** it fails, names `Alpha@1.0.0` with `Shared@1.0.0` and `Beta@1.0.0` with `Shared@2.0.0`, and changes no project byte

#### Scenario: DEP06-03 Duplicate materialized destination
- **GIVEN** a workspace plan in which one requester declares the registry package PkgCore twice
- **WHEN** preparation resolves the plan
- **THEN** it fails with a materialized destination diagnostic and creates no `obj` directory

#### Scenario: DEP06-04 Frozen replay of the closure
- **GIVEN** a lock and a warm verified cache that cover Alpha and its transitive packages
- **WHEN** frozen, offline, locked or ordinary preparation runs
- **THEN** it materializes every locked package with zero registry requests and no lock write

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
