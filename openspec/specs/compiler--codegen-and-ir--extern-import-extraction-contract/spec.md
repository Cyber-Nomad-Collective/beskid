<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Extern import extraction contract Specification

## Purpose

Feature hub for the extern import extraction contract in the reference compiler.

## Requirements

### Requirement: Feature hub authority: Decision [D-COMP-IR-0004]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-F2E3D9313F48`  
**Legacy source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `25cfb89deaeb8fa39b289838112c38b0cbb2305f199b668f24980df6f1d39721`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-IR-0005]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-A74D6387D95F`  
**Legacy source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `5620a9fa9908fae8c08bfd3c30980ad18efba5ba69e59e0a8da09228041c59cb`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Extern import metadata at lowering: Decision [D-COMP-IR-0006]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Extern imports are collected during lowering (`ExternImport` in codegen context) with ABI names from `beskid_abi`—not ad hoc engine scans.

**Stable ID:** `BSP-REQ-C847E47DC1B1`  
**Legacy source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/adr/0003-extern-import-metadata-lowering/content.md`  
**Source SHA-256:** `3c97af04d3b9ae7abe9b561bc6d61cca66529b05da1135d05ab84ca3007ad4db`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Extern import extraction contract

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/content.md`  
**SHA-256:** `150da27ae23601dffec3b8ea51ccbc3713996cf78cd03fda5d77530f1c636d86`

<details>
<summary>Migrated source text</summary>

``````markdown
This feature hub defines the normative contract for **extern import extraction contract** and links newcomer-oriented reference articles.

## Implementation anchors
- `compiler/crates/beskid_abi/src/builtins.rs` and `symbols.rs` define import-facing ABI names.
- `compiler/crates/beskid_runtime/src/builtins/mod.rs` provides runtime implementations for extracted imports.
- `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs` verifies extern calls end-to-end.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-IR-0004` … `D-COMP-IR-0006`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Extern import extraction contract - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Extern import extraction contract - Design model](./articles/design-model/)
- [Extern import extraction contract - Examples](./articles/examples/)
- [Extern import extraction contract - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Extern import extraction contract - Flow and algorithm](./articles/flow-and-algorithm/)
- [Extern import extraction contract - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `25cfb89deaeb8fa39b289838112c38b0cbb2305f199b668f24980df6f1d39721`

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

- `site/website/src/content/docs/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `5620a9fa9908fae8c08bfd3c30980ad18efba5ba69e59e0a8da09228041c59cb`

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

- `compiler/crates/beskid_abi/src/builtins.rs`
- `compiler/crates/beskid_runtime/src/builtins/mod.rs`
- `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs`
``````

</details>

### Source Record: Extern import metadata at lowering

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/adr/0003-extern-import-metadata-lowering/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/adr/0003-extern-import-metadata-lowering/content.md`  
**SHA-256:** `3c97af04d3b9ae7abe9b561bc6d61cca66529b05da1135d05ab84ca3007ad4db`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

FFI symbols were discovered late in the engine.

## Decision

Extern imports are collected during lowering (`ExternImport` in codegen context) with ABI names from `beskid_abi`—not ad hoc engine scans.

## Consequences

Link-time binding stays aligned with language-meta C ABI profile.

## Verification anchors

- `compiler/crates/beskid_codegen/src/lowering/`
- `compiler/crates/beskid_abi/src/symbols.rs`.
``````

</details>

### Source Record: Extern import extraction contract - Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `9f21b0861672e857f3a8eee81a066b6b7830ce823da15464f732b257120eaabe`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **contracts and edge cases** for **extern import extraction contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_abi/src/builtins.rs` and `symbols.rs` define import-facing ABI names.
- `compiler/crates/beskid_runtime/src/builtins/mod.rs` provides runtime implementations for extracted imports.
- `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs` verifies extern calls end-to-end.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Extern import extraction contract - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/articles/design-model/content.md`  
**SHA-256:** `c9cad2407c45f9e5980d15969bb7c65f64914568cdf4f7ba7ed2481821d0a472`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **design model** for **extern import extraction contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_abi/src/builtins.rs` and `symbols.rs` define import-facing ABI names.
- `compiler/crates/beskid_runtime/src/builtins/mod.rs` provides runtime implementations for extracted imports.
- `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs` verifies extern calls end-to-end.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Extern import extraction contract - Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/articles/examples/content.md`  
**SHA-256:** `737219dce5e4bdda4685322b8a500510969d74b8529ac317dc8c405254738ccb`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **examples** for **extern import extraction contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_abi/src/builtins.rs` and `symbols.rs` define import-facing ABI names.
- `compiler/crates/beskid_runtime/src/builtins/mod.rs` provides runtime implementations for extracted imports.
- `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs` verifies extern calls end-to-end.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Extern import extraction contract - FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `020804ef36ade2aaba12cf9d7a7fcd22d51a61bf2bd4a7ea40b4fc47e76bf149`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **faq and troubleshooting** for **extern import extraction contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_abi/src/builtins.rs` and `symbols.rs` define import-facing ABI names.
- `compiler/crates/beskid_runtime/src/builtins/mod.rs` provides runtime implementations for extracted imports.
- `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs` verifies extern calls end-to-end.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Extern import extraction contract - Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/articles/flow-and-algorithm/content.md`  
**SHA-256:** `8d05d4549b320d64932a662a8167167a63d1ce0c2e109489a17c82524c5e0bc9`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **flow and algorithm** for **extern import extraction contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_abi/src/builtins.rs` and `symbols.rs` define import-facing ABI names.
- `compiler/crates/beskid_runtime/src/builtins/mod.rs` provides runtime implementations for extracted imports.
- `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs` verifies extern calls end-to-end.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Extern import extraction contract - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/extern-import-extraction-contract/articles/verification-and-traceability/content.md`  
**SHA-256:** `dc97dc11d27a7a4fd3331aecc62e267b1d92730fcb495fe3ed1cf71f6b6f1203`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **verification and traceability** for **extern import extraction contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_abi/src/builtins.rs` and `symbols.rs` define import-facing ABI names.
- `compiler/crates/beskid_runtime/src/builtins/mod.rs` provides runtime implementations for extracted imports.
- `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs` verifies extern calls end-to-end.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>
