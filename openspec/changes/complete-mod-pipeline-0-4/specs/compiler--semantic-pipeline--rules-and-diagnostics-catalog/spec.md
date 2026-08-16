## ADDED Requirements

### Requirement: Missing-import analyzer with auto-add use fix
The semantic pipeline SHALL include a missing-import analyzer that emits a spanned diagnostic when a referenced symbol cannot be resolved because its containing module is not imported. The diagnostic SHALL carry a span anchored to the unresolved reference. The diagnostic SHALL carry a registered code inside the **E1801–E1899** band. The analyzer SHALL produce an auto-add `use` statement fix that imports the symbol's containing module. The fix SHALL be surfaced as a mod rewriter edit and as an LSP `CodeAction` linked to the diagnostic via the `diagnostics` field.

**Stable ID:** `BSP-REQ-MISSING-IMPORT-ANALYZER`

#### Scenario: Unresolved reference emits a spanned missing-import diagnostic
- **GIVEN** a `.bd` source that references `Std.System.IO.Print` without a `use Std.System.IO.Print` statement
- **WHEN** the missing-import analyzer runs
- **THEN** it emits a diagnostic anchored to the unresolved reference with a registered code inside **E1801–E1899**

#### Scenario: Missing-import fix auto-adds a use statement
- **GIVEN** a missing-import diagnostic for `Std.System.IO.Print`
- **WHEN** the rewriter fix is applied
- **THEN** a `use Std.System.IO.Print;` statement is inserted and the reference resolves

#### Scenario: Missing-import code action links to its diagnostic
- **GIVEN** a missing-import diagnostic in a `.bd` buffer
- **WHEN** code actions are requested at that diagnostic range
- **THEN** a `CodeAction` is returned that inserts the `use` statement and references the missing-import diagnostic via the `diagnostics` field
