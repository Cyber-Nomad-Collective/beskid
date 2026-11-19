<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# IntelliSense capabilities and behavior Specification

## Purpose

Normative LSP IntelliSense feature contract for Beskid editors.
## Requirements
### Requirement: Completion and project-aware IntelliSense
Completion SHALL be provided for `.bd`, `.bproj`, and `.bws` documents. `.bd` candidates SHALL come from `beskid_queries::completion_candidates`; `.bproj` and `.bws` completion SHALL include manifest keywords and enum-like value suggestions. Project-backed `.bd` IntelliSense SHALL assemble the current in-memory entry buffer through the shared `ProgramAssembly` prepare spine and expose generation-bound syntax facts for the resolved project. After a trailing `.` following a registered `use` alias, completion SHALL list public members from the aliased module path. While the member identifier is only partially typed, matching members SHALL remain available from a bounded owned dependency surface even when semantic lowering reports the expression as incomplete. A retained surface SHALL match both the current import's exact logical module path and its local binding; changing an import target while retaining its alias SHALL NOT expose members from the former target. The fallback surface SHALL be used only for imported-member completion; document symbols SHALL come from the recoverable current buffer, and diagnostics, rename, formatting, semantic tokens, navigation, and compilation SHALL NOT treat the fallback surface as current semantic authority. On a `use` line, completion SHALL offer next path segments from assembly-known logical module paths.

#### Scenario: Member completion after use alias
- **GIVEN** a `.bd` buffer with `use Core.Output` and a `CompilationContext` that resolves the project
- **WHEN** the user requests completion after `Output.`
- **THEN** candidates include public members from the aliased module path in the assembly `ModuleGraph`

#### Scenario: Partial imported member keeps current-generation suggestions
- **GIVEN** a `.bd` buffer where `Output.WriteLine` was edited to `Output.Wri`
- **WHEN** the client publishes the changed document and requests completion after `Wri`
- **THEN** candidates include `WriteLine`, document symbols reflect the changed buffer, and no stale dependency fallback is published as diagnostics or other semantic authority

#### Scenario: Editing one open buffer preserves sibling completion
- **GIVEN** two open `.bd` buffers import the same module and one already contains a partial member expression
- **WHEN** the other buffer advances the shared workspace Salsa generation
- **THEN** completion in the partial sibling still lists matching imported members from its owned dependency surface

#### Scenario: Use-path completion offers package-native segments
- **GIVEN** a `.bd` buffer in a project with the `Core` dependency
- **WHEN** the user requests completion after `use Core.`
- **THEN** candidates include the next segment `Output` and no candidate repeats the typed prefix or starts with `Std`

#### Scenario: Retargeted alias rejects former members
- **GIVEN** a `.bd` buffer previously imported `Old.Tools as Api`
- **WHEN** the current buffer changes the declaration to `New.Tools as Api` while semantic preparation is incomplete
- **THEN** completion after `Api.` does not list members retained from `Old.Tools`

### Requirement: Hover, navigation, and references
Hover SHALL return Markdown for resolved `.bd` symbols and `.bproj`/`.bws` manifest tokens; hover ranges SHALL map through generation-bound syntax locations and the declaring unit source. Go to definition SHALL resolve to the declaration span for resolved `.bd` symbols and SHALL navigate manifest `path = "..."` dependencies to the target `.bproj`. Go to declaration SHALL follow the same target resolution contract. Find references SHALL support resolved `.bd` symbols and manifest tokens; with `ProgramAssembly`, workspace references SHALL include non-entry units and SHALL honor `includeDeclaration`.

Hover on an attribute name at any declaration site SHALL resolve to the attribute declaration and show its target list; go to definition on it SHALL navigate to the declaration. Hover on a nominal type name SHALL append one line `transfer class: Shared | Moved | Copied | Never (reason)` from the transfer class query.

#### Scenario: Cross-unit go-to-definition
- **GIVEN** a resolved symbol whose `ItemInfo.source_path` points at a dependency unit
- **WHEN** the client requests go-to-definition at that symbol
- **THEN** the LSP returns a `file://` location for the dependency unit declaration span

#### Scenario: Hover on a parameter attribute
- **GIVEN** `pub attribute Trace(Parameter) { }` and `i64 Add([Trace] i64 left, i64 right)`
- **WHEN** the client hovers `Trace` inside the parameter list
- **THEN** the hover shows the declaration with the target `Parameter`

#### Scenario: Hover shows the transfer class
- **GIVEN** `[Immutable] pub type Job { string id; i64 size; }`
- **WHEN** the client hovers `Job` at a use site
- **THEN** the hover contains `transfer class: Shared`

### Requirement: Rename, signature help, symbols, and tokens
Rename and prepare rename SHALL be supported for resolved symbols and manifest tokens with identifier validation (`[A-Za-z_][A-Za-z0-9_]*`); invalid identifiers SHALL return no rename edit. Rename remains single-document per request. Signature help SHALL be supported for `.bd` call sites with one active signature derived from the callable hover payload. Document symbols SHALL be supported for `.bd`, `.bproj`, and `.bws` with stable symbol-kind mapping. Workspace symbols SHALL be supported for indexed `.bd` documents from open buffers plus closed-file workspace snapshots. Semantic tokens SHALL be supported in full-document mode with declaration tagging.

Semantic tokens SHALL tag attribute names at every declaration site (parameters, receivers, lambdas, lambda parameters, type parameters, `let` statements, enum variants, contract members, `impl` blocks, constants, attribute declarations) with the same token type as attributes on items. Completion inside `[` at any declaration site SHALL offer the attributes whose target list admits that site, and completion inside an `AttributeTargetList` SHALL offer the target catalogue.

#### Scenario: Invalid rename identifier rejected
- **GIVEN** a resolved symbol at the cursor
- **WHEN** prepare rename or rename is requested with a new name that fails `[A-Za-z_][A-Za-z0-9_]*`
- **THEN** the server returns no rename edit

#### Scenario: Attribute completion filtered by site
- **GIVEN** `pub attribute Trace(Parameter) { }` and `pub attribute Pure(LambdaExpression) { }`
- **WHEN** completion is requested inside `[` before a lambda
- **THEN** `Pure` is offered and `Trace` is not

### Requirement: Code actions and diagnostic publication for IntelliSense
Code actions SHALL include source formatting for `.bd`, a quick-fix for unused imports (`W1503`) when diagnostic context is present, and documentation actions (generate/update `///` stubs with `@arg` / `@returns` / `@variant` / `@par` where applicable, plus quick fixes for W1610–W1615 and W1620–W1625). Diagnostics SHALL preserve compiler severity/code identity for open buffers and workspace-indexed closed files; for `.bd` files with a document analysis snapshot, published diagnostics SHALL be the union of semantic diagnostics and `doc_diagnostics` (stable sort by span then code).

The LSP SHALL also offer these quick fixes: for **E1237** and **E1242**, insert `move ` before the named binding at the reported span; for **E1239** reported on a borrowed parameter and for **E1241**, insert `move ` before the parameter's type in its declaration; for **E1243**, rewrite `move x.f` to `exchange(x.f, <placeholder>)` with a snippet placeholder for the replacement value. Each fix SHALL be derived from an analysis rewrite and SHALL produce source that the formatter leaves unchanged. Hover on a parameter, receiver or local of Moved class SHALL state `owning` or `borrowed`; hover on a `[Captures]` parameter SHALL show its bound; hover on a lambda passed to a `[Captures]` parameter SHALL list each capture with its transfer class.

#### Scenario: Unused import quick-fix offered
- **GIVEN** a `.bd` buffer with diagnostic `W1503` for an unused import
- **WHEN** code actions are requested at that diagnostic range
- **THEN** a quick-fix for the unused import is included

#### Scenario: Quick fix inserts move
- **GIVEN** a document with the **E1242** diagnostic at `block` in `this.blocks.Push(block)`
- **WHEN** code actions are requested at the diagnostic
- **THEN** one action titled "Insert `move`" is offered whose edit yields `this.blocks.Push(move block)`

#### Scenario: Hover on a borrowed parameter
- **GIVEN** `i64 Checksum(u8[] data) { ... }`
- **WHEN** the client hovers `data`
- **THEN** the hover contains `borrowed` and `transfer class: Moved`

#### Scenario: Hover on a bounded lambda lists captures
- **GIVEN** `Run(() => config.retries + pixel.r)` where `Run` has a `[Captures(Bound: Transferable)]` parameter
- **WHEN** the client hovers the lambda arrow
- **THEN** the hover lists `config: Config (Shared)` and `pixel: Pixel (Copied)`

### Requirement: IntelliSense capability advertisement compatibility
Server capabilities in `initialize` SHALL accurately advertise only implemented IntelliSense methods. Extension integrations MUST rely on standard LSP capability negotiation and SHOULD NOT duplicate semantic analysis rules client-side. New IntelliSense methods MUST add both request handlers and capability advertisement in the same change.

#### Scenario: Unimplemented method not advertised
- **GIVEN** type definition and implementation navigation are not exposed as dedicated LSP methods
- **WHEN** the client reads server capabilities from `initialize`
- **THEN** those methods are not advertised as implemented

### Requirement: Only a member that is being typed is repaired for completion
When a line of an open `.bd` document ends with a member access outside a comment or a string, the server SHALL repair it for completion only when the access is a member that is being typed: `receiver.` with no member, or `receiver.Member` followed by a new statement, by `}` or by the end of the buffer. When other text follows `receiver.Member` (for example the `{` of a struct literal, a `.`, a `(` or an operator), the line ends a complete expression, and the server SHALL analyze the document as written.

#### Scenario: Struct literal of a qualified type
- **GIVEN** an open document with `Syntax.Span` at the end of a line and the `{` of its struct literal on the next line
- **WHEN** the server analyzes the document
- **THEN** the server analyzes the text as written, with no repair and no parse recovery

#### Scenario: Member being typed
- **GIVEN** an open document with `String.Le` at the end of a line and `return 0;` on the next line
- **WHEN** the server analyzes the document
- **THEN** the completion facts come from the text with `String.Le;`

### Requirement: Read-only document requests answer within a budget
A `textDocument/references`, `textDocument/signatureHelp` or `textDocument/inlayHint` request SHALL wait at most 100 ms for the analyzed facts of the newest text of the document. When the facts are not stored within that time, the server SHALL answer from the last analyzed facts of the document, with each span moved over the edit; a span inside the edited range SHALL be dropped. After an inlay-hint answer from carried facts, or without analyzed facts, the server SHALL send one `workspace/inlayHint/refresh` request when the facts of the newest text are stored, only to a client that sets `workspace.inlayHint.refreshSupport`, and at most one inlay-hint refresh SHALL wait for each document.

#### Scenario: References during a burst of edits
- **GIVEN** an open `.bd` document whose analysis finishes one edit after the newest text
- **WHEN** the client edits the document every 50 ms and requests references during the edits
- **THEN** the server answers within 1 s from the carried facts, and the locations are positions in the newest text

#### Scenario: Inlay hint refresh after a stale answer
- **GIVEN** a client that sets `workspace.inlayHint.refreshSupport` and an inlay-hint answer from carried facts
- **WHEN** the analysis of the newest text of that document stores its facts
- **THEN** the server sends one `workspace/inlayHint/refresh` request

### Requirement: Edit-producing requests never use facts of an older text
A `textDocument/rename`, `textDocument/prepareRename` or `textDocument/codeAction` request SHALL wait at most 500 ms for the analyzed facts of the newest text of an open document. The 500 ms SHALL include each wait for the server state that the request reads the facts from. When the facts are not stored within that time, or the server state is not free within that time, the server SHALL fail the request with the `ContentModified` error (`-32801`) and SHALL NOT compute edits from older facts. When the client changes the document after the server takes the facts and before it sends the answer, the server SHALL fail the request with `ContentModified`.

#### Scenario: Rename during a burst of edits
- **GIVEN** an open `.bd` document whose analysis finishes one edit after the newest text
- **WHEN** the client edits the document every 50 ms and requests a rename during the edits
- **THEN** the server fails the request with `ContentModified` within 1 s and sends no workspace edit

#### Scenario: Edit during the computation of a rename
- **GIVEN** a rename whose facts match the newest text
- **WHEN** the client sends an edit of the document before the server answers
- **THEN** the server fails the request with `ContentModified`

#### Scenario: Code actions while the server state is held
- **GIVEN** an open `.bd` document whose newest text is analyzed, and a writer that holds the server state for 2 s
- **WHEN** the client requests code actions
- **THEN** the server fails the request with `ContentModified` within 1 s

#### Scenario: Rename with current facts
- **GIVEN** an open `.bd` document whose newest text is analyzed within 500 ms
- **WHEN** the client requests a rename
- **THEN** the server answers with edits for the newest text

### Requirement: Code actions answer within a computation budget
After a `textDocument/codeAction` request has the facts of the newest text, the server SHALL wait at most 500 ms for the actions. The server SHALL compute the actions in this order: the fixes attached to the diagnostics of the request, the quick fixes for those diagnostics, then the source actions (format the document, write the documentation comment). When the 500 ms end first, the server SHALL answer with the actions computed by then and SHALL stop the computation. The server SHALL NOT answer with an action that it computed from facts of an older text.

#### Scenario: Slow formatting of a large document
- **GIVEN** an open `.bd` document whose whole-document formatting takes 2 s
- **WHEN** the client requests code actions
- **THEN** the server answers within 1 s after it has the facts, with the quick fixes and without the "Format document" action

### Requirement: No document request waits without a limit
No document request SHALL wait for analyzed facts longer than its budget. A background task that waits for the facts of the newest text before it sends a refresh request SHALL wait at most 30 s, and SHALL then send the refresh request.

#### Scenario: Endless edits
- **GIVEN** a client that edits a document without a pause
- **WHEN** the client sends document requests during the edits
- **THEN** each request answers within its budget, and each waiting refresh is sent within 30 s

### Requirement: Semantic tokens answer within a budget
A `textDocument/semanticTokens/full` request SHALL wait at most 100 ms for the analyzed facts of the newest text of the document. When the facts are not stored within that time, the server SHALL answer from the last analyzed facts of the document, with each token span moved over the edit; a span inside the edited range SHALL be dropped. A document without analyzed facts SHALL get a null result. After such an answer, the server SHALL send one `workspace/semanticTokens/refresh` request when the facts of the newest text are stored, or after at most 30 s, only to a client that sets `workspace.semanticTokens.refreshSupport`, and at most one refresh SHALL wait for each document.

#### Scenario: Tokens during a burst of edits
- **GIVEN** an open `.bd` document whose analysis takes seconds
- **WHEN** the client edits the document every 150 ms and requests semantic tokens during the edits
- **THEN** the server answers within the budget from the carried facts, and the tokens before and after the edited range keep their positions in the newest text

#### Scenario: Refresh after a stale answer
- **GIVEN** a client that sets `workspace.semanticTokens.refreshSupport` and a stale semantic-tokens answer for a document
- **WHEN** the analysis of the newest text of that document stores its facts
- **THEN** the server sends one `workspace/semanticTokens/refresh` request

#### Scenario: No refresh without client support
- **GIVEN** a client without `workspace.semanticTokens.refreshSupport`
- **WHEN** the server answers semantic tokens from carried facts
- **THEN** the server sends no `workspace/semanticTokens/refresh` request

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

This page defines the concrete IntelliSense behavior exposed by Beskid LSP to editors for `.bd`, `.bproj`, and `.bws` files. The contract is implementation-grounded and describes current supported behavior, limits, and compatibility expectations.

## Normative feature surface

1. **Completion** shall be provided for `.bd`, `.bproj`, and `.bws` documents. `.bd` completion candidates come from `beskid_queries::completion_candidates`; manifest completion includes keywords and enum-like value suggestions.
2. **Project-aware `.bd` IntelliSense** — When `CompilationContext` resolves a `.bproj` for the buffer path, the LSP **shall** assemble the exact open-buffer input via `ProgramAssembly`, register one current syntax generation in the shared Salsa database, and expose generation-bound cross-unit facts.
3. **Member completion after import aliases** — After a trailing `.` following a registered `use` alias (for example `Output.` after `use Core.Output`), completion **shall** list public members from the aliased module path in the assembly `ModuleGraph`.
4. **`use` path completion** — On a `use` line, completion **shall** offer next path segments from assembly-known logical module paths (`assembly_module_paths` / `ModuleGraph`).
5. **Hover** shall return Markdown content for resolved `.bd` symbols and manifest tokens in `.bproj`/`.bws`. Hover ranges **shall** use the declaring unit's generation-bound syntax span and source path.
6. **Go to definition** shall resolve to the declaration span for resolved symbols in `.bd`, returning a `file://` URI for dependency units. In `.bproj`/`.bws`, `path = "..."` dependency values shall navigate to the target manifest.
7. **Go to declaration** shall be supported and shall follow the same target resolution contract as go-to-definition.
8. **Find references** shall be supported for resolved `.bd` symbols and manifest tokens in `.bproj`/`.bws`; when `CompilationContext` provides `ProgramAssembly`, workspace references **shall** include matches from non-entry units; declaration inclusion shall follow the `includeDeclaration` request flag.
9. **Rename + prepare rename** shall be supported for resolved symbols and manifest tokens with identifier validation (`[A-Za-z_][A-Za-z0-9_]*`); invalid identifiers shall return no rename edit. Rename remains **single-document** per request even when workspace references span multiple files.
10. **Signature help** shall be supported for `.bd` call sites and return one active signature derived from the callable hover payload.
11. **Document symbols** shall be supported for `.bd`, `.bproj`, and `.bws` with stable symbol-kind mapping.
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
