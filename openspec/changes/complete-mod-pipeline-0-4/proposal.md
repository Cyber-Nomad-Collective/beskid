## Why

Beskid 0.4 cannot claim a complete mod host while four contract
features remain stubbed end-to-end. `AnalyzerDiagnostic` carries only
`(code, message, severity)` with no source span, so LSP cannot anchor a
mod diagnostic to source and cannot offer a code action for it.
`RewriterOutcome` carries only `type_id` and `applied_fix_count`, and
`run_rewriters` returns its input `Program` unchanged, so rewriter
contracts have no observable effect. There is no bridge that surfaces
mod analyzer diagnostics or rewriter edits as LSP `Diagnostic` and
`CodeAction` values, so editor users see none of the mod pipeline.
Finally `NativeContractInvoker` records object paths and delegates to
`StubContractInvoker`; mod AOT artifacts emit relocatable `.o` files,
not dlopen-ready shared libraries, so no mod contract ever executes
through the C ABI.

The ABI layer already declares `ModDiagnostic` (with `span_start` /
`span_end`), `ModEdit` (with `kind` / `start` / `end` / `text`),
`ModAnalysisResult`, `ModRewriteResult`, and entry function typedefs
for all four contract kinds, but the host bridge, native dispatch,
compiler-sdk mirror types, and LSP surfaces do not use them. This
change completes the contract before implementation continues so the
mod pipeline is observable, native, and editor-integrated for 0.4.

## What Changes

- **MODIFY** `compiler--compiler-mods--mod-host-bridge` so
  `AnalyzerDiagnostic` carries an optional `(start, end)` byte span,
  `RewriterOutcome` carries a `Vec<RewriteEdit>` of insert/replace/delete
  operations, `run_rewriters` applies edits right-to-left to produce an
  edited source string, overlapping edits are rejected with the first
  edit winning, and `NativeContractInvoker` dlopen-loads mod artifact
  shared libraries and calls entry symbols through the C ABI with
  temporary-link fallback for relocatable `.o` files and stub fallback
  with a debug log (not a hard error) on link/dlopen failure.
- **MODIFY** `compiler--compiler-mods--analysis-query-diagnostics-facade`
  so analyzer diagnostics surfaced through the query/diagnostics facade
  preserve source spans and the host anchors a spanless diagnostic to a
  whole-file span.
- **MODIFY** `tooling--lsp--diagnostics-and-workspace-analysis` so the
  LSP server surfaces mod analyzer diagnostics as `Diagnostic` values
  with proper ranges and refreshes them on mod host generation
  invalidation.
- **MODIFY** `tooling--lsp--intellisense-capabilities-and-behavior` so
  the LSP server surfaces mod rewriter edits as `CodeAction` values with
  `TextEdit` operations, each referencing the diagnostic it fixes via the
  `diagnostics` field, and provides code actions for missing imports,
  naming-style violations, unused imports, unused private items,
  unreachable code, implicit numeric casts, and visibility violations.
- **MODIFY** `compiler--semantic-pipeline--diagnostic-code-registry` to
  allocate new diagnostic codes for mod analyzer findings inside the
  existing **E1801–E1899** band and require every `SemanticIssueKind`
  variant to return a non-empty actionable `help()` string.
- **MODIFY** `compiler--semantic-pipeline--rules-and-diagnostics-catalog`
  to add a missing-import analyzer that emits a spanned diagnostic with
  an auto-add `use` statement fix.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `compiler--compiler-mods--mod-host-bridge`: Spanned analyzer
  diagnostics, rewriter edit application, and native dlopen dispatch.
- `compiler--compiler-mods--analysis-query-diagnostics-facade`:
  Span-preserving diagnostic transport from mod analyzers.
- `tooling--lsp--diagnostics-and-workspace-analysis`: Mod diagnostic →
  LSP `Diagnostic` bridge.
- `tooling--lsp--intellisense-capabilities-and-behavior`: Mod rewriter
  → LSP `CodeAction` bridge and the seven analyzer code actions.
- `compiler--semantic-pipeline--diagnostic-code-registry`: New mod
  analyzer diagnostic codes and non-empty `help()` for every
  `SemanticIssueKind` variant.
- `compiler--semantic-pipeline--rules-and-diagnostics-catalog`:
  Missing-import analyzer with auto-add `use` fix.

## Compatibility and migration

The ABI structs (`ModDiagnostic`, `ModEdit`, `ModAnalysisResult`,
`ModRewriteResult`) already exist and are unchanged; this change wires
the host bridge, native invoker, compiler-sdk mirror types, and LSP
surfaces to them. `AnalyzerDiagnostic` and `RewriterOutcome` gain
fields with defaults so existing stub and scripted invokers continue
to compile. `run_rewriters` changes from returning its input unchanged
to applying edits; callers that relied on the no-op behavior must
update. `NativeContractInvoker` keeps its stub fallback so a missing or
un-linkable artifact does not hard-fail the build. No public standard
URL or legacy URL changes.

## Rollback and staged deployment

This contract is staged before compiler, ABI, and LSP implementation.
If a target linker cannot produce a loadable shared library from a
relocatable mod artifact, that mod falls back to stub dispatch with a
debug log; it MUST NOT hard-fail the compilation. Reverting a later
implementation restores the prior release as a unit; it does not
reintroduce a spanless-only `AnalyzerDiagnostic`, an edit-free
`RewriterOutcome`, a no-op `run_rewriters`, or a stub-only
`NativeContractInvoker` as the production path.

## Impact

Spec-only in this change. Follow-on work covers host bridge
implementation, native dlopen dispatch, compiler-sdk mirror types,
LSP diagnostic and code-action handlers, the missing-import analyzer,
`SemanticIssueKind::help()` completion, and conformance tests.
