---
description: Beskid LSP architecture and protocol specification
---

# Beskid LSP Architecture and Protocol Specification

## 1. Objective

Build a production-grade Language Server Protocol implementation for Beskid with `tower-lsp-server`, reusing the existing parsing/analysis pipeline and diagnostics model.

Primary outcome: editor feedback that is semantically consistent with CLI analysis and stable enough for everyday use.

## 2. Context from existing codebase

Beskid already provides key building blocks required for an LSP:

- Parser entrypoint (`BeskidParser`) and syntax model (`Program`).
- Rich source spans via `SpanInfo` (byte + line/column data).
- Structured diagnostics with code/severity/help fields.
- A staged semantic pipeline (`builtin_rules()`) producing deterministic diagnostics.
- Resolver + type-checking flows used in runtime compilation paths.

This enables an LSP architecture where `beskid_lsp` is a thin protocol/service layer and semantic logic stays in `beskid_analysis`.

## 3. Product vision

### 3.1 Experience goals

- Fast diagnostics during typing.
- Trustworthy navigation (definition/symbol lookup).
- Clear and actionable messages with stable diagnostic codes.
- Capability growth without protocol breakage.

### 3.2 Non-functional goals

- No stale diagnostic publication.
- Bounded latency under rapid edits.
- Safe cancellation and version-aware request handling.
- Deterministic behavior for identical inputs.

## 4. Scope and capability matrix

## 4.1 MVP capabilities (Phase 1-2)

- `initialize`
- `initialized`
- `shutdown`
- `textDocument/didOpen`
- `textDocument/didChange`
- `textDocument/didSave`
- `textDocument/didClose`
- `textDocument/publishDiagnostics`
- `textDocument/documentSymbol`
- `textDocument/hover`
- `textDocument/definition`

## 4.2 Post-MVP capabilities (Phase 3+)

- `textDocument/completion`
- `textDocument/references`
- `textDocument/prepareRename`
- `textDocument/rename`
- `textDocument/codeAction`
- `workspace/symbol`
- `textDocument/semanticTokens/full`

## 4.3 Out-of-scope (initial)

- Build tool discovery and project model resolution beyond workspace roots.
- Macro-aware advanced tooling before macro pipeline is stabilized.
- Speculative background indexing for unopened files (until core quality gates are green).

## 4.4 Locked implementation decisions

- Server runtime mode is **stdio-only**.
- Baseline dependency set includes `tokio`, `tower-lsp-server`, and `tracing`.
- MVP capabilities are locked to diagnostics, hover, document symbols, and go-to-definition.
- Text sync starts with `TextDocumentSyncKind::FULL`; incremental sync is a follow-up optimization.

## 5. Target crate/module architecture

Proposed `src/beskid_lsp/src` layout:

- `lib.rs`
  - public entrypoint(s), module exports.
- `server.rs`
  - `tower_lsp::LanguageServer` implementation.
- `state.rs`
  - server-wide state, workspace settings, caches.
- `document.rs`
  - per-document snapshot and versioned text handling.
- `analysis.rs`
  - bridge into parser + semantic pipeline.
- `position.rs`
  - UTF-8/UTF-16 and span/range conversions.
- `diagnostics.rs`
  - semantic diagnostic -> LSP diagnostic adapter.
- `features/`
  - `hover.rs`
  - `definition.rs`
  - `symbols.rs`
  - `completion.rs` (deferred)
  - `references.rs` (deferred)
  - `rename.rs` (deferred)
  - `code_action.rs` (deferred)

This keeps protocol handling cohesive while maintaining strict separation from language semantics.

## 6. State model and data contracts

## 6.1 Server state

`ServerState` should include:

- `client: tower_lsp::Client`
- `documents: HashMap<Url, DocumentState>` (or concurrent map)
- `workspace_folders: Vec<PathBuf>`
- `config: LspConfig`
- `request_gate: cancellation/version gate`

## 6.2 Document state

`DocumentState` should include:

- `version: i32`
- `text: Arc<String>`
- `analysis_snapshot: Option<AnalysisSnapshot>`
- `last_diagnostics_hash: u64`

`AnalysisSnapshot` should include:

- parsed syntax tree (or normalized representation)
- optional HIR/resolution/type artifacts as they become needed by features
- normalized symbol table extracts for feature queries

## 7. Analysis execution model

## 7.1 Trigger policy

Run analysis on:

- didOpen
- didChange (debounced)
- didSave (force immediate)

Clear diagnostics on didClose.

## 7.2 Debounce and cancellation

- Default debounce: 200ms (configurable).
- Newer document versions cancel older pending analysis tasks.
- Publish diagnostics only if task version matches current document version.

## 7.3 Error handling policy

- Parser failures should still produce LSP diagnostics when possible.
- Internal server errors should not panic the process.
- Non-user-actionable internal failures are logged and surfaced minimally.

## 8. Position/range specification

LSP uses UTF-16 positions; current compiler spans are byte-based with line/column metadata.

Define a canonical conversion module with the following behavior:

1. Prefer trusted `line_col_start` / `line_col_end` when available.
2. Convert to zero-based LSP positions.
3. Clamp positions to current document bounds.
4. Guarantee non-inverted ranges; if identical, keep zero-length range valid.
5. Maintain consistency across diagnostics, definition, hover, and rename.

A single conversion path must be used by all features to avoid subtle range drift.

## 9. Diagnostic mapping specification

Map semantic diagnostics into `lsp_types::Diagnostic`:

- `code` <- semantic diagnostic code (string)
- `message` <- semantic message
- `severity` mapping:
  - Error -> Error
  - Warning -> Warning
  - Note -> Information
- `range` <- converted from source span
- `source` <- `beskid`
- `related_information` <- attach where previous span/source is available (future)

Publication policy:

- Publish only for open documents.
- Include document version when publishing.
- Avoid duplicate publication by hashing payload when unchanged.

## 10. Feature contracts

## 10.0 Navigation data sources (normative)

Navigation features must use a hybrid model:

- **Query API (`beskid_analysis::query`)** for structural traversal/discovery in syntax trees.
  - Primary use: document symbol extraction, AST node discovery at cursor, structural filtering.
- **Resolver/type artifacts** for semantic identity and correctness.
  - Primary use: go-to-definition target resolution, semantic hover payloads, and future references/rename.

Semantic artifacts are the source of truth whenever structure and semantics disagree.

## 10.1 Document symbols

- Provide top-level items from parsed/semantic model:
  - function, type, enum, contract, module.
- Use Query traversal as the default extraction path for symbol discovery.
- Use `DocumentSymbol` hierarchical form where possible.

## 10.2 Hover

- For symbol under cursor, provide:
  - kind,
  - signature/type summary,
  - optional docs string in future.
- Return markdown content with concise format.

## 10.3 Go to definition

- Use resolver artifacts for identifier -> declaration mapping.
- Use Query-assisted node localization to identify source node under cursor before semantic resolution.
- Return single location for deterministic resolution.
- For ambiguous unresolved symbols: return `None` (no speculative jumps).

## 10.4 Completion (deferred)

- Start with keyword + local scope + top-level item completion.
- Introduce context-aware ranking only after correctness baseline.

## 10.5 Rename (deferred)

- Implement `prepareRename` before enabling rename capability.
- Support rename only for symbols with reliable reference graph.

## 10.6 Code actions (deferred)

Initial actions should be deterministic and safe:

- Add missing `mut` for immutable assignment diagnostics.
- Qualify enum constructor paths.
- Optional import insertion where module graph is reliable.

## 11. Configuration contract

Namespace: `beskid.lsp`

- `diagnostics.enable: bool` (default `true`)
- `diagnostics.emitWarnings: bool` (default `true`)
- `diagnostics.debounceMs: number` (default `200`)
- `trace.server: "off" | "messages" | "verbose"` (default `off`)
- `features.semanticTokens: bool` (default `false`)

Configuration updates via `workspace/didChangeConfiguration` must rehydrate runtime settings safely.

## 12. Compatibility and negotiation policy

- Advertise only implemented capabilities.
- Prefer static registration for MVP; dynamic registration only where necessary.
- Keep protocol behavior aligned with LSP 3.16/3.17 feature expectations exposed by `tower-lsp-server`.

## 13. Security and resilience

- Never execute external commands from LSP requests.
- Avoid arbitrary file reads outside workspace roots unless explicitly allowed.
- Validate all incoming request parameters defensively.
- Add guardrails for very large files (size/time limits for analysis).

## 14. Quality gates (must-pass)

- No process panic caused by malformed client input.
- No stale diagnostics across rapid edit sequences.
- Position conversion correctness on ASCII and multibyte text.
- Definition/hover results are version-consistent with active document state.

## 15. Architectural constraints

- Semantic logic remains in analysis/resolution crates.
- LSP crate provides adapters, orchestration, caching, and protocol transport.
- Shared utility modules (e.g., span conversion) must be reused across features (DRY).
- Public interfaces should remain small and capability-driven (SOLID).
