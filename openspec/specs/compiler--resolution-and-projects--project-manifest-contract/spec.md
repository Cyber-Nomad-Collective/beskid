<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Project manifest contract Specification

## Purpose

Compiler resolution and graph contracts for Project.proj (schema and author surfaces defer to tooling).

## Requirements

### Requirement: Feature hub authority: Decision [D-COMP-PROJ-0004]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-6320FBE45B7C`  
**Legacy source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/project-manifest-contract/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `947415edc0b5f371d553de7495a8d925ad5a77ccf9d3fedf9ff86a04094f407d`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-PROJ-0005]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-4F319F95708E`  
**Legacy source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/project-manifest-contract/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `b2b92ed362ee9efcc9632cf3888a2c0c60985db5313054f27298db33897d8313`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Tooling owns schema; compiler owns graph: Decision [D-COMP-PROJ-0006]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Author-facing `Project.proj` key tables live only under tooling; this compiler feature documents resolution graph behavior and defers schema prose via `relatedTopics`.

**Stable ID:** `BSP-REQ-17F84BABAC59`  
**Legacy source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/project-manifest-contract/adr/0003-tooling-schema-compiler-graph/content.md`  
**Source SHA-256:** `c229bfef9be048848da52581c89aecab65e9c3c75624b4b14e2177bbcde85c07`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Project manifest contract

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/project-manifest-contract/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/project-manifest-contract/content.md`  
**SHA-256:** `cd026e62370a55f2ba283885f179cfb5983a6ee8379a25ddf9709e96724d79b9`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="Authority split" id="authority-split">
**Tooling** owns the normative **`Project.proj` schema** (keys, types, Mod blocks, link metadata, and CLI/LSP examples). **This feature** owns how the reference compiler **loads**, **validates in the resolution graph**, and **diagnoses** manifest-driven project graphs—without duplicating key tables.

When editing manifest keys, update [tooling / design model](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/design-model/) first; adjust compiler resolution text here only when graph behavior or diagnostic bands change.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/crates/beskid_analysis/src/bsol.pest` — Bsol surface grammar for manifests
- `compiler/crates/beskid_analysis/src/projects/bsol/` — AST builder (`parse_bsol_document`)
- `compiler/crates/beskid_analysis/src/projects/manifest_resolve.rs` — discovery and parse into workspace graph
- `compiler/crates/beskid_analysis/src/projects/graph/` — DAG insertion, Mod topology
- `compiler/crates/beskid_cli/src/commands/` — manifest-driven compile inputs
- `compiler/crates/beskid_tests/src/projects/corelib/mod.rs` and `compile.rs` — manifest fixtures
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-PROJ-0004` … `D-COMP-PROJ-0006`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Project manifest contract - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Project manifest contract - Design model](./articles/design-model/)
- [Project manifest contract - Examples](./articles/examples/)
- [Project manifest contract - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Project manifest contract - Flow and algorithm](./articles/flow-and-algorithm/)
- [Project manifest contract - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/project-manifest-contract/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/project-manifest-contract/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `947415edc0b5f371d553de7495a8d925ad5a77ccf9d3fedf9ff86a04094f407d`

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

- `site/website/src/content/docs/platform-spec/compiler/resolution-and-projects/project-manifest-contract/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/project-manifest-contract/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/project-manifest-contract/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `b2b92ed362ee9efcc9632cf3888a2c0c60985db5313054f27298db33897d8313`

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

- `compiler/crates/beskid_analysis/src/projects/manifest_resolve.rs`
- `compiler/crates/beskid_analysis/src/projects/graph/`
- `compiler/crates/beskid_cli/src/commands/`
``````

</details>

### Source Record: Tooling owns schema; compiler owns graph

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/project-manifest-contract/adr/0003-tooling-schema-compiler-graph/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/project-manifest-contract/adr/0003-tooling-schema-compiler-graph/content.md`  
**SHA-256:** `c229bfef9be048848da52581c89aecab65e9c3c75624b4b14e2177bbcde85c07`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Manifest key tables were duplicated between tooling and compiler specs.

## Decision

Author-facing `Project.proj` key tables live only under tooling; this compiler feature documents resolution graph behavior and defers schema prose via `relatedTopics`.

## Consequences

Compiler changes manifest parsing only when graph or diagnostic bands change; tooling spec leads schema edits.

## Verification anchors

- `compiler/crates/beskid_analysis/src/projects/manifest_resolve.rs`
- `tooling project-manifest-contract hub.`
``````

</details>

### Source Record: Project manifest contract - Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/project-manifest-contract/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/project-manifest-contract/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `8b97f8107c3fd47f6b1b5b0dc7e2f5341b52c2889de5f835d7896fc7b42313b7`

<details>
<summary>Migrated source text</summary>

``````markdown
## Compiler resolution contracts

- **Graph before compile** — No host `CompilePlan` runs until workspace/project DAG validation succeeds.
- **Mod carriers only in graph** — Compiler-mod contracts are reachable only through resolved `type: Mod` nodes (see tooling for manifest-level rules).
- **Stable diagnostics** — Graph and resolution failures use assigned codes in **E1801–E1899**; changing codes requires registry and test updates.
- **Transitive Mod closure** — Host builds must resolve the full transitive Mod set before `mod.load`; partial graphs are errors.

## Edge cases (resolution)

- **Dependency cycles** — Any cycle in the workspace/project graph is a hard error at graph build time.
- **Missing materialized package** — Unresolved registry or lock roots fail before analysis, with distinct codes from parse errors.
- **Lock/workspace drift** — Mismatches between lockfile pins and on-disk layout are diagnosed in the workspace feature; see [workspace and lock contracts](/platform-spec/compiler/resolution-and-projects/workspace-and-lock-contracts/).

Mod-specific manifest shape rules (`capabilities`, `maxGeneratorRounds`, host targets on Mod projects) are **not** duplicated here; see **[tooling / contracts and edge cases](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/contracts-and-edge-cases/)**.

## Code anchors

- `compiler/crates/beskid_analysis/src/projects/graph/`
- `compiler/crates/beskid_tests/src/projects/corelib/mod.rs`
- `compiler/crates/beskid_tests/src/projects/corelib/compile.rs`
``````

</details>

### Source Record: Project manifest contract - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/project-manifest-contract/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/project-manifest-contract/articles/design-model/content.md`  
**SHA-256:** `4cc5b1bf34be23e096078ea5c4f01cdd602e298702f4db59976743efc34372d7`

<details>
<summary>Migrated source text</summary>

``````markdown
## Resolution model (compiler)

After structural parse (owned by tooling schema), the compiler materializes:

| Entity | Role |
| --- | --- |
| `ProjectManifest` | Typed view of one `Project.proj` node |
| Workspace/project graph node | Member in the resolved DAG with dependency edges |
| `Mod` package node | Compiler-mod carrier; validated for topology, not re-documented key-by-key here |
| `Template` package node | Template authoring root; **excluded** from host compile plans until scaffold output exists |

**Graph validation** runs after parse: invalid Mod dependency cycles, incompatible capability requirements, and missing materialized roots **must** emit stable diagnostics in the mod/manifest band (**E1801–E1899**); see [Diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/).

## Schema authority

All normative **`project`**, **`project.mod`**, **`project.template`**, **`type`** (`Host`, `Mod`, `Template`), readme, and **`project.link`** key definitions live in **[tooling / design model](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/design-model/)**. This article intentionally omits duplicate key tables.

**`Template`** nodes **must not** be selected for `beskid build` / `run` on the authoring tree; the template engine consumes **`.beskid/template.json`** instead. Scaffold instantiation diagnostics use **E1901–E1999** (see **[Project templates](/platform-spec/tooling/project-scaffolding/project-templates/)**).

## Code anchors

- `compiler/crates/beskid_analysis/src/projects/manifest_resolve.rs`
- `compiler/crates/beskid_analysis/src/projects/graph/`
- `compiler/crates/beskid_analysis/src/services/` — session orchestration after graph is known
``````

</details>

### Source Record: Project manifest contract - Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/project-manifest-contract/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/project-manifest-contract/articles/examples/content.md`  
**SHA-256:** `8e8e0ded33a1f71fc71cd1045a1ce08b6dd3c6c14730ee799bfc5abd330ede6d`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **examples** for **project manifest contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_cli/src/commands/` reads manifest-driven compile inputs.
- `compiler/crates/beskid_tests/src/projects/corelib/mod.rs` uses manifest-aware project fixtures.
- `compiler/crates/beskid_tests/src/projects/corelib/compile.rs` verifies manifest-based compile execution.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Project manifest contract - FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/project-manifest-contract/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/project-manifest-contract/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `53f3d166c0749760db354eb1d285fd86d76d39fb6f5b8ee2a6f2159e33bec833`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **faq and troubleshooting** for **project manifest contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_cli/src/commands/` reads manifest-driven compile inputs.
- `compiler/crates/beskid_tests/src/projects/corelib/mod.rs` uses manifest-aware project fixtures.
- `compiler/crates/beskid_tests/src/projects/corelib/compile.rs` verifies manifest-based compile execution.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Project manifest contract - Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/project-manifest-contract/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/project-manifest-contract/articles/flow-and-algorithm/content.md`  
**SHA-256:** `7d50e3b81166956a710a5493d3a322f4729c17b6f1062285d54d04ae786a266c`

<details>
<summary>Migrated source text</summary>

``````markdown
## Resolution flow

1. **Discover** `Project.proj` paths from workspace roots (`manifest_resolve`).
2. **Parse** into `ProjectManifest` (structural errors surface before graph insertion).
3. **Insert** node; run **graph validation** (cycles, Mod-only contract carriers, incompatible edges).
4. For host targets, **materialize transitive `Mod` dependencies** and ensure AOT artifacts exist (cache hit or build).
5. Hand off to **`CompilePlan`** and [stage ordering](/platform-spec/compiler/build-pipeline/stage-ordering/) for semantic and mod pipelines.

Author-oriented step-by-step validation (including optional `project.mod` keys) is specified in **[tooling / flow and algorithm](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/flow-and-algorithm/)** without repeating that prose here.

## Code anchors

- `compiler/crates/beskid_analysis/src/projects/manifest_resolve.rs`
- `compiler/crates/beskid_analysis/src/projects/compile_plan.rs`
- `compiler/crates/beskid_cli/src/commands/`
``````

</details>

### Source Record: Project manifest contract - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/project-manifest-contract/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/project-manifest-contract/articles/verification-and-traceability/content.md`  
**SHA-256:** `41969b45cce8f00a35eeebe50b37bfd9d3c981c00636bab684e87c666724f550`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **verification and traceability** for **project manifest contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_cli/src/commands/` reads manifest-driven compile inputs.
- `compiler/crates/beskid_tests/src/projects/corelib/mod.rs` uses manifest-aware project fixtures.
- `compiler/crates/beskid_tests/src/projects/corelib/compile.rs` verifies manifest-based compile execution.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>
