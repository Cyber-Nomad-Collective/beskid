<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Contracts and edge cases Specification

## Purpose

LSP beskid.getGraph payload, CLI flags, and graph edge-case policy.

## Requirements

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

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/graph-visualization/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/tooling/graph-visualization/contracts-and-edge-cases/content.md`  
**SHA-256:** `e35ba961c4f39fabb32bcee24a5cd981691c6cdc9fa185e7b0f395393cc4cc6a`

<details>
<summary>Migrated source text</summary>

``````markdown
## LSP `beskid.getGraph`

**Arguments:** `[{ projectUri: string, kind: string, entryUri?: string, workspaceUri?: string }]`

**Returns:**

```json
{
  "kind": "projectDeps",
  "mermaid": "flowchart LR\n...",
  "revision": "a1b2c3...",
  "warnings": [{ "code": "cycle", "message": "..." }],
  "metadata": {
    "nodes": [{ "id": "n0", "label": "demo", "kind": "root", "uri": "file://..." }],
    "focusedProjectUri": "file://..."
  }
}
```

| Rule | Policy |
| --- | --- |
| G-01 | LSP **must** route through `beskid_queries::graph_mermaid` on `compilation_db` |
| G-02 | `metadata.nodes` is lightweight navigation data only — not a parallel graph model |
| G-03 | `hostComposition` **may** return empty mermaid with warning `no_host` when entry has no launched host |
| G-04 | Project dependency cycles **must** still fail at graph build; import cycles **may** render with warning styling |

## Deprecated command

`beskid.getProjectGraph` was removed. All clients **must** use `beskid.getGraph` with `kind=projectDeps` and read `metadata.nodes` for tree navigation.

## CLI `beskid graph`

```
beskid graph [--kind project|workspace|module|imports|host] [--project PATH] [--entry PATH] [--mermaid] [--plain] [--out FILE]
```

| Flag | Behavior |
| --- | --- |
| (default, TTY) | Render via `graphs-tui` |
| `--mermaid` | Raw Mermaid to stdout |
| Non-TTY | Auto `--mermaid` unless `--tui` forced |

## VS Code Graph Explorer

- Projects tree **must** remain for Targets / Dependencies / Source folders navigation.
- Graph Explorer panel **must** fetch `beskid.getGraph` and render bundled Mermaid locally (no CDN).
- Refresh **must** follow `onRefreshWorkspaceUi` and display `revision` badge.

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->
``````

</details>
