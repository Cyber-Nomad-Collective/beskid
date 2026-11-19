## MODIFIED Requirements

### Requirement: Hi shell removed in 0.5.1
The CLI SHALL NOT register or launch `beskid hi` or its dashboard, palette, board editor, or shell widgets. This removal SHALL NOT remove the separate `beskid dev project graph` terminal visualization.

#### Scenario: No Hi shell entrypoint
- **GIVEN** an installed Beskid 0.5.1 CLI
- **WHEN** a user lists commands or invokes `beskid hi`
- **THEN** no Hi command is offered, and invocation fails as an unknown subcommand without entering alternate-screen mode

#### Scenario: Graph remains interactive
- **GIVEN** a graph input and an interactive terminal
- **WHEN** the user invokes `beskid dev project graph --tui`
- **THEN** the graph visualization remains available

