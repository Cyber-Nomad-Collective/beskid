<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Diagnostics and workspace analysis Specification

## Purpose

LSP diagnostic and workspace analysis contracts for Beskid editor integrations.

## Requirements

### Requirement: Document and workspace analysis paths
LSP document analysis SHALL support cached and cold diagnostic paths with equivalent semantic rule outcomes. Workspace scanning and symbol features SHALL use project graph context rather than isolated file parsing when available. Document analysis snapshots for `.bd` IntelliSense SHALL be built with the same `CompilationContext` / `ProgramAssembly` path as project-aware diagnostics (`build_document_analysis_with_context`), not single-file `Resolver::resolve_program` alone. Manifest diagnostics for `.proj` files SHALL be surfaced through project-specific diagnostic adapters. LSP diagnostics SHALL preserve severity and code identity from compiler analysis diagnostics.

#### Scenario: Snapshot uses project assembly path
- **GIVEN** a `.bd` buffer whose path resolves under a `Project.proj` with a `CompilationContext`
- **WHEN** the server builds a `DocumentAnalysisSnapshot` for IntelliSense
- **THEN** the snapshot is built via `build_document_analysis_with_context` using `ProgramAssembly`, not isolated `Resolver::resolve_program` alone

### Requirement: Documentation and meta diagnostics merge
For `.bd` buffers where `DocumentAnalysisSnapshot` is available, the server SHALL merge `doc_diagnostics` (documentation mini-language, codes W161x and W162x) with diagnostics from the prepare spine so editors show a single unified list per URI. Diagnostics emitted during mod analyze/rewrite phases MUST use the same transport, code strings, and severity mapping as semantic diagnostics from `beskid_analysis`. The LSP MUST refresh these diagnostics whenever the mod host invalidates a document generation. When the resolved graph includes `Mod` nodes, analysis MUST schedule meta after the same `CompilationContext` snapshot rules as CLI and MUST NOT analyze host sources in a mode that skips attached `Mod` unless a documented power-saving mode is enabled uniformly across commands.

#### Scenario: Doc diagnostics appear in unified list
- **GIVEN** a `.bd` buffer with an available `DocumentAnalysisSnapshot` that includes `doc_diagnostics`
- **WHEN** diagnostics are published for that URI
- **THEN** the published list is the union of prepare-spine diagnostics and `doc_diagnostics` for that URI

### Requirement: Diagnostic fallback chain for .bd buffers
Project-backed `.bd` diagnostics MUST use exactly two authoritative tiers plus an optional warm snapshot; the server MUST NOT call legacy `analyze_source_in_project` or `analyze_source_with_compilation_context` fallbacks. Priority 1 is `beskid_queries::prepare_compilation_diagnostics_with_db` when CompilationContext, CompilePlan, and workspace `BeskidDatabase` are resolved. Priority 2 is a warm `DocumentAnalysisSnapshot` built via `build_document_analysis_with_context` when prepare is unavailable or failed. Priority 3 is parse-only (`parse_program` plus structural semantic rules) when no project context exists.

#### Scenario: Prepare spine is preferred over snapshot
- **GIVEN** an open `.bd` buffer with resolved CompilationContext, CompilePlan, and workspace database
- **WHEN** diagnostics are computed
- **THEN** the server uses `prepare_compilation_diagnostics_with_db` and does not fall back to legacy `analyze_source_in_project`

### Requirement: Debounced typed entry bundle policy
IntelliSense and diagnostics share project scope but MUST NOT run full Executable prepare on every keystroke. File text revision SHALL track buffer edits immediately. A debounced typed prepare revision (coalesced with diagnostic publish, 120ms) SHALL schedule background Executable prepare via `typed_entry_bundle` after editing pauses. While typed output is stale, IDE features SHALL read `entry_resolution_with_db` / `SharedResolution` from the current assembly generation. Diagnostics MUST already flow through the prepare tier regardless of typed bundle freshness. Typed bundle and resolution MUST invalidate on import-closure changes, mod host generation bumps, manifest/lock edits, and grammar revision changes.

#### Scenario: Completion uses fast path while typed prepare is stale
- **GIVEN** a user is typing in a `.bd` buffer and the debounced typed prepare has not completed
- **WHEN** completion is requested
- **THEN** the handler reads resolution from the current assembly generation via `entry_resolution_with_db` / `SharedResolution` without waiting for a full Executable prepare

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Diagnostics and workspace analysis

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/lsp/diagnostics-and-workspace-analysis/`  
**Source:** `site/spec-content/platform-spec/tooling/lsp/diagnostics-and-workspace-analysis/content.md`  
**SHA-256:** `89c40306cc194d04ef0c4bd3465d0f430502414d65199213bd140c373768416d`

<details>
<summary>Migrated source text</summary>

``````markdown
## Normative platform contract

1. LSP document analysis shall support cached and cold diagnostic paths with equivalent semantic rule outcomes.
2. Workspace scanning and symbol features shall use project graph context rather than isolated file parsing when available.
3. **Document analysis snapshots** for `.bd` IntelliSense **shall** be built with the same `CompilationContext` / `ProgramAssembly` path as project-aware diagnostics (`build_document_analysis_with_context` in `beskid_lsp::session::lifecycle`), not single-file `Resolver::resolve_program` alone.
4. Manifest diagnostics for `.proj` files shall be surfaced through project-specific diagnostic adapters.
5. LSP diagnostics shall preserve severity and code identity from compiler analysis diagnostics.
6. **Documentation diagnostics** — For `.bd` buffers where `DocumentAnalysisSnapshot` is available, the server **shall** merge `doc_diagnostics` (documentation mini-language, codes **W161x** and **W162x**) with diagnostics from the prepare spine so editors show a single unified list per URI.
7. **Meta diagnostics** — Diagnostics emitted during mod analyze/rewrite phases **must** use the same transport, code strings, and severity mapping as semantic diagnostics from `beskid_analysis` so CLI and LSP remain interchangeable for CI diffing. The LSP **must** refresh these diagnostics whenever the mod host invalidates a document generation (see **[Snapshot and refresh contract](/platform-spec/tooling/lsp/snapshot-and-refresh-contract/)**).
8. **Workspace analysis with `Mod` projects** — When the resolved graph includes `Mod` nodes, analysis **must** schedule meta after the same `CompilationContext` snapshot rules as CLI; the server **must not** analyze host sources in a mode that skips attached `Mod` unless a documented power-saving mode is enabled uniformly across commands.

## Diagnostic fallback chain (`.bd` buffers)

Project-backed `.bd` diagnostics **must** use exactly two authoritative tiers plus an optional warm snapshot; the server **must not** call legacy `analyze_source_in_project` or `analyze_source_with_compilation_context` fallbacks.

| Priority | Path | When |
| --- | --- | --- |
| 1 | `beskid_queries::prepare_compilation_diagnostics_with_db` | Open or scanned buffer with resolved `CompilationContext`, `CompilePlan`, and workspace `BeskidDatabase` |
| 2 | Warm `DocumentAnalysisSnapshot` | Prepare unavailable or failed; snapshot built via `build_document_analysis_with_context` |
| 3 | Parse-only | No project context: `parse_program` + structural semantic rules |

Tier 1 is the same prepare spine as `beskid analyze` and CLI compile commands ([D-TOOL-CLI-0002](/platform-spec/tooling/cli/build-analyze-run-contract/adr/0002-shared-analysis-pipeline/)). Tier 2 preserves composition and doc mini-language codes while typed prepare catches up. Tier 3 applies to orphan buffers until synthetic compile plans land (Wave 4).

## Debounced typed entry bundle (IDE policy)

IntelliSense and diagnostics share project scope but **must not** run full Executable prepare on every keystroke.

1. **File revision** — `BeskidDatabase::ensure_file_text` / Salsa `file_text` tracks buffer edits immediately so parse and `entry_resolution_with_db` stay current.
2. **Typed prepare revision** — A debounced counter (coalesced with diagnostic publish, 120ms) schedules background Executable prepare via `typed_entry_bundle` after editing pauses.
3. **Fast path** — While typed output is stale, IDE features (`completion`, `hover`, `definition`, …) **shall** read `entry_resolution_with_db` / `SharedResolution` from the current assembly generation.
4. **Full path** — When typed prepare completes, handlers **may** upgrade to `SharedFrontEnd` products; diagnostics **must** already flow through tier 1 above regardless of typed bundle freshness.
5. **Invalidation** — Typed bundle and resolution **must** invalidate on import-closure changes, mod host generation bumps, manifest/lock edits, and grammar revision changes per **[Snapshot and refresh contract](/platform-spec/tooling/lsp/snapshot-and-refresh-contract/)**.

## Implementation anchors

- `compiler/crates/beskid_lsp/src/diagnostics.rs`
- `compiler/crates/beskid_lsp/src/session/diagnostics_bridge.rs`
- `compiler/crates/beskid_lsp/src/workspace_scan.rs`
- `compiler/crates/beskid_lsp/src/features`
- `compiler/crates/beskid_queries/src/entry.rs` — `prepare_compilation_diagnostics_with_db`, `entry_resolution_with_db`, `typed_entry_bundle`
- `compiler/crates/beskid_analysis/src/doc/validate.rs`

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->
``````

</details>
