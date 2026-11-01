## MODIFIED Requirements

### Requirement: Line-oriented REPL interaction
`beskid dev repl` SHALL read and write complete lines on both terminals and redirected streams. It MUST NOT enter an alternate screen or require a keypress to exit after `:quit` or end-of-input.

#### Scenario: Redirected snippets terminate
- **GIVEN** snippets on standard input followed by end-of-input
- **WHEN** the user runs `beskid dev repl`
- **THEN** results are emitted as ordinary lines and the command exits without terminal-control sequences

### Requirement: Snippet evaluation without project graph
`beskid dev repl` SHALL evaluate single expression or statement snippets through the same analysis front-end as other CLI commands, but MUST NOT wire `resolve_input` or the project graph. Project manifests, multi-file modules, and workspace graphs are out of scope for v1.

#### Scenario: Snippet type-check without project graph
- **GIVEN** a running `beskid dev repl` session
- **WHEN** the user submits a single-expression snippet
- **THEN** the snippet is parsed and type-checked through the shared analysis front-end without resolving a project input graph

