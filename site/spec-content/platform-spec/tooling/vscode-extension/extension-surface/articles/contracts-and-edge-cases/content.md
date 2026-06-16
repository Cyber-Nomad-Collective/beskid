---
title: Contracts and edge cases
description: focusedProjectUri, LSP executeCommand JSON, auth, and offline
  registry behavior.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-21
---

## focusedProjectUri

| Surface | Key |
| --- | --- |
| LSP initialize | `initializationOptions.focusedProjectUri` |
| Deprecated alias | `initializationOptions.selectedProjectUri` (one release) |
| Configuration | `beskid.project.focusedProjectUri` in `workspace/didChangeConfiguration` |

When unset, LSP scans all workspace roots without prioritizing a single manifest.

## LSP executeCommand payloads

### `beskid.listWorkspaces`

**Arguments:** `[]`  
**Returns:**

```json
{
  "workspaces": [
    {
      "uri": "file:///…/Workspace.proj",
      "name": "corelib",
      "members": [{ "name": "app", "path": "beskid_corelib", "uri": "file:///…/Project.proj" }]
    }
  ]
}
```

### `beskid.getWorkspaceSummary`

**Arguments:** `[workspaceUri: string]`  
**Returns:** `{ workspaceUri, name, resolver, members[], registries: [{ name, url }] }`

### `beskid.getGraph`

**Arguments:** `[{ projectUri, kind, entryUri?, workspaceUri? }]`  
**Returns:** `{ kind, mermaid, revision, warnings[], metadata: { nodes[], focusedProjectUri? } }` — see [Graph visualization](/platform-spec/tooling/graph-visualization/contracts-and-edge-cases).

### `beskid.getProjectDependencies`

**Arguments:** `[projectUri: string]`  
**Returns:** `{ projectUri, declared[], locked[], unresolved[] }` — `locked` entries include `resolvedVersion`, `materializedRoot`, `registry` when present in `Project.lock`.

## Registry auth

- `beskid.pckg.apiKey` setting or SecretStorage `beskid.pckg.apiKey` → `Authorization: Bearer …` on pckg fetch (matches pckg `ApiKeyAuthentication`).
- Private packages: search/details fail without key; UI shows HTTP error nodes, not silent empty lists.

## Offline / unreachable registry

- Cached search TTL ~30s; details ~60s.
- Non-OK HTTP → tree info node; no unbounded refetch on every `getChildren`.
