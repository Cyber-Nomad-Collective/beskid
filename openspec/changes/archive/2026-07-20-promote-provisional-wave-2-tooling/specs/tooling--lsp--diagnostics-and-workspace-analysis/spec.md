## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Diagnostics and workspace analysis conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
