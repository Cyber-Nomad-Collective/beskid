## ADDED Requirements

### Requirement: One diagnostic structure, two renderers
The compiler SHALL produce one diagnostic structure for the CLI, the language server and `--error-format=json`. The structure SHALL contain a code, a severity, a message, a primary span, labelled related locations, notes, fixes with applicability, and tags. The CLI renderer MAY draw source snippets. The language server renderer SHALL follow the editor diagnostic shape and SHALL NOT use CLI drawing.

#### Scenario: Same cause in CLI and editor
- **GIVEN** one source error
- **WHEN** the CLI and the language server report it
- **THEN** both report the same code, severity and primary span

### Requirement: Authored spans and deduplication
The compiler SHALL map every span in a materialized source to the authored source before it reports the diagnostic. Project preparation SHALL NOT report an error that a file-level diagnostic with the same code, file and span already covers. Two diagnostics with equal code, file and span SHALL be reported once.

#### Scenario: Duplicate from project preparation
- **GIVEN** an error that file analysis and project preparation both find
- **WHEN** diagnostics are collected
- **THEN** one diagnostic is reported

#### Scenario: Materialized span
- **GIVEN** an error in a generated source that comes from an authored source
- **WHEN** the diagnostic is reported
- **THEN** the span points into the authored source
