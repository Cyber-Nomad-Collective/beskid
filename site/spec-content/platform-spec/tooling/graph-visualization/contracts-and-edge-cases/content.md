---
title: Contracts and edge cases
description: LSP beskid.getGraph payload, CLI flags, and graph edge-case policy.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-30
---

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
