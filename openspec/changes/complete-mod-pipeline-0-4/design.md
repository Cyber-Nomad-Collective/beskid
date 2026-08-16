## Context

The mod host dispatches `Collector`, `Generator`, `Analyzer`, and
`Rewriter` contracts through `ContractInvoker` per scheduled
`(contractId, typeId, entrySymbol)` tuple. Four features are stubbed
end-to-end today:

1. `AnalyzerDiagnostic` in
   `compiler/crates/beskid_analysis/src/mod_host/invoker.rs` carries
   only `(code, message, severity)`. There is no source span, so LSP
   cannot anchor a code action to the diagnostic.
2. `RewriterOutcome` carries only `type_id` and `applied_fix_count`.
   `run_rewriters` in
   `compiler/crates/beskid_analysis/src/mod_host/rewrite.rs` returns
   its input `Spanned<Program>` unchanged; rewriter contracts have no
   observable effect.
3. There is no mod → LSP bridge. Mod analyzer diagnostics and rewriter
   edits are not surfaced as LSP `Diagnostic` or `CodeAction` values.
4. `NativeContractInvoker` in
   `compiler/crates/beskid_analysis/src/mod_host/native.rs` records
   object paths and delegates every call to `StubContractInvoker`. Mod
   AOT artifacts emit relocatable `.o` files, not dlopen-ready shared
   libraries, so no mod contract executes through the C ABI.

The ABI layer in
`compiler/crates/beskid_abi/src/mod_contract.rs` already declares the
C-layout structs and entry typedefs the host needs:

- `ModDiagnostic { code, message, severity, span_start, span_end }`
- `ModDiagnosticSlice`, `ModAnalysisResult { diagnostics }`
- `ModEdit { kind, start, end, text }` with `kind` 0 = Insert,
  1 = Replace, 2 = Delete
- `ModEditSlice`, `ModRewriteResult { edits }`
- `ModCollectorEntryFn`, `ModGeneratorEntryFn`, `ModAnalyzerEntryFn`,
  `ModRewriterEntryFn`

These structs are unused by the host bridge, native invoker, and LSP
surfaces. This change wires them together so the mod pipeline is
observable, native, and editor-integrated.

Normative behavior remains owned by OpenSpec. The ABI owns C-layout
structs and entry signatures. The host bridge owns span/edit
marshaling and edit application. The native invoker owns dlopen
dispatch and temporary-link fallback. The compiler-sdk owns Beskid-side
mirror types. The LSP owns diagnostic and code-action shaping. No
generated artifact or host implementation becomes a second authority.

## Goals / Non-Goals

**Goals:**

- Make mod analyzer diagnostics carry source spans and anchor spanless
  diagnostics to a whole-file span.
- Make rewriter contracts produce observable text edits and make
  `run_rewriters` apply them deterministically.
- Bridge mod analyzer diagnostics and rewriter edits to LSP `Diagnostic`
  and `CodeAction` values with proper ranges and `diagnostics` linkage.
- Make `NativeContractInvoker` dlopen mod artifact shared libraries and
  call entry symbols through the C ABI, with a temporary-link path for
  relocatable `.o` files and a stub fallback with a debug log on failure.
- Define compiler-sdk Beskid-side mirror types for spanned diagnostics
  and text edits that match the ABI structs.
- Complete the seven analyzer code actions and the missing-import
  analyzer.
- Require every `SemanticIssueKind` variant to return a non-empty
  actionable `help()` string.

**Non-Goals:**

- A JIT mod execution path, mod sandboxing beyond existing capability
  policy, cross-workspace rewriter edits, or code actions beyond the
  seven listed.
- Replacing the existing `StubContractInvoker` or
  `ScriptedContractInvoker` test surfaces; they remain for bring-up and
  tests.
- Changing the ABI struct layouts or entry typedefs; they already exist
  and are reused.
- Allocating diagnostic codes outside the existing **E1801–E1899** band.

## Decisions

### Carry spans on `AnalyzerDiagnostic` and fall back to whole-file

`AnalyzerDiagnostic` gains an optional `(start, end)` byte range. When
present, the host uses it to anchor the diagnostic in the source. When
absent, the host falls back to a whole-file span (start `0`, end source
length). This keeps spanless analyzers (and the stub/scripted invokers)
working while letting real analyzers anchor code actions. The ABI
`ModDiagnostic` already carries `span_start` / `span_end`; the host
maps the optional host-side span to the ABI fields, using `0`/`0` for
the spanless case and clamping to the source length on the host side.

Alternative considered: require spans on every analyzer. Rejected
because it breaks the stub/scripted invokers and forces every analyzer
author to compute a span before emitting anything.

### Carry edits on `RewriterOutcome` and apply right-to-left

`RewriterOutcome` gains a `Vec<RewriteEdit>` of insert/replace/delete
operations. `RewriteEdit` carries `kind`, `start`, `end`, and `text`.
`run_rewriters` applies all edits to produce an edited source string.
Edits are applied right-to-left (highest `start` first) so earlier
byte offsets remain valid as later edits are applied. Overlapping
edits are rejected: the first edit (in right-to-left order) wins and
later overlapping edits are skipped. The applied edit count is still
recorded for the per-mod scoreboard.

Alternative considered: apply edits left-to-right with offset
adjustment. Rejected because right-to-left is the standard
offset-preserving order and avoids a running offset adjustment that
is easy to get wrong. Alternative considered: reject the whole edit
batch on any overlap. Rejected because partial application with a
deterministic first-edit-wins rule is more useful for editor flows and
matches LSP `TextEdit` semantics.

### Bridge mod diagnostics and edits to LSP

The LSP server surfaces mod analyzer diagnostics as `Diagnostic` values
with ranges derived from the span (or whole-file fallback). It surfaces
mod rewriter edits as `CodeAction` values whose `edit` field carries
`TextEdit` operations and whose `diagnostics` field references the
diagnostic the action fixes. This links the action to the diagnostic so
editors offer it as a quick fix. Diagnostics refresh on mod host
generation invalidation per the existing snapshot-and-refresh contract.

### dlopen shared libraries with temporary-link fallback for `.o`

`NativeContractInvoker` dlopen-loads mod artifact shared libraries and
calls entry symbols through the C ABI typedefs. When the artifact is a
relocatable `.o` file, the invoker attempts to link it into a temporary
shared library using the system linker (`cc` / `ld`) before dlopen. If
linking or dlopen fails, the invoker falls back to stub dispatch with a
debug log (not a hard error) so a missing or un-linkable mod does not
break the build. The fallback is observable in logs and tests; it is
not a second production dispatch path.

Alternative considered: hard-fail on link/dlopen failure. Rejected
because mod artifacts are not always available in every build
environment and a hard failure would block host compilation. The
fallback preserves the existing bring-up behavior while real native
dispatch lands.

### Mirror ABI structs in the compiler-sdk

The compiler-sdk defines Beskid-side types for spanned diagnostics and
text edits that mirror the ABI structs: a `ModDiagnostic`-shaped record
with `code`, `message`, `severity`, and optional span, and a
`ModEdit`-shaped record with `kind`, `start`, `end`, and `text`.
Analyzer contract implementations emit diagnostics with spans;
rewriter contract implementations emit text edits. This gives mod
authors one Beskid-side shape that lowers to the ABI without a second
translation layer.

### Complete the seven analyzer code actions and the missing-import analyzer

The LSP provides code actions for: missing imports (auto-add `use`
statement), naming-style violations (rename to canonical form), unused
imports (remove), unused private items (remove), unreachable code
(remove), implicit numeric casts (add explicit cast), and visibility
violations (mark item `pub`). The missing-import analyzer is a
semantic-pipeline rule that emits a spanned diagnostic with an auto-add
`use` fix; it is the first analyzer-backed code action and the
reference for the rest.

### Non-empty `help()` for every `SemanticIssueKind` variant

Every `SemanticIssueKind` variant returns a non-empty `help()` string
with actionable guidance. No variant returns `None`. This makes every
diagnostic fixable in principle and gives the LSP code-action bridge a
stable help payload to surface.

## Risks / Trade-offs

- [Spanless analyzers break] -> The span is optional with a whole-file
  fallback; stub/scripted invokers keep working.
- [Right-to-left edit application surprises authors] -> Document the
  order in the compiler-sdk mirror types and the host bridge; the
  first-edit-wins overlap rule is deterministic and testable.
- [dlopen fallback hides missing mods] -> The fallback emits a debug
  log and is observable in tests; it is not a silent success. A real
  native dispatch path is the production target.
- [Temporary link fails on targets without `cc`] -> The fallback keeps
  the build working; the mod is stub-dispatched and the log names the
  failure. Targets that need real native dispatch must provide a
  linker.
- [Code actions overlap with existing quick fixes] -> The seven actions
  are scoped to mod analyzer diagnostics via the `diagnostics` field;
  existing quick fixes (unused import `W1503`, doc actions) remain
  unchanged.
- [New diagnostic codes collide] -> Codes are allocated inside the
  existing **E1801–E1899** band in order; the registry table is extended
  in the same change.

## Migration Plan

1. Validate this change strictly and validate the repository OpenSpec
   standard without running compiler or Cargo commands.
2. Add focused RED tests proving `AnalyzerDiagnostic` has no span,
   `RewriterOutcome` has no edits, `run_rewriters` is a no-op, the LSP
   surfaces no mod diagnostics or code actions, and
   `NativeContractInvoker` delegates to the stub.
3. Add the optional span to `AnalyzerDiagnostic`, the `Vec<RewriteEdit>`
   to `RewriterOutcome`, right-to-left edit application with
   first-edit-wins overlap rejection to `run_rewriters`, and the
   whole-file span fallback.
4. Implement `NativeContractInvoker` dlopen dispatch with the
   temporary-link path for `.o` files and the stub fallback with a debug
   log.
5. Add the compiler-sdk Beskid-side mirror types for spanned
   diagnostics and text edits; update analyzer and rewriter contract
   implementations to emit them.
6. Add the LSP mod diagnostic bridge (range mapping, refresh on mod
   host invalidation) and the mod rewriter code-action bridge with
   `diagnostics` linkage.
7. Add the seven analyzer code actions and the missing-import analyzer
   with its auto-add `use` fix.
8. Complete `SemanticIssueKind::help()` for every variant; add a test
   that no variant returns `None` or an empty string.
9. Allocate the new mod analyzer diagnostic codes inside
   **E1801–E1899** and extend the registry table.
10. Run focused verification, the mod host integration tests, and the
    LSP diagnostic/code-action tests; update catalog/changelog/
    traceability evidence and run GitNexus changed-scope analysis
    before integration.

Rollback before deletion reverts the complete host bridge, native
invoker, compiler-sdk, and LSP wave. After deletion, rollback selects
the last complete release bundle. It never reinstates a spanless-only
`AnalyzerDiagnostic`, an edit-free `RewriterOutcome`, a no-op
`run_rewriters`, or a stub-only `NativeContractInvoker` as the
production path.

## Open Questions

None. The span shape, edit kind enum, edit application order, overlap
rule, dlopen fallback policy, code-action set, and diagnostic code
band are fixed by this change. Target linker selection remains
implementation detail constrained by the temporary-link fallback
contract.
