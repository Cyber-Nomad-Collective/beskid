<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Dependency workspace and lockfile Specification

## Purpose

Canonical compiler contract for compile plans, workspace materialization, lockfile policy, and dependency source trees.

## Requirements

### Requirement: Feature hub authority: Decision [D-COMP-BUILD-0007]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-2A95FBFCB5E4`  
**Legacy source:** `site/spec-content/platform-spec/compiler/build-pipeline/dependency-workspace/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `fec8b1fe0589abe566ced68c4c5e76e11335e4b73d0f887a71308fccc1e387f3`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-BUILD-0008]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-09810C120833`  
**Legacy source:** `site/spec-content/platform-spec/compiler/build-pipeline/dependency-workspace/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `89ac2024b27d3722c9e12e7e5ef456871c9d8652d14e9aa7b329990dad2166bf`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Primary contract for Dependency workspace and lockfile: Decision [D-COMP-BUILD-0009]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> The reference compiler **must** implement Dependency workspace and lockfile as documented in this feature hub and its article bundle.

**Stable ID:** `BSP-REQ-D4069164FA39`  
**Legacy source:** `site/spec-content/platform-spec/compiler/build-pipeline/dependency-workspace/adr/0003-primary-contract-choice/content.md`  
**Source SHA-256:** `482311e2fb1305331b9779506b6e1e7505e908224d5adc01f4615039e8a3d046`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Dependency workspace and lockfile

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/dependency-workspace/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/dependency-workspace/content.md`  
**SHA-256:** `d758234df2fac168d7a82c9665c5d4a0cc3970c3c355429dd4b38a4bbc16cdc9`

<details>
<summary>Migrated source text</summary>

``````markdown
This feature hub specifies how manifests become prepared dependency workspaces and how `Project.lock` is synchronized under `--locked` and `--frozen`.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/projects/` — workspace materialization and dependency graph
- `compiler/crates/beskid_pipeline/src/phases.rs` — pipeline stage ordering gates
- `compiler/crates/beskid_cli/src/commands/` — lock policy flags (`--locked`, `--frozen`)

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-BUILD-0007` … `D-COMP-BUILD-0009`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Dependency workspace and lockfile - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Dependency workspace and lockfile - Design model](./articles/design-model/)
- [Dependency workspace and lockfile - Examples](./articles/examples/)
- [Dependency workspace and lockfile - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Dependency workspace and lockfile - Flow and algorithm](./articles/flow-and-algorithm/)
- [Dependency workspace and lockfile - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/dependency-workspace/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/dependency-workspace/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `fec8b1fe0589abe566ced68c4c5e76e11335e4b73d0f887a71308fccc1e387f3`

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

- `site/website/src/content/docs/platform-spec/compiler/build-pipeline/dependency-workspace/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/dependency-workspace/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/dependency-workspace/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `89ac2024b27d3722c9e12e7e5ef456871c9d8652d14e9aa7b329990dad2166bf`

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

- `compiler/crates/beskid_analysis/`
``````

</details>

### Source Record: Primary contract for Dependency workspace and lockfile

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/dependency-workspace/adr/0003-primary-contract-choice/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/dependency-workspace/adr/0003-primary-contract-choice/content.md`  
**SHA-256:** `482311e2fb1305331b9779506b6e1e7505e908224d5adc01f4615039e8a3d046`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

This feature hub specifies how manifests become prepared dependency workspaces and how `Project.lock` is synchronized under `--locked` and `--frozen`.

## Decision

The reference compiler **must** implement Dependency workspace and lockfile as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/`
``````

</details>

### Source Record: Dependency workspace and lockfile - Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/dependency-workspace/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/dependency-workspace/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `8b928e4f79ee977568396c17e18b0cf0444c2ea9d16d12a46791463374ef598f`

<details>
<summary>Migrated source text</summary>

``````markdown
- `--locked` must reject missing or out-of-date lockfiles.
- `--frozen` must reject changes that require writing lockfile updates.
- Registry dependency materialization failures must report stable project errors.
- Workspace prep must not silently change selected compile target.
``````

</details>

### Source Record: Dependency workspace and lockfile - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/dependency-workspace/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/dependency-workspace/articles/design-model/content.md`  
**SHA-256:** `f9b5a65f77eb0f46cc7eba944c152c717bb544ff274352f26ea2b9aa98647717`

<details>
<summary>Migrated source text</summary>

``````markdown
The model separates planning from materialization:

- `CompilePlan` describes target graph and dependency intent.
- `PreparedProjectWorkspace` records concrete source roots under `obj/beskid/deps/src`; these paths are **authoritative** for **[Program assembly](/platform-spec/compiler/build-pipeline/program-assembly/)** when present.
- `WorkspacePrepareOptions` carries lock policy (`frozen`, `locked`).
- `Project.lock` is the persisted snapshot used for repeatable resolution.
``````

</details>

### Source Record: Dependency workspace and lockfile - Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/dependency-workspace/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/dependency-workspace/articles/examples/content.md`  
**SHA-256:** `e5d19bce961eb8f094c3c62303c506a290adab709111e0ab7067b61c6cb86858`

<details>
<summary>Migrated source text</summary>

``````markdown
- **Fresh install:** no lockfile, normal mode creates `Project.lock v1`.
- **CI locked mode:** `--locked` fails if dependency versions differ from lockfile.
- **Frozen release mode:** `--frozen` compiles only when current lockfile already matches graph.
- **Registry outage:** optional dependency fetch failure is surfaced according to unresolved policy.
``````

</details>

### Source Record: Dependency workspace and lockfile - FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/dependency-workspace/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/dependency-workspace/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `6e409c0f51c59241d834f4d61f49030f35ba44f1d69af602e4177bb9d409b747`

<details>
<summary>Migrated source text</summary>

``````markdown
## Why did lock command update files unexpectedly?
Run with `--frozen` to prevent lockfile writes; normal mode allows synchronization.

## Why does locked mode fail in CI but not locally?
Local dependency graph or manifest may differ from committed lockfile.

## Where are dependency sources materialized?
Under the workspace object tree (for example `obj/beskid/deps/src`) managed by workflow services.
``````

</details>

### Source Record: Dependency workspace and lockfile - Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/dependency-workspace/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/dependency-workspace/articles/flow-and-algorithm/content.md`  
**SHA-256:** `7858c0e684b6f8aafff94dad73d6eedaa248ad5f3aca4112be6a1bae0d210dae`

<details>
<summary>Migrated source text</summary>

``````markdown
1. Build compile plan from manifest graph.
2. Materialize dependency sources into workspace object directory.
3. Read and reconcile `Project.lock` against resolved dependencies.
4. Enforce `locked`/`frozen` policy.
5. Expose final materialized source root to compile commands.

This flow is implemented in project workflow services and reused by fetch/lock/tree command surfaces.
``````

</details>

### Source Record: Dependency workspace and lockfile - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/dependency-workspace/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/dependency-workspace/articles/verification-and-traceability/content.md`  
**SHA-256:** `29cafec377f574e95196b239e9a4cf5c1159705b6d40508d798243924832ba19`

<details>
<summary>Migrated source text</summary>

``````markdown
Implementation anchors:

- `compiler/crates/beskid_analysis/src/projects/compile_plan.rs`
- `compiler/crates/beskid_analysis/src/projects/workflow.rs`
- `compiler/crates/beskid_cli/src/commands/fetch.rs`
- `compiler/crates/beskid_cli/src/commands/lock.rs`

Traceability expectation: each lock policy branch is covered by fixture-based tests.
``````

</details>
