## ADDED Requirements

### Requirement: LSP beskid.getGraph contract
The LSP `beskid.getGraph` request SHALL accept `[{ projectUri: string, kind: string, entryUri?: string, workspaceUri?: string }]` and return a payload with `kind`, `mermaid`, `revision`, `warnings`, and `metadata` (including lightweight `nodes`). The server MUST route graph generation through `beskid_queries::graph_mermaid` on `compilation_db`. `metadata.nodes` MUST remain lightweight navigation data only — not a parallel graph model. `hostComposition` MAY return empty mermaid with warning `no_host` when the entry has no launched host. Project dependency cycles MUST still fail at graph build; import cycles MAY render with warning styling.

#### Scenario: Graph routes through compilation_db
- **GIVEN** an open project with a resolved compilation database
- **WHEN** a client invokes `beskid.getGraph` with `kind=projectDeps`
- **THEN** the server builds the graph via `beskid_queries::graph_mermaid` and returns mermaid text plus `metadata.nodes` for navigation

### Requirement: Deprecated getProjectGraph removed
`beskid.getProjectGraph` was removed. All clients MUST use `beskid.getGraph` with `kind=projectDeps` and read `metadata.nodes` for tree navigation.

#### Scenario: Clients use getGraph for project deps
- **GIVEN** an editor integration that needs the project dependency graph
- **WHEN** it requests graph data from the LSP
- **THEN** it calls `beskid.getGraph` with `kind=projectDeps` and does not call `beskid.getProjectGraph`

### Requirement: CLI beskid graph surface
`beskid graph` SHALL support `--kind project|workspace|module|imports|host`, `--project PATH`, `--entry PATH`, `--mermaid`, `--plain`, and `--out FILE`. On a TTY the default SHALL render via `graphs-tui`; `--mermaid` SHALL emit raw Mermaid to stdout; non-TTY sessions SHALL auto-select `--mermaid` unless `--tui` is forced.

#### Scenario: Non-TTY emits Mermaid
- **GIVEN** stdout is not a TTY
- **WHEN** the user runs `beskid graph --kind project`
- **THEN** raw Mermaid is emitted without requiring an explicit `--mermaid` flag

### Requirement: VS Code Graph Explorer panel
The Projects tree MUST remain for Targets / Dependencies / Source folders navigation. The Graph Explorer panel MUST fetch `beskid.getGraph` and render bundled Mermaid locally (no CDN). Refresh MUST follow `onRefreshWorkspaceUi` and display a `revision` badge.

#### Scenario: Graph Explorer uses local Mermaid
- **GIVEN** the VS Code Graph Explorer panel is open for a Beskid project
- **WHEN** the panel refreshes after `onRefreshWorkspaceUi`
- **THEN** it fetches `beskid.getGraph`, renders Mermaid from the bundled renderer, and shows the response `revision` badge

## REMOVED Requirements

### Requirement: Contracts and edge cases conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
