<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Program assembly Specification

## Purpose

Multi-module program composition from CompilePlan and materialized source roots, shared by analyze, lowering, LSP, and backend-agnostic front-end paths.

## Requirements

### Requirement: Feature hub authority: Decision [D-COMP-BUILD-0013]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-7AAC51938B11`  
**Legacy source:** `site/spec-content/platform-spec/compiler/build-pipeline/program-assembly/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `ecec997599696d4815cf2f9efcdf2269d99b5b9e5480645f9078b689bb866628`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-BUILD-0014]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-241CF4E42B6F`  
**Legacy source:** `site/spec-content/platform-spec/compiler/build-pipeline/program-assembly/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `22d39a9cc40e9c8fce49fb7abd385644e8c148a2f418459cb9f3e0490de63354`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Primary contract for Program assembly: Decision [D-COMP-BUILD-0015]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> The reference compiler **must** implement Program assembly as documented in this feature hub and its article bundle.

**Stable ID:** `BSP-REQ-EBEA050AB0D5`  
**Legacy source:** `site/spec-content/platform-spec/compiler/build-pipeline/program-assembly/adr/0003-primary-contract-choice/content.md`  
**Source SHA-256:** `06f2c33249e4f0e57fc51ae1ccff00ccd0a1df20e363d348ad8af245784d5740`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Import closure not directory sweep: Decision [D-COMP-BUILD-0023]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> For `AssemblyDiscovery::ImportClosure` (build, run, lower, test, LSP document snapshots):
> 
> | Rule | Detail |
> | --- | --- |
> | Seeds | Entry file, prelude union seeds (D-COMP-BUILD-0022), and each `pub mod A.B` resolve **exactly one** module file before traversal |
> | Expansion | Additional units enter the queue **only** when a queued file contains a `use` import that resolves under effective roots |
> | No sweep | `ImportClosure` **must not** enumerate all `*.bd` under roots (that mode is **`WorkspaceScan`** only, for LSP workspace indexing) |
> 
> `WorkspaceScan` remains capped by `max_units` with deterministic sort; it **must not** be used for `beskid build` / `beskid run` / `beskid test`.

**Stable ID:** `BSP-REQ-19280828CC0D`  
**Legacy source:** `site/spec-content/platform-spec/compiler/build-pipeline/program-assembly/adr/0005-import-closure-not-directory-sweep/content.md`  
**Source SHA-256:** `5881cad55262791ac67e40d231013998a3c7fc517f4ef56c9b81ba49e38bc2cb`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Program assembly

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/program-assembly/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/program-assembly/content.md`  
**SHA-256:** `81b0be9d7b708a73fad742c5c02c75ed5f09c14c87b7ce392108af2728ad56b9`

<details>
<summary>Migrated source text</summary>

``````markdown
This feature hub defines how the reference compiler turns a resolved **`CompilePlan`** plus **effective (materialized-first) source roots** into a **`ProgramAssembly`**: discovered `.bd` units, a shared **`ModuleIndex`** for cross-module resolution, and a single front-end spine consumed by CLI, LSP, analyze, and codegen. JIT and AOT backends consume **`CodegenArtifact`** only and do not re-run assembly.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/services/front_end.rs` — program assembly entry point and spine construction
- `compiler/crates/beskid_analysis/src/projects/assembly/` — unit discovery and `ModuleIndex` assembly
- `compiler/crates/beskid_pipeline/src/` — pipeline integration of assembly into compile spine

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-BUILD-0013` … `D-COMP-BUILD-0023`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Program assembly - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Program assembly - Design model](./articles/design-model/)
- [Program assembly - Flow and algorithm](./articles/flow-and-algorithm/)
- [Program assembly - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/program-assembly/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/program-assembly/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `ecec997599696d4815cf2f9efcdf2269d99b5b9e5480645f9078b689bb866628`

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

- `site/website/src/content/docs/platform-spec/compiler/build-pipeline/program-assembly/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/program-assembly/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/program-assembly/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `22d39a9cc40e9c8fce49fb7abd385644e8c148a2f418459cb9f3e0490de63354`

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

### Source Record: Primary contract for Program assembly

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/program-assembly/adr/0003-primary-contract-choice/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/program-assembly/adr/0003-primary-contract-choice/content.md`  
**SHA-256:** `06f2c33249e4f0e57fc51ae1ccff00ccd0a1df20e363d348ad8af245784d5740`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

This feature hub defines how the reference compiler turns a resolved **`CompilePlan`** plus **effective (materialized-first) source roots** into a **`ProgramAssembly`**: discovered `.bd` units, a shared **`ModuleIndex`** for cross-module resolution, and a single front-end spine consumed by CLI, LSP, analyze, and codegen. JIT and AOT backends consume **`CodegenArtifact`** only and do not re-run assembly.

## Decision

The reference compiler **must** implement Program assembly as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/`
``````

</details>

### Source Record: Dependency prelude union seeding (superseded)

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/program-assembly/adr/0004-dependency-prelude-union-seeding/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/program-assembly/adr/0004-dependency-prelude-union-seeding/content.md`  
**SHA-256:** `4c7de86533c20d52f9e9a9921ba3fae57acc04db1492cd162d3ff3756bbafd26`

<details>
<summary>Migrated source text</summary>

``````markdown
## Status

**Superseded by [D-TOOL-MAN-0006 — Explicit use, no prelude](/platform-spec/tooling/manifests-and-lockfiles/adr/0006-explicit-use-no-prelude/)** on 2026-06-07.

Automatic prelude union seeding is retired. Implementations **must not** harvest `pub mod` lines from `Prelude.bd` during assembly.

## Context (historical)

Assembly seeding used `host ConsoleHost` text markers and a `Console` module denylist to avoid pulling invalid shard units. That heuristic diverged from manifest-declared preludes and blocked legitimate `pub mod` re-exports.

## Decision (historical)

When `AssemblyOptions.include_std_prelude` is true and `CompilePlan.has_std_dependency`:

1. For **each** effective module root containing `Prelude.bd` (aggregate `beskid_corelib` and workspace shards), parse all `pub mod Path.Segment;` lines and enqueue the resolved module file for each path.
2. **Union** seeds across roots, then **dedupe** by canonical file path (deterministic sort order).
3. **Must not** filter modules by substring markers (`ConsoleHost`, etc.) or ad-hoc denylists in the loader.
4. `is_compiler_mod_sdk_source_root` skip remains only for compiler Mod SDK trees documented in implementation-map anchors.

Invalid standalone units **must** be fixed in corelib packaging (see D-CORE-COMP-0009), not suppressed in assembly.

## Consequences (historical)

`loader.rs` prelude seeding became declarative. Corelib ensured every seeded `pub mod` resolved to a valid compilation unit until prelude retirement.

## Verification anchors (historical)

Verification responsibility transferred to D-TOOL-MAN-0006.
``````

</details>

### Source Record: Import closure not directory sweep

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/program-assembly/adr/0005-import-closure-not-directory-sweep/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/program-assembly/adr/0005-import-closure-not-directory-sweep/content.md`  
**SHA-256:** `5881cad55262791ac67e40d231013998a3c7fc517f4ef56c9b81ba49e38bc2cb`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

`ImportClosure` and `WorkspaceScan` modes were conflated in places: directory sweeps pulled unrelated `.bd` files into compile graphs, breaking determinism and parity with explicit `use` graphs.

## Decision

For `AssemblyDiscovery::ImportClosure` (build, run, lower, test, LSP document snapshots):

| Rule | Detail |
| --- | --- |
| Seeds | Entry file, prelude union seeds (D-COMP-BUILD-0022), and each `pub mod A.B` resolve **exactly one** module file before traversal |
| Expansion | Additional units enter the queue **only** when a queued file contains a `use` import that resolves under effective roots |
| No sweep | `ImportClosure` **must not** enumerate all `*.bd` under roots (that mode is **`WorkspaceScan`** only, for LSP workspace indexing) |

`WorkspaceScan` remains capped by `max_units` with deterministic sort; it **must not** be used for `beskid build` / `beskid run` / `beskid test`.

## Consequences

Assembly unit count tracks the transitive `use` graph plus explicit prelude seeds. Tests assert closure size for fixture projects.

## Verification anchors

- `compiler/crates/beskid_analysis/src/projects/assembly/loader.rs`
- `compiler/crates/beskid_analysis/src/projects/model.rs` (`AssemblyDiscovery`)
- `compiler/crates/beskid_tests/src/projects/composition.rs`
``````

</details>

### Source Record: Program assembly - Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/program-assembly/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/program-assembly/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `ce41290e4eca6f25319fa2223beec41f4fcbeea3b48b62051832ac88eff9f1a3`

<details>
<summary>Migrated source text</summary>

``````markdown
- **Materialized-first** — When `PreparedProjectWorkspace` exists, assembly roots **must** use `materialized_source_root` and dependency `materialized_source_root` entries, not pre-copy project trees.
- **Lockfile fallback (LSP)** — When materialization did not run, `Project.lock` `materialized_root` paths **may** be used when directories exist.
- **`max_units`** — Workspace scan **must** stop at the cap and report deterministically sorted paths.
- **No diagnostic filtering** — Cross-module symbols **must** be visible to resolution; hosts **must not** drop E1105/E1201/E1301 solely because a path exists on disk.
- **`use` alias resolution** — Import aliases **must** expand to prefetched module paths before value/type lookup; binding a `use` item as a callable namespace is **forbidden** (contract-as-namespace remains the only in-scope dotted-path fallback).
- **Mod rounds** — After generator output changes imports, the host **may** re-run assembly within `maxGeneratorRounds`.
``````

</details>

### Source Record: Program assembly - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/program-assembly/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/program-assembly/articles/design-model/content.md`  
**SHA-256:** `3ddc374273c49045b2260cb9582b248daf4adec277844cecceb57d609919a794`

<details>
<summary>Migrated source text</summary>

``````markdown
## Core objects

| Object | Role |
|--------|------|
| `EffectiveCompilationRoots` | Host + dependency **source roots**; materialized paths from `PreparedProjectWorkspace` or `Project.lock` take precedence over plan `source_root` paths |
| `SourceUnit` | One parsed `.bd` file: logical name, path, text, `Spanned<Program>` |
| `ModuleIndex` | Cross-unit module graph and item table used to **prefetch** resolution for the entry unit |
| `ProgramAssembly` | Roots, units, cached `hir_units`, entry index, discovery mode, and `ModuleIndex` |
| `UnitHir` / `hir_units` | Per-unit lowered HIR built once at assemble time; dependency units stay pre-rewrite when entry is mod-rewritten |
| `AssemblyOptions` | `discovery` (`ImportClosure` vs `WorkspaceScan`), `include_std_prelude`, `max_units` |

## Hybrid discovery (normative)

- **Build / run / lower / test** — `ImportClosure`: entry file, **prelude union** seeds (`pub mod` from every effective `Prelude.bd`, deduped per D-COMP-BUILD-0022), then transitive `use` edges only (D-COMP-BUILD-0023)—no directory sweep.
- **LSP workspace file index** — `WorkspaceScan`: all `*.bd` files under each effective root for closed-buffer diagnostics indexing, capped by `max_units` (deterministic sort order).
- **LSP / IDE document snapshots** — `ImportClosure` via `CompilationContext::assembly_for_entry` so IntelliSense resolution matches compile/lower (`ModuleIndex::resolve_entry_hir` on the entry buffer).

## `use` aliases and step-6 resolution

- A `use` declaration registers an **import alias** (explicit `as` name or default tail of the path, e.g. `use Std.System.IO` → alias `IO`) mapped to the **full logical module path** in the merged `ModuleGraph` from `ModuleIndex`.
- Value and type paths such as `IO.PrintLine` or `String.IsEmpty` **must** resolve through alias expansion to `Std::System::IO::PrintLine` (etc.) during the resolver pass, producing ordinary `Item` bindings—not `ItemKind::Use` placeholders.
- Staged semantic **E1105** (`unknown import path`) **must** consult assembly-known module paths when `ProgramAssembly` is available, not file-local root heuristics alone.

## IDE consumption

- `beskid_analysis::services::build_document_analysis_with_context` lowers and normalizes the entry program, then calls `assembly.module_index.resolve_entry_hir` when assembly is available.
- Resolved items from dependency units carry `ItemInfo.source_path` so LSP go-to-definition, find references, and hover map to the declaring `.bd` file URI.
- Workspace find references on non-entry units use `ModuleIndex::resolve_unit_hir` per dependency unit when merging matches into `references_at_offset_workspace`.
- Import aliases collected in the entry unit are exposed on `Resolution.module_imports` for member completion (`IO.` → `Std::System::IO` scope).

## CLI and JIT/AOT parity

- **`beskid build`** and **`beskid run`** **must** use the same [`PreparedProjectWorkspace`](.) materialized roots and [`ModuleIndex::resolve_entry_hir`](.) on the entry unit before codegen.
- **`beskid run`** **must** call [`compile_front_end_from_resolved_input`](.) (or equivalent) with `prepared_workspace` from project resolve — not a second assemble path with `prepared_workspace: None`.

## Backend boundary

Assembly and the shared front-end spine end at typed HIR and `CodegenArtifact`. **`beskid_engine`** (JIT) and **`beskid_aot`** (link) **must not** rebuild `CompilePlan` or rediscover modules.

## Implementation owner

`beskid_analysis::projects::assembly` and `beskid_analysis::services::front_end` (see **[Implementation map](/platform-spec/compiler/implementation-map/crate-to-spec-anchors/)**).
``````

</details>

### Source Record: Program assembly - Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/program-assembly/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/program-assembly/articles/flow-and-algorithm/content.md`  
**SHA-256:** `b9635b4917ef68e46d9e227cb6f8e6de41f078defee45b9260412cbe62dc1a7f`

<details>
<summary>Migrated source text</summary>

``````markdown
1. Build `EffectiveCompilationRoots` from `CompilePlan` + optional `PreparedProjectWorkspace` (or lockfile replay for LSP).
2. Emit pipeline phase **`program.assemble`** (after `workspace.materialize` when present).
3. Discover source paths per `AssemblyOptions.discovery`.
4. Parse each unit; build **`ModuleIndex`** by collection-only resolver passes on non-entry units.
5. Hand entry `SourceUnit` and `ModuleIndex` to the shared front-end spine (mod host → semantic → HIR resolve/type on entry with prefetch index).
6. Lower to `CodegenArtifact` for JIT/AOT consumers.

Workspace resolution step 1 output **must** feed stage-ordering step 6 (HIR/resolution) through `ModuleIndex`, not only semantic rules on the entry file.
``````

</details>

### Source Record: Program assembly - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/program-assembly/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/program-assembly/articles/verification-and-traceability/content.md`  
**SHA-256:** `0b645e82f0df232b29233054314e548dee368723ac288c11ab5b247520802d20`

<details>
<summary>Migrated source text</summary>

``````markdown
Implementation anchors:

- `compiler/crates/beskid_analysis/src/projects/assembly/`
- `compiler/crates/beskid_analysis/src/services/front_end.rs`
- `compiler/crates/beskid_pipeline/src/phases.rs` (`program.assemble`)
- `compiler/crates/beskid_tests/src/projects/assembly.rs`

Tests **must** cover materialized root preference, import-closure loading of std modules (corelib_mvp fixture), pipeline phase order, and lowering without analyze-side diagnostic filtering.
``````

</details>
