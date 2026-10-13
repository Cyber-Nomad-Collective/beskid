## MODIFIED Requirements

### Requirement: Spanned analyzer diagnostics
`AnalyzerDiagnostic` SHALL carry an optional `(start, end)` byte range alongside its `code`, `message`, and `severity`. When the span is present, the mod host SHALL use it to anchor the diagnostic in the entry source. When the span is absent, the mod host SHALL fall back to a whole-file span starting at byte `0` and ending at the source length. The host SHALL clamp every span to the source length before surfacing the diagnostic. The host SHALL map the optional span to the ABI `ModDiagnostic.span_start` / `span_end` fields, using `0` for both when the span is absent. A spanless diagnostic SHALL NOT be rejected, dropped, or treated as an error.

**Stable ID:** `BSP-REQ-MOD-HOST-SPAN-DIAG`

#### Scenario: Spanned diagnostic anchors to its range
- **GIVEN** an analyzer contract that emits a diagnostic with `(start = 10, end = 14)`
- **WHEN** the mod host surfaces the diagnostic
- **THEN** the diagnostic is anchored to bytes `10..14` of the entry source

#### Scenario: Spanless diagnostic falls back to whole-file
- **GIVEN** an analyzer contract that emits a diagnostic with no span
- **WHEN** the mod host surfaces the diagnostic
- **THEN** the diagnostic is anchored to a whole-file span from `0` to the source length and is not rejected

#### Scenario: Span is clamped to source length
- **GIVEN** an analyzer diagnostic whose `end` exceeds the source length
- **WHEN** the host clamps the span
- **THEN** the surfaced span ends at the source length and does not overrun the buffer

### Requirement: Rewriter edit application
`RewriterOutcome` SHALL carry a `Vec<RewriteEdit>` of insert, replace, and delete operations. Each `RewriteEdit` SHALL carry a `kind` (`Insert`, `Replace`, or `Delete`), a `start` byte offset, an `end` byte offset (exclusive), and a `text` payload (empty for `Delete`). `run_rewriters` SHALL apply all edits to produce an edited source string. Edits SHALL be applied right-to-left, highest `start` first, so earlier byte offsets remain valid as later edits are applied. Overlapping edits SHALL be rejected: the first edit in right-to-left order SHALL win and later overlapping edits SHALL be skipped. The applied edit count SHALL be recorded per contract for the mod scoreboard. `run_rewriters` SHALL NOT return its input program unchanged when at least one edit is applied.

**Stable ID:** `BSP-REQ-MOD-HOST-REWRITE-APPLY`

#### Scenario: Edits apply right-to-left preserving offsets
- **GIVEN** two non-overlapping edits at byte offsets `5` and `20`
- **WHEN** `run_rewriters` applies them
- **THEN** the edit at offset `20` is applied first, the edit at offset `5` is applied second against the original offset, and the resulting source contains both edits

#### Scenario: Overlapping edits reject the later edit
- **GIVEN** two edits where edit A covers bytes `10..20` and edit B covers bytes `15..25`
- **WHEN** `run_rewriters` applies them right-to-left
- **THEN** edit B (higher `start`) is applied first, edit A overlaps and is skipped, and the applied edit count records exactly one edit

#### Scenario: Insert edit uses equal start and end
- **GIVEN** an `Insert` edit with `start == end == 12` and text `"x"`
- **WHEN** `run_rewriters` applies it
- **THEN** the text `"x"` is inserted at byte offset `12` and no existing byte is replaced

#### Scenario: Applied edits change the program
- **GIVEN** a rewriter contract that emits at least one edit
- **WHEN** `run_rewriters` completes
- **THEN** the returned source differs from the input source and the applied edit count is non-zero

### Requirement: Native contract dispatch through dlopen
The `NativeContractInvoker` SHALL dlopen mod artifact shared libraries and call entry symbols through the C ABI typedefs (`ModCollectorEntryFn`, `ModGeneratorEntryFn`, `ModAnalyzerEntryFn`, `ModRewriterEntryFn`) for all four contract kinds. When the artifact is a relocatable `.o` file, the invoker SHALL attempt to link it into a temporary shared library using the system linker before dlopen. If linking or dlopen fails, the invoker SHALL fall back to stub dispatch with a debug log and SHALL NOT raise a hard error. The fallback SHALL be observable in logs and tests. The invoker SHALL NOT delegate to the stub as the production path when a loadable shared library is available.

**Stable ID:** `BSP-REQ-MOD-HOST-NATIVE-DLOPEN`

#### Scenario: Shared library is dlopen-loaded and called
- **GIVEN** a mod artifact emitted as a loadable shared library with a valid `entrySymbol`
- **WHEN** the `NativeContractInvoker` dispatches a contract call
- **THEN** it dlopen-loads the library, resolves the entry symbol, and calls it through the C ABI typedef without delegating to the stub

#### Scenario: Relocatable object is linked into a temporary shared library
- **GIVEN** a mod artifact emitted as a relocatable `.o` file
- **WHEN** the `NativeContractInvoker` dispatches a contract call
- **THEN** it links the `.o` file into a temporary shared library using the system linker and dlopen-loads the result

#### Scenario: Link or dlopen failure falls back to stub with a debug log
- **GIVEN** a mod artifact that cannot be linked or dlopen-loaded
- **WHEN** the `NativeContractInvoker` dispatches a contract call
- **THEN** it falls back to stub dispatch, emits a debug log naming the failure, and does not raise a hard error

## ADDED Requirements

### Requirement: ABI types for analyzer and rewriter results
The ABI SHALL define C-layout structs for analyzer results (`ModAnalysisResult`, `ModDiagnostic` with `code`, `message`, `severity`, `span_start`, and `span_end` fields) and rewriter results (`ModRewriteResult`, `ModEdit` with `kind`, `start`, `end`, and `text` fields). `ModEdit.kind` SHALL encode `0 = Insert`, `1 = Replace`, `2 = Delete`. Entry function signatures SHALL be defined for all four contract kinds: `ModCollectorEntryFn`, `ModGeneratorEntryFn`, `ModAnalyzerEntryFn`, and `ModRewriterEntryFn`. The host SHALL marshal host-side `AnalyzerDiagnostic` and `RewriteEdit` values to and from these structs without a second translation layer.

**Stable ID:** `BSP-REQ-MOD-HOST-ABI-TYPES`

#### Scenario: Analyzer result marshals through the ABI struct
- **GIVEN** a native analyzer that returns a `ModAnalysisResult` with one `ModDiagnostic` carrying a span
- **WHEN** the host bridge reads the result
- **THEN** it produces an `AnalyzerDiagnostic` with the same `code`, `message`, `severity`, and span

#### Scenario: Rewriter result marshals through the ABI struct
- **GIVEN** a native rewriter that returns a `ModRewriteResult` with one `ModEdit` of kind `Replace`
- **WHEN** the host bridge reads the result
- **THEN** it produces a `RewriteEdit` with `kind = Replace` and the same `start`, `end`, and `text`

### Requirement: Compiler-sdk mirror types for diagnostics and edits
The compiler-sdk SHALL define Beskid-side types for spanned diagnostics and text edits that mirror the ABI `ModDiagnostic` and `ModEdit` structs. Analyzer contract implementations SHALL emit diagnostics with spans. Rewriter contract implementations SHALL emit text edits. The mirror types SHALL lower to the ABI structs without a hand-written translation step in the contract body.

**Stable ID:** `BSP-REQ-MOD-HOST-SDK-MIRROR`

#### Scenario: Analyzer emits a spanned diagnostic through the mirror type
- **GIVEN** a compiler-sdk analyzer contract implementation
- **WHEN** it emits a diagnostic
- **THEN** the diagnostic carries a span and lowers to the ABI `ModDiagnostic` without a hand-written translation step

#### Scenario: Rewriter emits a text edit through the mirror type
- **GIVEN** a compiler-sdk rewriter contract implementation
- **WHEN** it emits an edit
- **THEN** the edit carries `kind`, `start`, `end`, and `text` and lowers to the ABI `ModEdit` without a hand-written translation step
