## MODIFIED Requirements

### Requirement: Mod analyzer diagnostic codes in the E1801–E1899 band
New diagnostic codes emitted by mod analyzer contracts SHALL be allocated inside the existing **E1801–E1899** mod, manifest, and mod-host band. Codes SHALL be allocated in order within the reserved sub-ranges and SHALL be registered in `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs` in the same change that introduces them. The registry table SHALL be extended with the new codes and their emission conditions. No mod analyzer diagnostic SHALL use an ad-hoc string code outside `SemanticIssueKind`.

**Stable ID:** `BSP-REQ-MOD-DIAG-CODE-BAND`

#### Scenario: New mod analyzer code is allocated in band
- **GIVEN** a new mod analyzer finding that needs a diagnostic code
- **WHEN** the code is allocated
- **THEN** it is assigned the next free code inside **E1801–E1899** and registered in `diagnostic_kinds.rs` in the same change

#### Scenario: Mod analyzer codes are not ad-hoc strings
- **GIVEN** a mod analyzer diagnostic surfaced to CLI or LSP
- **WHEN** its code identity is inspected
- **THEN** the code is a registered `SemanticIssueKind` code inside **E1801–E1899**, not an ad-hoc string

## ADDED Requirements

### Requirement: Non-empty actionable help for every SemanticIssueKind variant
Every `SemanticIssueKind` variant SHALL return a non-empty `help()` string with actionable guidance. No variant SHALL return `None` or an empty string from `help()`. The `help()` text SHALL describe a concrete action a user or code action can take to address the diagnostic. A test SHALL assert that no `SemanticIssueKind` variant returns `None` or an empty string.

**Stable ID:** `BSP-REQ-SEMANTIC-HELP-NONEMPTY`

#### Scenario: Every variant returns actionable help
- **GIVEN** the full set of `SemanticIssueKind` variants
- **WHEN** `help()` is called on each variant
- **THEN** every variant returns a non-empty string and none returns `None`

#### Scenario: Help text is actionable
- **GIVEN** a `SemanticIssueKind` variant for an unused import
- **WHEN** `help()` is called
- **THEN** the returned string describes removing the unused import (or the concrete fix the corresponding code action applies)
