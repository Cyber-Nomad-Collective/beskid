<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# IntelliSense capabilities and behavior Specification

## Purpose

Normative LSP IntelliSense feature contract for Beskid editors.

## Requirements

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

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: IntelliSense capabilities and behavior

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/lsp/intellisense-capabilities-and-behavior/`  
**Source:** `site/spec-content/platform-spec/tooling/lsp/intellisense-capabilities-and-behavior/content.md`  
**SHA-256:** `175996944b69858c0e0278d8f6d810cb293627d7e830f6be1dc0fdc4bb2c1416`

<details>
<summary>Migrated source text</summary>

``````markdown
## What this covers

This page defines the concrete IntelliSense behavior exposed by Beskid LSP to editors for `.bd` and `.proj` files. The contract is implementation-grounded and describes current supported behavior, limits, and compatibility expectations.

## Normative feature surface

1. **Completion** shall be provided for `.bd` and `.proj` documents. `.bd` completion candidates come from `beskid_analysis::services::completion_candidates(snapshot, source_text, offset)`; `.proj` completion includes manifest keywords and enum-like value suggestions.
2. **Project-aware `.bd` IntelliSense** — When `CompilationContext` resolves a `Project.proj` for the buffer path, `build_document_analysis_with_context` **shall** assemble via `ProgramAssembly`, resolve the entry unit with `ModuleIndex::resolve_entry_hir`, and expose `Resolution.module_imports` plus `ItemInfo.source_path` for cross-unit symbols.
3. **Member completion after import aliases** — After a trailing `.` following a registered `use` alias (for example `IO.` after `use Std.System.IO`), completion **shall** list public members from the aliased module path in the assembly `ModuleGraph`.
4. **`use` path completion** — On a `use` line, completion **shall** offer next path segments from assembly-known logical module paths (`assembly_module_paths` / `ModuleGraph`).
5. **Hover** shall return Markdown content for resolved `.bd` symbols and manifest tokens in `.proj`. The hover **range** shall use [`SymbolLocation`](compiler/crates/beskid_analysis/src/services/document.rs) and the declaring unit's source text when `ItemInfo.source_path` differs from the buffer path (same cross-file mapping as go-to-definition). Hover ranges **shall** map through `SymbolLocation` and the target unit source when `ItemInfo.source_path` differs from the buffer path (same cross-file range contract as go-to-definition).
6. **Go to definition** shall resolve to the declaration span for resolved symbols in `.bd`, using `ItemInfo.source_path` when set so the LSP returns a `file://` URI for dependency units; item targets **shall** be canonicalized through `Resolution.by_symbol` (`canonical_item_id`) before locating `ItemInfo`. In `.proj`, `path = "..."` dependency values shall navigate to the target `Project.proj`.
7. **Go to declaration** shall be supported and shall follow the same target resolution contract as go-to-definition.
8. **Find references** shall be supported for resolved `.bd` symbols and manifest tokens in `.proj`; when `CompilationContext` provides `ProgramAssembly`, workspace references **shall** include matches from non-entry units via `references_at_offset_workspace` (dependency units resolved with `ModuleIndex::resolve_unit_hir`); reference equality for exportable symbols **shall** use shared **`SymbolId`** from `SymbolRegistry` when available, not raw **`ItemId`** equality across per-unit resolutions; declaration inclusion shall follow the `includeDeclaration` request flag.
9. **Rename + prepare rename** shall be supported for resolved symbols and manifest tokens with identifier validation (`[A-Za-z_][A-Za-z0-9_]*`); invalid identifiers shall return no rename edit. Rename remains **single-document** per request even when workspace references span multiple files.
10. **Signature help** shall be supported for `.bd` call sites and return one active signature derived from the callable hover payload.
11. **Document symbols** shall be supported for `.bd` and `.proj` with stable symbol-kind mapping.
12. **Workspace symbols** shall be supported for indexed `.bd` documents from open buffers plus closed-file workspace snapshots.
13. **Code actions** shall include source formatting for `.bd`, a quick-fix for unused imports (`W1503`) when diagnostic context is present, and documentation actions (generate / update `///` stubs with `@arg` / `@returns` / `@variant` / `@par` where applicable, plus quick fixes tied to documentation warnings **W1610–W1615** and **W1620–W1625**) implemented in `beskid_lsp::features::code_actions::handler` using `beskid_analysis::doc::doc_comment_edit_for_offset`.
14. **Semantic tokens** shall be supported (full-document mode) with declaration tagging for symbol declarations.
15. **Diagnostics** shall preserve compiler severity/code identity and apply equally to open buffers and workspace-indexed closed files; for `.bd` files with a document analysis snapshot, published diagnostics shall be the **union** of semantic diagnostics and `doc_diagnostics` from the snapshot (stable sort by span then code).

## Current scope limits

- `rename` currently edits one document per request (the request document URI) even when additional workspace files may reference the same symbol.
- Type definition and implementation navigation are not exposed as dedicated LSP methods yet.
- Semantic tokens are full-refresh only; token range/delta updates are not advertised.

## Compatibility guarantees

- Server capabilities in `initialize` shall accurately advertise only implemented IntelliSense methods.
- Extension integrations must rely on standard LSP capability negotiation and should not duplicate semantic analysis rules client-side.
- New IntelliSense methods must add both request handlers and capability advertisement in the same change.

## Implementation anchors

- `compiler/crates/beskid_lsp/src/server/init.rs`
- `compiler/crates/beskid_lsp/src/server/backend.rs`
- `compiler/crates/beskid_lsp/src/features`
- `compiler/crates/beskid_lsp/src/features/code_actions/handler.rs`
- `compiler/crates/beskid_lsp/src/diagnostics.rs`
- `compiler/crates/beskid_analysis/src/services/document.rs`
- `compiler/crates/beskid_lsp/src/session/lifecycle.rs`
- `compiler/crates/beskid_analysis/src/doc/edit.rs`
- `beskid_vscode/src/lsp/beskidLanguageClient.ts`
- `beskid_vscode/src/runtime/BeskidExtensionRuntime.ts`

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
