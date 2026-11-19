## MODIFIED Requirements

### Requirement: CLI beskid graph surface
`beskid dev project graph` SHALL support `--kind project|workspace|module|imports|host`, `--project PATH`, `--entry PATH`, `--mermaid`, `--plain`, and `--out FILE`. On a TTY the default SHALL render readable line-oriented graph output; only explicit `--tui` SHALL render via `graphs-tui`; `--mermaid` SHALL emit raw Mermaid to stdout; non-TTY sessions SHALL auto-select `--mermaid` unless `--tui` is forced.

#### Scenario: Non-TTY emits Mermaid
- **GIVEN** stdout is not a TTY
- **WHEN** the user runs `beskid dev project graph --kind project`
- **THEN** raw Mermaid is emitted without requiring an explicit `--mermaid` flag

