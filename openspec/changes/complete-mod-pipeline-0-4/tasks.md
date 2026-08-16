## 1. Validate and establish RED evidence

- [x] 1.1 Create the proposal, design, tasks, and complete capability
  deltas.
- [ ] 1.2 Validate this change strictly and validate the repository
  OpenSpec standard without running compiler or Cargo commands.
- [ ] 1.3 Add failing tests proving `AnalyzerDiagnostic` has no span
  field and `RewriterOutcome` has no edits field.
- [ ] 1.4 Add failing tests proving `run_rewriters` returns its input
  `Program` unchanged and records no applied edits.
- [ ] 1.5 Add failing tests proving the LSP surfaces no mod analyzer
  diagnostics and no mod rewriter code actions.
- [ ] 1.6 Add failing tests proving `NativeContractInvoker` delegates
  every call to `StubContractInvoker` and never dlopen-loads an
  artifact.
- [ ] 1.7 Add failing tests proving at least one `SemanticIssueKind`
  variant returns `None` or an empty string from `help()`.

## 2. Introduce spanned diagnostics and rewriter edits

- [ ] 2.1 Add an optional `(start, end)` byte span to
  `AnalyzerDiagnostic`; map it to the ABI `ModDiagnostic.span_start` /
  `span_end` fields with `0`/`0` for the spanless case.
- [ ] 2.2 Add a `Vec<RewriteEdit>` of insert/replace/delete operations
  to `RewriterOutcome`; map it to the ABI `ModEdit` / `ModEditSlice` /
  `ModRewriteResult` fields.
- [ ] 2.3 Implement whole-file span fallback in the host bridge when
  an analyzer diagnostic carries no span; clamp spans to the source
  length.
- [ ] 2.4 Implement right-to-left edit application in `run_rewriters`
  with first-edit-wins overlap rejection; produce an edited source
  string and record the applied edit count.

## 3. Introduce native dispatch

- [ ] 3.1 Implement `NativeContractInvoker` dlopen dispatch of mod
  artifact shared libraries through the C ABI entry typedefs for all
  four contract kinds.
- [ ] 3.2 Implement the temporary-link path that links a relocatable
  `.o` file into a temporary shared library using the system linker
  before dlopen.
- [ ] 3.3 Implement the stub fallback with a debug log (not a hard
  error) when linking or dlopen fails; keep the fallback observable in
  tests.

## 4. Introduce compiler-sdk mirror types

- [ ] 4.1 Add Beskid-side mirror types for spanned diagnostics and text
  edits that match the ABI `ModDiagnostic` and `ModEdit` structs.
- [ ] 4.2 Update analyzer contract implementations to emit diagnostics
  with spans.
- [ ] 4.3 Update rewriter contract implementations to emit text edits.

## 5. Introduce the LSP mod bridge

- [ ] 5.1 Surface mod analyzer diagnostics as LSP `Diagnostic` values
  with ranges derived from the span or whole-file fallback.
- [ ] 5.2 Refresh mod diagnostics on mod host generation invalidation
  per the snapshot-and-refresh contract.
- [ ] 5.3 Surface mod rewriter edits as LSP `CodeAction` values whose
  `edit` field carries `TextEdit` operations and whose `diagnostics`
  field references the diagnostic the action fixes.

## 6. Introduce analyzer code actions and the missing-import analyzer

- [ ] 6.1 Add the missing-import analyzer as a semantic-pipeline rule
  that emits a spanned diagnostic with an auto-add `use` statement fix.
- [ ] 6.2 Add code actions for naming-style violations (rename to
  canonical form), unused imports (remove), unused private items
  (remove), unreachable code (remove), implicit numeric casts (add
  explicit cast), and visibility violations (mark item `pub`).
- [ ] 6.3 Link each code action to its diagnostic via the `diagnostics`
  field.

## 7. Complete `help()` and allocate diagnostic codes

- [ ] 7.1 Complete `SemanticIssueKind::help()` for every variant with
  a non-empty actionable string; add a test that no variant returns
  `None` or an empty string.
- [ ] 7.2 Allocate the new mod analyzer diagnostic codes inside the
  **E1801–E1899** band in order and extend the registry table in the
  same change.

## 8. Verify

- [ ] 8.1 Make all focused RED suites green through the production
  mod host, native invoker, compiler-sdk, and LSP paths.
- [ ] 8.2 Run the mod host integration tests
  (`compiler/crates/beskid_engine/tests/mod_host.rs`,
  `compiler/crates/beskid_tests/src/mods/`) and assert spanned
  diagnostics, applied edits, and native dispatch.
- [ ] 8.3 Run the LSP diagnostic and code-action tests and assert mod
  diagnostics and code actions surface with correct ranges and
  `diagnostics` linkage.
- [ ] 8.4 Run full OpenSpec, compiler workspace, and release gates;
  update catalog/changelog/traceability evidence and run GitNexus
  changed-scope analysis before integration.
