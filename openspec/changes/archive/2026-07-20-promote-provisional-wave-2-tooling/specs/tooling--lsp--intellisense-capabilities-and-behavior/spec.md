## ADDED Requirements

### Requirement: Completion and project-aware IntelliSense
Completion SHALL be provided for `.bd` and `.proj` documents. `.bd` candidates SHALL come from `beskid_analysis::services::completion_candidates`; `.proj` completion SHALL include manifest keywords and enum-like value suggestions. When `CompilationContext` resolves a `Project.proj` for the buffer path, `build_document_analysis_with_context` SHALL assemble via `ProgramAssembly`, resolve the entry unit with `ModuleIndex::resolve_entry_hir`, and expose `Resolution.module_imports` plus `ItemInfo.source_path` for cross-unit symbols. After a trailing `.` following a registered `use` alias, completion SHALL list public members from the aliased module path. On a `use` line, completion SHALL offer next path segments from assembly-known logical module paths.

#### Scenario: Member completion after use alias
- **GIVEN** a `.bd` buffer with `use Std.System.IO` and a `CompilationContext` that resolves the project
- **WHEN** the user requests completion after `IO.`
- **THEN** candidates include public members from the aliased module path in the assembly `ModuleGraph`

### Requirement: Hover, navigation, and references
Hover SHALL return Markdown for resolved `.bd` symbols and `.proj` manifest tokens; hover ranges SHALL map through `SymbolLocation` and the declaring unit source when `ItemInfo.source_path` differs from the buffer path. Go to definition SHALL resolve to the declaration span for resolved `.bd` symbols (using `ItemInfo.source_path` for dependency units and canonicalizing via `Resolution.by_symbol`) and SHALL navigate `.proj` `path = "..."` dependencies to the target `Project.proj`. Go to declaration SHALL follow the same target resolution contract. Find references SHALL support resolved `.bd` symbols and `.proj` tokens; with `ProgramAssembly`, workspace references SHALL include non-entry units via `references_at_offset_workspace`, using shared `SymbolId` equality when available, and SHALL honor `includeDeclaration`.

#### Scenario: Cross-unit go-to-definition
- **GIVEN** a resolved symbol whose `ItemInfo.source_path` points at a dependency unit
- **WHEN** the client requests go-to-definition at that symbol
- **THEN** the LSP returns a `file://` location for the dependency unit declaration span

### Requirement: Rename, signature help, symbols, and tokens
Rename and prepare rename SHALL be supported for resolved symbols and manifest tokens with identifier validation (`[A-Za-z_][A-Za-z0-9_]*`); invalid identifiers SHALL return no rename edit. Rename remains single-document per request. Signature help SHALL be supported for `.bd` call sites with one active signature derived from the callable hover payload. Document symbols SHALL be supported for `.bd` and `.proj` with stable symbol-kind mapping. Workspace symbols SHALL be supported for indexed `.bd` documents from open buffers plus closed-file workspace snapshots. Semantic tokens SHALL be supported in full-document mode with declaration tagging.

#### Scenario: Invalid rename identifier rejected
- **GIVEN** a resolved symbol at the cursor
- **WHEN** prepare rename or rename is requested with a new name that fails `[A-Za-z_][A-Za-z0-9_]*`
- **THEN** the server returns no rename edit

### Requirement: Code actions and diagnostic publication for IntelliSense
Code actions SHALL include source formatting for `.bd`, a quick-fix for unused imports (`W1503`) when diagnostic context is present, and documentation actions (generate/update `///` stubs with `@arg` / `@returns` / `@variant` / `@par` where applicable, plus quick fixes for W1610–W1615 and W1620–W1625). Diagnostics SHALL preserve compiler severity/code identity for open buffers and workspace-indexed closed files; for `.bd` files with a document analysis snapshot, published diagnostics SHALL be the union of semantic diagnostics and `doc_diagnostics` (stable sort by span then code).

#### Scenario: Unused import quick-fix offered
- **GIVEN** a `.bd` buffer with diagnostic `W1503` for an unused import
- **WHEN** code actions are requested at that diagnostic range
- **THEN** a quick-fix for the unused import is included

### Requirement: IntelliSense capability advertisement compatibility
Server capabilities in `initialize` SHALL accurately advertise only implemented IntelliSense methods. Extension integrations MUST rely on standard LSP capability negotiation and SHOULD NOT duplicate semantic analysis rules client-side. New IntelliSense methods MUST add both request handlers and capability advertisement in the same change.

#### Scenario: Unimplemented method not advertised
- **GIVEN** type definition and implementation navigation are not exposed as dedicated LSP methods
- **WHEN** the client reads server capabilities from `initialize`
- **THEN** those methods are not advertised as implemented

## REMOVED Requirements

### Requirement: IntelliSense capabilities and behavior conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
