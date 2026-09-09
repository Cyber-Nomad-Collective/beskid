# Research: incremental editor architecture for Beskid LSP

**Date:** 2026-09-09
**Scope:** Editor text synchronization, incremental query ownership, request concurrency, cancellation, incomplete-source completion, and diagnostics scheduling.
**Status:** Adopted by the Zed/LSP workstream; implementation and contract verification are tracked with the related compiler and root changes.

## Executive decision

Beskid LSP should have one logical, workspace-scoped Salsa storage. A single mutation coordinator must apply ordered document and project changes to that storage. Interactive requests should use cheap cloned database handles plus an immutable request snapshot that binds the document text, LSP version, syntax generation, and project-input revision. Read-only queries may then run in parallel without holding the mutation coordinator.

An edit makes old semantic work obsolete inside the server, but the LSP boundary still matters: cancel obsolete internal Salsa work promptly, honor explicit `$/cancelRequest`, return `ContentModified` where an in-flight request can no longer be answered correctly, and suppress stale server-initiated publications. Do not publish a diagnostic or other notification after its captured document version ceased to be current.

Completion must remain useful while the file is syntactically incomplete. It should consume tolerant, generation-bound syntax facts. If completion needs a speculative token or repaired fragment, that overlay must be an ephemeral child of the captured document generation; it must not mutate canonical inputs, create a second semantic database, or become diagnostics authority.

Diagnostics should have two tiers: cheap current-generation syntax diagnostics available immediately, and full dependency/semantic diagnostics coalesced behind an idle debounce. A full result is publishable only if the captured `(URI, version, generation, project revision)` is still current when computation finishes.

## Primary-source comparison

| Implementation | Edit and snapshot model | Concurrency and cancellation | Incomplete input and completion | Diagnostics policy |
| --- | --- | --- | --- | --- |
| rust-analyzer with Salsa | `AnalysisHost` transactionally applies input changes and creates immutable `Analysis` snapshots. Syntax trees are single-file value types, deliberately incomplete, and parsing returns a tree plus errors rather than failing. [rust-analyzer architecture](https://github.com/rust-lang/rust-analyzer/blob/f3120321073d8046795c6824976be8b0ae92c999/docs/book/src/contributing/architecture.md), [edit application](https://github.com/rust-lang/rust-analyzer/blob/f3120321073d8046795c6824976be8b0ae92c999/crates/rust-analyzer/src/global_state.rs#L340-L450) | State-changing or typing-blocking work stays on the main loop; independent requests run in the background. An input revision change causes Salsa work on the old revision to unwind as cancelled. Cloned Salsa database handles share memoized storage but have independent query stacks; mutation waits for parallel handles. [rust-analyzer cancellation](https://github.com/rust-lang/rust-analyzer/blob/f3120321073d8046795c6824976be8b0ae92c999/docs/book/src/contributing/architecture.md#cancellation), [request dispatcher](https://github.com/rust-lang/rust-analyzer/blob/f3120321073d8046795c6824976be8b0ae92c999/crates/rust-analyzer/src/handlers/dispatch.rs#L236-L274), [Salsa database and runtime](https://github.com/salsa-rs/salsa/blob/e021c01d4939408c89c9325ad2426660117a8b32/book/src/plumbing/database_and_runtime.md), [Salsa cancellation](https://github.com/salsa-rs/salsa/blob/e021c01d4939408c89c9325ad2426660117a8b32/book/src/tuning.md#cancellation) | The parser never fails and AST children may be absent even when the grammar normally requires them. Completion explicitly expects incomplete trees and can use a synthetic identifier or speculative expansion. [completion strategy](https://github.com/rust-lang/rust-analyzer/blob/f3120321073d8046795c6824976be8b0ae92c999/crates/ide-completion/src/lib.rs#L141-L190) | Derived facts are lazy and incremental; a body edit should not invalidate unrelated global facts. Broken builds must not disable unrelated IDE features. Diagnostics are generation-tagged so newer generations replace old results. [diagnostic generation handling](https://github.com/rust-lang/rust-analyzer/blob/f3120321073d8046795c6824976be8b0ae92c999/crates/rust-analyzer/src/diagnostics.rs#L201-L229) |
| TypeScript language service / tsserver 5.9 | The host supplies immutable `IScriptSnapshot` values, script versions, and an optional change range from the prior snapshot so the parser can update incrementally. `ScriptInfo` invalidates its cached snapshot/line map on edit and marks containing projects dirty. [language-service snapshot contract](https://github.com/microsoft/TypeScript/blob/5be33469d551655d878876faa9e30aa3b49f8ee9/src/services/types.ts#L193-L213), [script storage](https://github.com/microsoft/TypeScript/blob/5be33469d551655d878876faa9e30aa3b49f8ee9/src/server/scriptInfo.ts) | The language-service host owns threading and exposes a cancellation token. tsserver supports per-request cancellation and splits `geterr` into delayed work so newer interactive operations are not trapped behind diagnostics. [Language Service API](https://github.com/microsoft/TypeScript/wiki/Using-the-Language-Service-API), [standalone tsserver](https://github.com/microsoft/TypeScript/wiki/Standalone-Server-%28tsserver%29) | Completion finds relevant tokens around the cursor and explicitly supports re-triggering incomplete completion lists. Its implementation contains recovery for transient forms such as missing commas. [completion implementation](https://github.com/microsoft/TypeScript/blob/5be33469d551655d878876faa9e30aa3b49f8ee9/src/services/completions.ts), [completion service design](https://github.com/microsoft/TypeScript/wiki/Codebase-Services-Completions) | Syntactic and semantic diagnostics are separate per-file operations. The service does only the work needed for the requested operation; `geterr` is scheduled incrementally and cancellably. |
| clangd | `TUScheduler` tracks the latest contents per translation unit. Each file has a serial `ASTWorker` queue: reads observe exactly the writes before them, while different files can proceed independently. [threading design](https://clangd.llvm.org/design/threads), [code walkthrough](https://clangd.llvm.org/design/code) | The scheduler discards cancelled reads and coalesces obsolete writes. Writes are debounced unless a read forces the latest AST. Long operations are cancellable, and work for different files uses independent workers. | Completion deliberately performs a fresh parse with a completion token inserted into incomplete source. It may use the preamble available immediately, accepting explicitly bounded staleness for dependencies to protect latency, while the edited main-file text is the requested version. [threading design](https://clangd.llvm.org/design/threads) | clangd need not diagnose every intermediate version. Its extension lets a client require diagnostics for an exact revision, suppress them, or accept the normal bounded-staleness heuristic. [diagnostics extension](https://clangd.llvm.org/extensions#force-diagnostics-generation) |
| SourceKit-LSP | `DocumentSnapshot` is an immutable, sendable `(URI, version, text)` view. `DocumentManager.edit` applies sequential changes, reports non-increasing versions, and returns pre- and post-edit snapshots. Syntax trees are cached by snapshot ID and incrementally derived from the prior snapshot. [document snapshots](https://github.com/swiftlang/sourcekit-lsp/blob/a463483aba304581bad19a0d96d80091af3c8b52/Sources/SourceKitLSP/DocumentManager.swift), [syntax-tree manager](https://github.com/swiftlang/sourcekit-lsp/blob/a463483aba304581bad19a0d96d80091af3c8b52/Sources/SwiftLanguageService/SyntaxTreeManager.swift) | Actors isolate caches and managers. Pending per-document work can be cancelled on edit; completion is serialized only because sourcekitd itself exposes one global completion session, rather than serializing every language-service query. [request cancellation](https://github.com/swiftlang/sourcekit-lsp/blob/a463483aba304581bad19a0d96d80091af3c8b52/Sources/SourceKitLSP/SourceKitLSPServer.swift#L470-L525), [completion session](https://github.com/swiftlang/sourcekit-lsp/blob/a463483aba304581bad19a0d96d80091af3c8b52/Sources/SwiftLanguageService/CodeCompletionSession.swift) | A completion request captures one `DocumentSnapshot` and syntax tree. Session reuse checks the document, position, and snapshot relationship; opening a session rejects a different version from the one captured. [completion entry](https://github.com/swiftlang/sourcekit-lsp/blob/a463483aba304581bad19a0d96d80091af3c8b52/Sources/SwiftLanguageService/CodeCompletion.swift), [session version guard](https://github.com/swiftlang/sourcekit-lsp/blob/a463483aba304581bad19a0d96d80091af3c8b52/Sources/SwiftLanguageService/CodeCompletionSession.swift#L268-L297) | An edit cancels the prior publish-diagnostics task. Diagnostic computations are cached by snapshot ID, old versions are evicted, and cancellation is checked around sourcekitd work. [diagnostic manager](https://github.com/swiftlang/sourcekit-lsp/blob/a463483aba304581bad19a0d96d80091af3c8b52/Sources/SwiftLanguageService/DiagnosticReportManager.swift) |

TypeScript 5.9.2 is used above to pin the mature JavaScript tsserver implementation and make the comparison reproducible.

## Protocol constraints

The LSP text-sync contract is sequential. A server must apply `textDocument/didChange` notifications in receive order, and changes within one notification in array order; each range is relative to the state produced by the preceding change. The version identifies the state after all changes in that notification. [LSP `didChange`](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_didChange)

Document versions increase after each change. Push diagnostics can carry the corresponding version, and clients can advertise that they interpret it. [LSP versioned document identifier](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#versionedTextDocumentIdentifier), [LSP publish diagnostics](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_publishDiagnostics)

There is one important distinction between internal cancellation and protocol behavior. The LSP guidance says a server should not reject a request merely because a state-change notification is waiting in the queue: the client may still be able to use the old result. If the server's own applied state change invalidates in-flight work, it may return `ContentModified`; explicit client cancellation remains `$/cancelRequest`. [LSP implementation considerations](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#implementationConsiderations)

## Current Beskid footing

The present branch already establishes several useful pieces:

- [`BeskidDatabase`](../../compiler/crates/beskid_queries/src/db.rs) is cloneable and owns Salsa storage plus shared registries.
- [`parallel_compilation_db`](../../compiler/crates/beskid_lsp/src/session/db_access.rs) clones a query handle under the mutation gate, then releases the gate so read-only queries can run concurrently.
- [`Document`](../../compiler/crates/beskid_lsp/src/session/store.rs) stores the LSP version, exact text, generation-bound syntax facts, an optional current entry completion anchor, and a bounded owned imported-member surface. A partial edit retains only surfaces whose exact logical import path and local binding still match the recoverable current-buffer import; fallback requests additionally require a current path-expression span, excluding retargeted or deleted imports, comments, and strings.
- [`set_document`](../../compiler/crates/beskid_lsp/src/session/lifecycle/documents.rs) serializes mutations and rejects regressing versions. It computes entry-only facts synchronously; the server separately schedules a 120 ms coalesced full-diagnostics path.
- [`snapshot_request`](../../compiler/crates/beskid_lsp/src/protocol/request.rs) clones the document before feature work, providing a good immutable request boundary.
- [`schedule_publish_diagnostics`](../../compiler/crates/beskid_lsp/src/server/backend.rs) coalesces edits with a per-URI revision and a short delay.

The adopted implementation captures the document and a read-only cloned Salsa handle while holding the same per-URI document-update boundary. Cloned handles are never used for input mutation: Salsa requires the writer to cancel and await peer handles before advancing a revision. Unrelated buffers use independent document fences, while the one Salsa writer keeps input commits coherent. The debounced diagnostic path holds that writer only long enough to synchronize sources and produce an owned syntax assembly; full downstream dependency analysis then runs on a blocking worker without Salsa or LSP state locks. That detached analysis uses an isolated prepare mode which neither reads nor writes the process-global entry-session, semantic-snapshot, or executable caches and does not materialize declared generator outputs, so overlapping document generations cannot substitute assemblies, overwrite generated project files, or poison later compiler work. Diagnostic computation revalidates both version and exact text immediately before storing version-tagged facts, then releases the fence before client I/O so a slow transport cannot stall edits. Byte-identical text at a newer version cannot admit stale facts. Transport-level text-sync tickets are scoped by document URI: a request dispatched after a same-document `didOpen`, `didChange`, or `didClose` waits for that document's preceding notifications, while separate buffers remain independent. A newer Salsa input revision maps cancelled completion work to LSP `ContentModified`, allowing the client to retry instead of receiving an internal error.

## Recommended Beskid model

### 1. One storage, two handle roles

Use one `BeskidDatabase` storage per workspace session:

- The **writer handle** is owned by a mutation coordinator. Only it changes file text, manifest/build inputs, dependency graph inputs, or configuration.
- A **query handle** is a cheap clone obtained after a committed mutation. Many query handles may execute concurrently and share memoized results.
- A request snapshot is an immutable value containing at least `URI`, LSP document version, syntax generation, project-input revision, exact text or text identity, and the cloned query handle.

“One shared database” must not mean “hold one mutex for all queries.” That would preserve correctness but discard the concurrency Salsa is designed to provide. Conversely, independently constructed databases per request would lose memoization and permit divergent semantic worlds.

### 2. Establish a linear mutation boundary

Route `didOpen`, `didChange`, `didClose`, watched-file changes, focused-project changes, and settings that affect semantics through one ordered coordinator. For each `didChange`:

1. Validate that the document is open and the new version is strictly newer than the prior editor version.
2. Apply every content change in listed order to the coordinator's current text.
3. Commit all affected Salsa inputs as one logical revision.
4. Mint the document syntax generation and immutable `Document` facts from that committed revision.
5. Only then allow later requests for that document to capture snapshots.

Requests received before an edit may finish against their captured snapshot if the protocol permits that result to remain useful. Requests dispatched after the edit must never observe a mix of pre-edit document facts and post-edit project inputs.

### 3. Bind results to snapshot identity

Every asynchronous operation should carry a `SnapshotId`, conceptually:

```text
SnapshotId = (workspace session, URI, LSP version, syntax generation, project revision)
```

Before updating a cache or sending a server-initiated notification, compare the captured ID with the current ID. If it differs, discard the result. For an LSP request, honor explicit cancellation first; if an internal revision change made a correct response impossible, return `ContentModified` where the client supports retry. A completion resolve item should embed enough stable identity to reject or reconstruct an obsolete session rather than consulting mutable “last completion” state.

Salsa cancellation points cover query boundaries. Beskid code that spends material time in loops outside tracked queries should add explicit revision/cancellation checks so an edit does not wait behind work that can no longer be published.

### 4. Make partial-input completion an explicit product

The canonical parser should produce the best available syntax tree plus diagnostics for incomplete input. Completion should derive a `CompletionContext` from the captured generation even when an expected delimiter, argument, member, or declaration tail is missing.

If the grammar cannot recover at the cursor, use one bounded speculative overlay:

- inject a completion sentinel or synthesize the smallest missing token around the cursor;
- parse only as an ephemeral child of the captured snapshot;
- reuse only the bounded owned imported-member surface captured from that document's prepared assembly;
- never register the speculative tree as the document's canonical syntax generation;
- never use it for diagnostics, rename, formatting, or code generation.

This combines rust-analyzer's tolerant tree model with clangd's bounded preamble technique while retaining Beskid's generation authority. Beskid's current implementation does not register a speculative tree: recoverable current-buffer syntax supplies the outline, and the document-owned imported-member surface supplies only member candidates when the current entry anchor is unavailable.

### 5. Separate fast feedback from full diagnostics

On edit, immediately replace or clear diagnostics for the old editor version and make current-generation parse/structural diagnostics available without preparing the full closure. Schedule full semantic diagnostics per URI with a coalescing revision and configurable debounce. A new edit cancels or supersedes the pending task.

At completion, revalidate the full `SnapshotId`. Publish the full set only for the exact current version, always include the LSP version, and publish an empty set when necessary to clear prior diagnostics. Save-time, explicit diagnostic pulls, or operations that require semantic truth may force the latest full preparation instead of waiting for the idle timer.

Do not globally debounce all analysis. Completion, hover, and navigation should query the latest committed snapshot immediately; only expensive proactive work such as full diagnostics, indexing, or persistence belongs behind coalescing schedules.

## Required contract tests

1. **Ordered synchronization:** multiple incremental changes in one notification and multiple queued notifications produce exactly the client text; a non-increasing version is rejected without mutation.
2. **Atomic snapshot capture:** a request sees either all pre-edit inputs or all post-edit inputs, never document facts from one revision and project inputs from another.
3. **Parallel reads:** two independent query handles execute concurrently and share memoized work; a writer waits safely and then makes old work cancellable.
4. **Stale request behavior:** explicit cancellation is honored; an internally invalidated request returns `ContentModified` when appropriate; no old result contaminates a new-generation cache.
5. **Stale publication suppression:** if an edit or project change lands while full diagnostics run, no diagnostics for the captured old `SnapshotId` are published, even when the new text is byte-for-byte equal.
6. **Partial completion:** useful completions survive missing delimiters, partial identifiers, missing commas, incomplete member access, and a temporarily invalid surrounding declaration.
7. **Speculative isolation:** a completion overlay cannot become canonical syntax, diagnostics, rename, formatting, semantic-token, or code-generation input.
8. **Diagnostic coalescing:** rapid edits produce one full run for the final generation, while syntax feedback remains available and a forced latest-generation diagnostic request bypasses the idle delay.
9. **Cancellation latency:** representative expensive loops observe cancellation within a measured bound after a new input revision.

## Architecture limits

clangd's use of an available older preamble is a deliberate latency tradeoff, not permission to mix arbitrary generations. Beskid may reuse a bounded owned dependency surface only from the target document's completion snapshot and only for imported-member candidates. Diagnostics, rename, formatting, semantic tokens, navigation, and compilation fail closed or await current facts.

No surveyed implementation makes a successful full compile a prerequisite for editor interaction. Beskid should likewise keep syntax-derived completion and navigation available when semantic preparation fails, while clearly withholding results that require facts not proven for the captured generation.
