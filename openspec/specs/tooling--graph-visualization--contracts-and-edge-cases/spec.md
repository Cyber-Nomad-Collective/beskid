<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Contracts and edge cases Specification

## Purpose

LSP beskid.getGraph payload, CLI flags, and graph edge-case policy.

## Requirements

### Requirement: Contracts and edge cases conformance status
This capability SHALL remain non-conformant and MUST NOT be cited as an implemented Beskid guarantee until a validated OpenSpec change adds explicit behavioral requirements.

**Stable ID:** `BSP-REQ-1C49DAA96A23`

#### Scenario: Capability has descriptive material only
- **GIVEN** the migrated sources contain no uppercase BCP-14 obligation or accepted ADR decision
- **WHEN** an implementation reports Beskid conformance
- **THEN** it MUST NOT claim conformance based on this capability

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
