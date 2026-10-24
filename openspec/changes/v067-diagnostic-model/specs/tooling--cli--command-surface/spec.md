## ADDED Requirements

### Requirement: Machine-readable diagnostics
Commands that report diagnostics SHALL accept `--error-format=json`. With this option, a command SHALL write each diagnostic as one JSON object on one line (JSON Lines) to standard output and SHALL NOT write human diagnostic text to standard output. Each object SHALL contain the fields `code`, `severity` (`error`, `warning`, `info` or `hint`), `message`, `file`, `span` (`start` and `end`, each with `line` and `column`, both 1-based), `labels` (list of `span` and `text`), `notes` (list of text), `fixes` (list of `title`, `applicability`, `preferred` and `edits`) and `tags` (list of `unnecessary` or `deprecated`). Later releases of the 0.6 line SHALL only add fields.

#### Scenario: JSON output
- **GIVEN** a file with one error
- **WHEN** the user runs `beskid analyze --error-format=json`
- **THEN** standard output has one line with a JSON object that has the listed fields

#### Scenario: Default format
- **GIVEN** the same file
- **WHEN** the user runs `beskid analyze` without the option
- **THEN** the output is the human format
