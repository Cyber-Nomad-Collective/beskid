<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Workspace and lock contracts Specification

## Purpose

Compiler workspace graph, lock materialization, and resolution diagnostics (schema defers to tooling).

## Requirements

### Requirement: Feature hub authority: Decision [D-COMP-PROJ-0010]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-C9A560B9D354`  
**Legacy source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `28884faf2049b6a0c208bc82a95653c2aff3b4ffc7845bc72d6db71470e0b04b`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-PROJ-0011]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-496EBEF9B4BD`  
**Legacy source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `9e97c3006317a48fd066a9403669309d715c19fd88e101eb245dca2139d0e5c4`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Lockfile pins drive resolution: Decision [D-COMP-PROJ-0012]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Workspace resolution **must** honor lockfile pins from `beskid_analysis::resolve` before applying CLI overrides.

**Stable ID:** `BSP-REQ-3FF390873D74`  
**Legacy source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/adr/0003-lockfile-pins-resolution/content.md`  
**Source SHA-256:** `61fa3fcf096c5f6b3e1f41219cea7c72e243d72ef38e16542ef6dafe07fdfff1`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Workspace and lock contracts

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/content.md`  
**SHA-256:** `dbb883f6dcc82deafe010967f1703b76f4f6744dfdd45ad9f76b88d76e1c124e`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="Authority split" id="authority-split">
**Tooling** owns **`Workspace.proj` / lockfile** schema, update commands, and author-facing reserved-key tables. **This feature** owns how the compiler **materializes** the dependency graph from locks, **rejects** inconsistent workspace layouts, and **diagnoses** resolution failures during analysis and CI builds.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/crates/beskid_analysis/src/resolve/mod.rs` — project and dependency resolution
- `compiler/crates/beskid_cli/src/commands/` — lock policy flags and update entrypoints
- `compiler/crates/beskid_tests/src/projects/corelib/compile.rs` and `layout.rs` — lock-sensitive workspace fixtures
- `compiler/crates/beskid_tests/src/analysis/pipeline/core.rs` — workspace pipeline tests
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-PROJ-0010` … `D-COMP-PROJ-0012`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Workspace and lock contracts - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Workspace and lock contracts - Design model](./articles/design-model/)
- [Workspace and lock contracts - Examples](./articles/examples/)
- [Workspace and lock contracts - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Workspace and lock contracts - Flow and algorithm](./articles/flow-and-algorithm/)
- [Workspace and lock contracts - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `28884faf2049b6a0c208bc82a95653c2aff3b4ffc7845bc72d6db71470e0b04b`

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

- `site/website/src/content/docs/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `9e97c3006317a48fd066a9403669309d715c19fd88e101eb245dca2139d0e5c4`

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
- `compiler/crates/beskid_cli/src/commands/`
- `compiler/crates/beskid_tests/src/projects/corelib/compile.rs`
``````

</details>

### Source Record: Lockfile pins drive resolution

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/adr/0003-lockfile-pins-resolution/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/adr/0003-lockfile-pins-resolution/content.md`  
**SHA-256:** `61fa3fcf096c5f6b3e1f41219cea7c72e243d72ef38e16542ef6dafe07fdfff1`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Floating registry versions broke reproducible compiles.

## Decision

Workspace resolution **must** honor lockfile pins from `beskid_analysis::resolve` before applying CLI overrides.

## Consequences

Lock update commands are explicit; silent refresh is forbidden in CI modes.

## Verification anchors

- `compiler/crates/beskid_analysis/src/resolve/mod.rs`
- `compiler/crates/beskid_cli/src/commands/`.
``````

</details>

### Source Record: Workspace and lock contracts - Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `63d5d030ae774ace38275d7d4611e553a7a4dd74c54c75706597f9f69eb30c30`

<details>
<summary>Migrated source text</summary>

``````markdown
## Compiler contracts

- **Deterministic graph** — Given the same lock snapshot and workspace layout, resolution produces the same member DAG.
- **Layout invariants** — Folder layout under workspace members must match what lock materialization expects; violations fail before semantic analysis.
- **No silent lock ignore** — When CI or `--locked` policy is active, missing or stale locks are errors, not warnings-only, unless tooling explicitly defines a warning mode for that command.

## Edge cases (resolution)

- **Stale lock vs registry** — Pin resolution failures surface at materialize time with stable diagnostics.
- **Partial member checkout** — Missing member directories fail graph build with layout-specific codes.
- **Cross-feature manifest errors** — Invalid `Project.proj` nodes still fail in the project-manifest resolution path first.

Workspace key forbiddances and reserved names are specified in **[tooling / design model](/platform-spec/tooling/manifests-and-lockfiles/workspace-and-lock-contracts/design-model/)** and are not duplicated here.

## Code anchors

- `compiler/crates/beskid_tests/src/projects/corelib/compile.rs`
- `compiler/crates/beskid_tests/src/projects/corelib/layout.rs`
- `compiler/crates/beskid_cli/src/commands/`
``````

</details>

### Source Record: Workspace and lock contracts - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/design-model/content.md`  
**SHA-256:** `bd4527f3bf3480fdae023e045826ecfa5927a57722d8795ef51f22ce76a64cad`

<details>
<summary>Migrated source text</summary>

``````markdown
## Resolution model (compiler)

| Entity | Role |
| --- | --- |
| Workspace root | Anchor for member `Project.proj` discovery |
| Lock snapshot | Pinned dependency versions consumed when building the graph |
| Materialized package root | On-disk layout the resolver uses after lock apply |

The compiler **must** treat lock-backed roots as authoritative for reproducible CI graphs. Ad-hoc workspace toggles that alter Mod policy without a spec bump are rejected at parse time in tooling; the compiler enforces the resulting graph only.

## Schema authority

Reserved and forbidden **`Workspace.proj`** keys, `defaultMember`, and lock update semantics are defined in **[tooling / design model](/platform-spec/tooling/manifests-and-lockfiles/workspace-and-lock-contracts/design-model/)**. This article does not duplicate those tables.

## Code anchors

- `compiler/crates/beskid_analysis/src/resolve/mod.rs`
- `compiler/crates/beskid_cli/src/commands/`
- `compiler/crates/beskid_tests/src/projects/corelib/layout.rs`
``````

</details>

### Source Record: Workspace and lock contracts - Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/examples/content.md`  
**SHA-256:** `23d6b0ec990477e187a3d1fa72e687469c5fd05a4476aaa193ef4fd76ec08e73`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **examples** for **workspace and lock contracts** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_tests/src/projects/corelib/compile.rs` covers lock-sensitive workspace builds.
- `compiler/crates/beskid_tests/src/projects/corelib/layout.rs` validates workspace folder invariants.
- `compiler/crates/beskid_cli/src/commands/` is the public entrypoint for lock policy flags.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Workspace and lock contracts - FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `a8c8502db9229486391887b91bcae54c7aa0e0630cadc61fed817888bd0d8f92`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **faq and troubleshooting** for **workspace and lock contracts** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_tests/src/projects/corelib/compile.rs` covers lock-sensitive workspace builds.
- `compiler/crates/beskid_tests/src/projects/corelib/layout.rs` validates workspace folder invariants.
- `compiler/crates/beskid_cli/src/commands/` is the public entrypoint for lock policy flags.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Workspace and lock contracts - Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/flow-and-algorithm/content.md`  
**SHA-256:** `51dc50eb6420e087177974b3d1583ac9df9ed7a4f825f7dca9065162c8f4085c`

<details>
<summary>Migrated source text</summary>

``````markdown
## Resolution flow

1. **Locate** workspace root and member projects.
2. **Load** lock snapshot (or fail if policy requires a lock and none is present).
3. **Materialize** dependency roots from lock pins into the resolver cache layout.
4. **Build** the combined workspace/project graph (see [project manifest contract / flow](/platform-spec/compiler/resolution-and-projects/project-manifest-contract/flow-and-algorithm/)).
5. Proceed to analysis only when graph and layout invariants pass.

CLI lock **update** and author workflows are described under **[tooling / flow and algorithm](/platform-spec/tooling/manifests-and-lockfiles/workspace-and-lock-contracts/flow-and-algorithm/)**.

## Code anchors

- `compiler/crates/beskid_analysis/src/resolve/mod.rs`
- `compiler/crates/beskid_cli/src/commands/`
- `compiler/crates/beskid_tests/src/analysis/pipeline/core.rs`
``````

</details>

### Source Record: Workspace and lock contracts - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/articles/verification-and-traceability/content.md`  
**SHA-256:** `ecb047a348e486481d1eb494e18b8f0f32161b15e25875099c5126be1a27eb45`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **verification and traceability** for **workspace and lock contracts** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_tests/src/projects/corelib/compile.rs` covers lock-sensitive workspace builds.
- `compiler/crates/beskid_tests/src/projects/corelib/layout.rs` validates workspace folder invariants.
- `compiler/crates/beskid_cli/src/commands/` is the public entrypoint for lock policy flags.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>
