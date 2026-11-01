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

### Requirement: Mod activation errors keep their code and authored file
Before the compiler prepares a project, it assembles the project to find the active Mods. When that assembly finds an error that has a structured diagnostic (for example a parse error such as **E0117**), `beskid check` SHALL report that diagnostic with its code, at the authored file and span, in the same form as any other diagnostic. This SHALL apply to a single-target check, to a check of all targets of a project, and to `beskid check --all-members`. The report SHALL NOT name the materialized copy under `obj/beskid`, and SHALL NOT replace the diagnostic with a failure line that has no code. The command SHALL then fail for that member and SHALL continue with the other members.

#### Scenario: Detached documentation header in a workspace member
- **GIVEN** a workspace member whose `Src/Main.bd` starts with a `///` line, then a blank line, then `use Core.Output;`
- **WHEN** `beskid check --project <workspace>.bws --all-members` runs
- **THEN** the output reports **E0117** at `Src/Main.bd` of that member, names no file under `obj/beskid`, and the summary counts one failed member

#### Scenario: Same report for one project
- **GIVEN** the same member
- **WHEN** `beskid check --project <member>` runs
- **THEN** the output reports **E0117** at the same file and span as in the workspace check
