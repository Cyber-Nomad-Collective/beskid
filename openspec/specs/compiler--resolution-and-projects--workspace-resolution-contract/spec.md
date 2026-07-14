<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Workspace resolution contract Specification

## Purpose

Project graph discovery, manifest loading (including Mod projects), and workspace inputs for compiler and tooling commands.

## Requirements

### Requirement: Feature hub authority: Decision [D-COMP-PROJ-0013]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-978F3E8DCB8C`  
**Legacy source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `bf783ca9bc4c414b856d1e7be8683ee8d082a15beb7e5f96bd6b5fb7d34fb407`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-PROJ-0014]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-C35D92ADFAEA`  
**Legacy source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `d25ca8dc7f78221704cddc454a99d828ea49a3baffcb1e5df25c00ed62c50abc`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Primary contract for Workspace resolution contract: Decision [D-COMP-PROJ-0015]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> The reference compiler **must** implement Workspace resolution contract as documented in this feature hub and its article bundle.

**Stable ID:** `BSP-REQ-2D2032F30B6B`  
**Legacy source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/adr/0003-primary-contract-choice/content.md`  
**Source SHA-256:** `4d93ced10cf325ce018f2f2848cdf971e7503921b720a603c05b1b4a0178a0c5`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Workspace resolution contract

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/content.md`  
**SHA-256:** `5d21934244188e9785f1b38a9ddc29feb7e91a3e64960920f5c8d419ba0194fd`

<details>
<summary>Migrated source text</summary>

``````markdown
This feature hub explains how the compiler discovers `Project.proj`, builds a project graph, and hands resolved workspace inputs to compile and dependency commands. **`Mod`** projects are included in the graph like other project kinds; after resolution, the **mod host** registers them for **event-driven** orchestration per **[Project manifest contract](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/)** and **[Compiler Mods](/platform-spec/compiler/compiler-mods/)**.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/projects/` — project graph discovery and manifest loading
- `compiler/crates/beskid_analysis/src/resolve/` — resolution pipeline and module graph construction
- `compiler/crates/beskid_analysis/src/mod_host/` — Mod project registration after resolution

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-PROJ-0013` … `D-COMP-PROJ-0015`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Workspace resolution contract - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Workspace resolution contract - Design model](./articles/design-model/)
- [Workspace resolution contract - Examples](./articles/examples/)
- [Workspace resolution contract - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Workspace resolution contract - Flow and algorithm](./articles/flow-and-algorithm/)
- [Workspace resolution contract - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `bf783ca9bc4c414b856d1e7be8683ee8d082a15beb7e5f96bd6b5fb7d34fb407`

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

- `site/website/src/content/docs/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `d25ca8dc7f78221704cddc454a99d828ea49a3baffcb1e5df25c00ed62c50abc`

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

### Source Record: Primary contract for Workspace resolution contract

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/adr/0003-primary-contract-choice/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/adr/0003-primary-contract-choice/content.md`  
**SHA-256:** `4d93ced10cf325ce018f2f2848cdf971e7503921b720a603c05b1b4a0178a0c5`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

This feature hub explains how the compiler discovers `Project.proj`, builds a project graph, and hands resolved workspace inputs to compile and dependency commands. **`Mod`** projects are included in the graph like other project kinds; after resolution, the **mod host** registers them for **event-driven** orchestration per **[Project manifest contract](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/)** and **[Compiler Mods](/platform-spec/compiler/compiler-mods/)**.

## Decision

The reference compiler **must** implement Workspace resolution contract as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/`
``````

</details>

### Source Record: Workspace resolution contract - Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `8de6b9ac5085d307f6bd188fc80884f2500401546c7137ef27a40c3313fecb59`

<details>
<summary>Migrated source text</summary>

``````markdown
- Missing or malformed project manifests must produce stable project diagnostics, not parser panics.
- Unresolved dependencies must follow the selected policy and remain observable in command output.
- Explicit source-file input takes precedence over workspace target inference.
- Resolution must preserve deterministic target selection for identical manifests and lockfiles.
``````

</details>

### Source Record: Workspace resolution contract - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/articles/design-model/content.md`  
**SHA-256:** `e1b58c63879a02026b6d0740f7a6b1c66e7e42b2e05919fec5d93aaba4b3ec1b`

<details>
<summary>Migrated source text</summary>

``````markdown
The resolution model has four core objects: `CompilePlan` (target + dependency plan), `PreparedProjectWorkspace` (materialized source roots and lockfile state), resolved source input (`source_path`, `source`) used by compile commands, and **`ProgramAssembly`** (multi-module units + `ModuleIndex` built from effective roots — see **[Program assembly](/platform-spec/compiler/build-pipeline/program-assembly/)**).

`beskid_analysis::projects` owns graph building and manifest semantics; CLI commands and LSP integrations consume this model and should not reimplement manifest traversal rules.

## `Mod` projects in the graph

**`Mod` projects** appear as graph nodes with **`type = Mod`**. Resolution **must**:

1. **Include all transitive `Mod` dependencies** of the active host compilation in the resolved dependency graph.
2. **Never treat `Mod` as the default compile target** for `beskid build` / `beskid run`; host builds resolve App/Lib/Test targets while still loading mod artifacts from dependencies.
3. **Expose the same graph slice to LSP and CLI** so mod scheduling decisions match across surfaces.

Scope narrowing for which host compilation units a mod affects is owned by **`Collector`** contracts at execution time, not by manifest attach metadata.

## Mod artifact resolution

When a `Mod` node is discovered:

1. Resolve package source (workspace path or registry materialization).
2. Check artifact hash against cached AOT output.
3. Rebuild when hash changes (eager incremental check) or when `beskid mod rebuild` is invoked.

Errors in mod artifact load/bootstrap use the **E1821–E1835** band (**[Diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/)**, **[AOT artifact contract](/platform-spec/compiler/compiler-mods/mod-host-bridge/aot-artifact-contract/)**).
``````

</details>

### Source Record: Workspace resolution contract - Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/articles/examples/content.md`  
**SHA-256:** `522555df376d95ee3c4f49682bac2e3bad700dee231d49e5db4cba7d068b8e08`

<details>
<summary>Migrated source text</summary>

``````markdown
- **Single project:** `Project.proj` with one target yields one-entry `CompilePlan`; `resolve_input` points directly to that entry file.
- **Workspace with deps:** root target depends on local and registry packages; graph includes both, unresolved optional packages are reported according to policy.
- **Explicit file compile:** `beskid run Src/Main.bd` bypasses target inference and resolves directly from the provided file path.
``````

</details>

### Source Record: Workspace resolution contract - FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `f7f27adfbf3c378eacb043c346a732acd8ed58f14e2a23b0a3f84449bdecb0c8`

<details>
<summary>Migrated source text</summary>

``````markdown
## Why does the compiler ignore my workspace target?
Explicit file input overrides target inference; remove the explicit path to use manifest target resolution.

## Why did a dependency warning not fail the command?
The command may be using a warning-oriented unresolved dependency policy. Use a strict mode command or policy where available.

## Why does lockfile behavior differ between commands?
`--frozen` and `--locked` are command-level options propagated into workspace preparation options.
``````

</details>

### Source Record: Workspace resolution contract - Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/articles/flow-and-algorithm/content.md`  
**SHA-256:** `9b728f8c326c18071c87f356c443b39a14df17dc63e16e346d66abc81153fe7d`

<details>
<summary>Migrated source text</summary>

``````markdown
## Resolution pipeline

```mermaid
flowchart TD
  root[Discover project root]
  manifest[Load Project.proj]
  graph[Build dependency graph]
  policy[Apply cycle / missing dep policy]
  plan[Create CompilePlan]
  lock[Optional lockfile sync]
  entry[Source root + entry path]
  mods[Mod host event setup]
  root --> manifest --> graph --> policy --> plan
  plan --> lock --> entry
  plan --> mods
```

## Steps

1. Resolve project root and load `Project.proj` manifest.
2. Build dependency graph with policy (`error`, `warn`, or permissive) for unresolved dependencies.
3. Classify each node’s **project type** (including **`Mod`**) and retain manifest fragments needed for mod host registration.
4. Select compilation target and create `CompilePlan`.
5. Optionally materialize workspace and lockfile synchronization.
6. Return final source root and entry path for parsing/lowering.
7. If the workspace includes **`Mod`** projects, pass the resolved graph slice to the **mod host** for **event subscription** setup (see **[Compiler Mods](/platform-spec/compiler/compiler-mods/)**).

Implementations should use `build_compile_plan_with_policy` and `prepare_project_workspace_with_options` to keep command behavior aligned.
``````

</details>

### Source Record: Workspace resolution contract - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/articles/verification-and-traceability/content.md`  
**SHA-256:** `8e3f09bacf9f5f8a4e1adc07d6ced8f9bd304d0cde51883382fd6196eaf7bafb`

<details>
<summary>Migrated source text</summary>

``````markdown
Primary implementation anchors:

- `compiler/crates/beskid_analysis/src/projects/compile_plan.rs`
- `compiler/crates/beskid_analysis/src/projects/manifest_resolve.rs` (workspace member selection aligned with CLI)
- `compiler/crates/beskid_analysis/src/compilation_context.rs` (analysis / LSP compile slice)
- `compiler/crates/beskid_analysis/src/projects/graph/builder.rs` (`discover_workspace_resolution_rules`, registry URLs)
- `compiler/crates/beskid_analysis/src/projects/workflow.rs` (registry materialization base URL)
- `compiler/crates/beskid_analysis/src/services/` (`resolve_input`, `analyze_source_with_compilation_context`)
- `compiler/crates/beskid_lsp/src/session/project_context.rs` (cached `CompilationContext`)
- `compiler/crates/beskid_cli/src/commands/fetch.rs`, `lock.rs`, `tree.rs`

Regression coverage should include fixed-fixture project graphs and lockfile policy permutations. Workspace member selection and `CompilationContext` are covered in `compiler/crates/beskid_tests/src/projects/resolution.rs`.
``````

</details>
