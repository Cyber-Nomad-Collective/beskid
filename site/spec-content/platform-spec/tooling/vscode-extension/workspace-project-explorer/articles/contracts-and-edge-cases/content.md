---
title: Contracts and edge cases
description: focusedProjectUri, LSP executeCommand JSON schemas, and explorer
  edge-case rules.
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

## Purpose and scope

Normative **LSP `workspace/executeCommand`** payloads and **`focusedProjectUri`** configuration. All URIs **must** be `file://` URIs normalized per LSP URI rules.

## focusedProjectUri

| Rule ID | Rule |
| --- | --- |
| F-01 | On language client start, extension **must** send `initializationOptions.focusedProjectUri` when a project is focused. |
| F-02 | LSP **must** accept deprecated `initializationOptions.selectedProjectUri` as an alias when `focusedProjectUri` is absent. |
| F-03 | On focus change without client restart, extension **must** notify via `workspace/didChangeConfiguration` with settings object `{ "beskid": { "focusedProjectUri": "<uri>" } }` **or** the `beskid.project` configuration section equivalent documented in extension settings. |
| F-04 | When `focusedProjectUri` is set, LSP **should** prefer that manifest for workspace scan ordering and `cached_compilation_context` selection; when unset, behavior **must** match pre-explorer semantics (all roots). |
| F-05 | Extension **must not** restart the language client solely because `focusedProjectUri` changed. |

## Command transport

All commands below use LSP method **`workspace/executeCommand`** with:

- `command`: string identifier
- `arguments`: JSON array; first element **must** be the args object when args are required

Errors **must** use LSP error codes; clients **must** surface `message` in a notification.

## `beskid.refreshWorkspace`

| Field | Value |
| --- | --- |
| **Purpose** | Trigger workspace rescan and diagnostic refresh (existing contract). |
| **Arguments** | `[]` (empty) |
| **Result** | `null` |

Extension **must** invoke after manifest/lock watcher debounce and from command `beskid.refreshWorkspace`.

## `beskid.listWorkspaces`

Discover every **`Workspace.proj`** under current LSP workspace roots (respecting scan skip dirs).

**Arguments** (optional object):

```json
{
  "roots": ["file:///path/to/folder"]
}
```

When `roots` is omitted, LSP **must** use initialized workspace folders.

**Result:**

```json
{
  "workspaces": [
    {
      "uri": "file:///…/Workspace.proj",
      "name": "corelib",
      "members": [
        {
          "id": "collections",
          "uri": "file:///…/packages/collections/Project.proj",
          "name": "collections"
        }
      ]
    }
  ]
}
```

| Field | Required | Type | Meaning |
| --- | --- | --- | --- |
| `workspaces` | yes | array | One entry per discovered workspace manifest |
| `workspaces[].uri` | yes | string | `Workspace.proj` file URI |
| `workspaces[].name` | yes | string | Workspace name from manifest |
| `workspaces[].members` | yes | array | Parsed workspace members |
| `members[].id` | yes | string | Member id from `Workspace.proj` |
| `members[].uri` | yes | string | Member `Project.proj` URI |
| `members[].name` | no | string | Display name; defaults to `id` when omitted |

## `beskid.getWorkspaceSummary`

**Arguments:**

```json
{
  "workspaceUri": "file:///…/Workspace.proj"
}
```

**Result:**

```json
{
  "workspaceUri": "file:///…/Workspace.proj",
  "name": "corelib",
  "members": [
    {
      "id": "collections",
      "uri": "file:///…/Project.proj",
      "name": "collections",
      "projectName": "collections"
    }
  ],
  "registries": [
    {
      "alias": "default",
      "url": "https://registry.example/"
    }
  ]
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `registries` | yes | Effective registry URLs from workspace resolution rules (see compiler workspace contracts); used by package panel for default registry base |
| `members[].projectName` | no | Parsed `project.name` when available |

## `beskid.getGraph` (tree navigation)

The Projects tree **must** call `beskid.getGraph` with `kind=projectDeps` and read `metadata.nodes` for Targets and Dependencies sections. See [Graph visualization contracts](/platform-spec/tooling/graph-visualization/contracts-and-edge-cases) for the full payload.

| `metadata.nodes[].kind` | Tree section |
| --- | --- |
| `root` | Targets |
| `path`, `git`, `registry` | Dependencies |
| *(warnings with code `unresolved`)* | Dependencies (unresolved) |

## `beskid.getProjectDependencies`

Merged view of manifest declarations and lock lines for one project.

**Arguments:**

```json
{
  "projectUri": "file:///…/Project.proj"
}
```

**Result:**

```json
{
  "projectUri": "file:///…/Project.proj",
  "declared": [
    {
      "name": "corelib",
      "version": null,
      "source": "registry",
      "registry": "default",
      "descriptor": "corelib"
    }
  ],
  "locked": [
    {
      "name": "corelib",
      "resolvedVersion": "1.2.0",
      "registry": "default",
      "checksum": "sha256:…",
      "materializedRoot": "file:///…/.beskid/packages/corelib/1.2.0"
    }
  ],
  "unresolved": []
}
```

| Array | Meaning |
| --- | --- |
| `declared` | Entries from `Project.proj` dependency tables |
| `locked` | Entries from `Project.lock` when present; empty when lock missing |
| `unresolved` | Declared deps that could not be resolved or locked |

`locked[].resolvedVersion` **must** match lockfile semantics in [workspace and lock contracts](/platform-spec/tooling/manifests-and-lockfiles/workspace-and-lock-contracts/).

## Explorer-specific rules

| ID | Rule |
| --- | --- |
| E-W01 | `beskid.listWorkspaces` **must** complete in O(roots × files) with scan skip dirs; **must not** build full compile graphs. |
| E-W02 | `beskid.getGraph` (`projectDeps`) **must** route through `beskid_queries::graph_mermaid`; cycles **must** surface as warnings without infinite tree expansion. |
| E-W03 | When `projectUri` is outside workspace roots, LSP **must** return error `InvalidParams` with a clear message. |
| E-W04 | Extension command `beskid.focusProject` **must** set `focusedProjectUri`; `beskid.clearFocus` **must** clear it and notify LSP. |

## Related topics

- [Extension surface contracts](../extension-surface/contracts-and-edge-cases/) — view IDs and cross-feature settings
- [Snapshot and refresh](/platform-spec/tooling/lsp/snapshot-and-refresh-contract/) — interaction with `beskid.refreshWorkspace`
