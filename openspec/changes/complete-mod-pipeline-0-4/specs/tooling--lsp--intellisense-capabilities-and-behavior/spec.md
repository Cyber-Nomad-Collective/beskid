## MODIFIED Requirements

### Requirement: Mod rewriter code-action bridge to LSP
The LSP server SHALL surface mod rewriter edits as LSP `CodeAction` values. Each code action SHALL carry `TextEdit` operations in its `edit` field derived from the rewriter's `RewriteEdit` set. Each code action SHALL reference the diagnostic it fixes via the `diagnostics` field so editors offer it as a quick fix for that diagnostic. The `TextEdit` range SHALL be derived from the `RewriteEdit` `start` and `end` byte offsets. Insert edits SHALL produce a zero-length range at `start`; replace edits SHALL produce the `start..end` range; delete edits SHALL produce the `start..end` range with an empty new text.

**Stable ID:** `BSP-REQ-LSP-MOD-CODEACTION-BRIDGE`

#### Scenario: Rewriter edit surfaces as a code action
- **GIVEN** a mod rewriter that emits a `Replace` edit for a diagnostic
- **WHEN** code actions are requested at that diagnostic range
- **THEN** a `CodeAction` is returned whose `edit` carries a `TextEdit` over the edit range and whose `diagnostics` field references the diagnostic

#### Scenario: Insert edit produces a zero-length range
- **GIVEN** a mod rewriter `Insert` edit at byte offset `12`
- **WHEN** the code action is built
- **THEN** the `TextEdit` range is zero-length at offset `12` and the new text is the edit payload

#### Scenario: Delete edit produces an empty-text replacement
- **GIVEN** a mod rewriter `Delete` edit over bytes `10..20`
- **WHEN** the code action is built
- **THEN** the `TextEdit` range covers `10..20` and the new text is empty

### Requirement: Analyzer-backed code actions
The LSP server SHALL provide code actions for the following mod analyzer findings, each linked to its diagnostic via the `diagnostics` field:

1. Missing imports — auto-add a `use` statement for the unresolved symbol.
2. Naming-style violations — rename the identifier to the canonical form.
3. Unused imports — remove the unused `use` statement.
4. Unused private items — remove the unused private item.
5. Unreachable code — remove the unreachable code.
6. Implicit numeric casts — add an explicit cast.
7. Visibility violations — mark the item `pub`.

Each code action SHALL produce `TextEdit` operations that apply the fix. Each code action SHALL reference exactly the diagnostic it fixes. The LSP SHALL NOT advertise these code actions as implemented until both the request handler and the capability advertisement land in the same change.

**Stable ID:** `BSP-REQ-LSP-ANALYZER-CODEACTIONS`

#### Scenario: Missing import offers an auto-add use statement
- **GIVEN** a `.bd` buffer with a missing-import diagnostic for symbol `Std.System.IO.Print`
- **WHEN** code actions are requested at that diagnostic range
- **THEN** a `CodeAction` is returned that inserts a `use Std.System.IO.Print;` statement and references the missing-import diagnostic

#### Scenario: Naming-style violation offers a rename
- **GIVEN** a `.bd` buffer with a naming-style diagnostic for an identifier
- **WHEN** code actions are requested at that diagnostic range
- **THEN** a `CodeAction` is returned that renames the identifier to the canonical form and references the diagnostic

#### Scenario: Unused import offers a remove
- **GIVEN** a `.bd` buffer with an unused-import diagnostic
- **WHEN** code actions are requested at that diagnostic range
- **THEN** a `CodeAction` is returned that removes the `use` statement and references the diagnostic

#### Scenario: Visibility violation offers a pub mark
- **GIVEN** a `.bd` buffer with a visibility-violation diagnostic for an item
- **WHEN** code actions are requested at that diagnostic range
- **THEN** a `CodeAction` is returned that marks the item `pub` and references the diagnostic
