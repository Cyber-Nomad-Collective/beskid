## ADDED Requirements

### Requirement: Machine-readable diagnostics
The commands `check`, `build`, `run`, `test`, `fmt` and `dev build` SHALL accept `--error-format=json`. With this option, a command SHALL write each compiler diagnostic to standard error as one JSON object on one line (JSON Lines) instead of the drawn report, and SHALL NOT change other output, such as progress, summaries and `--json` result records on standard output. Each object SHALL contain `$message_type` (always `"diagnostic"`), `schema` (the schema version, `1`), `message`, `code` (null or an object with `code`, `explanation` and `url`), `level` (`error`, `warning` or `note`), `origin`, `spans`, `children`, `tags` (`unnecessary` or `deprecated`) and `rendered`. The first element of `spans` SHALL be the primary span. Each span SHALL contain `file_name`, `byte_start`, `byte_end`, `line_start`, `line_end`, `column_start`, `column_end` (1-based, in Unicode scalar values), `is_primary`, `label`, `suggested_replacement` and `suggestion_applicability` (`MachineApplicable`, `MaybeIncorrect` or `HasPlaceholders`). Each child with level `help` SHALL be either a help sentence without spans or a fix whose spans are its edits. Consumers SHALL accept unknown fields. The `schema` value SHALL change only when a field changes meaning or is removed. The field list is normative in `docs/diagnostics-json.md` of the compiler repository.

#### Scenario: JSON output
- **GIVEN** a file with one error
- **WHEN** the user runs `beskid check --error-format=json`
- **THEN** standard error has one line with a JSON object that has the listed fields and `"schema":1`

#### Scenario: Fix applicability
- **GIVEN** a diagnostic with a fix that inserts `;`
- **WHEN** the user runs the command with `--error-format=json`
- **THEN** the fix is a child of level `help` whose edit span has `suggestion_applicability` `MachineApplicable`

#### Scenario: Default format
- **GIVEN** the same file
- **WHEN** the user runs `beskid check` without the option
- **THEN** the output is the drawn report
