---
title: Flow and algorithm
description: Activation, LSP init, tree refresh, auto-select, and reveal flows
  for workspace and project explorers.
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

End-to-end sequences from extension activation through tree population and focus synchronization.

## Activation and LSP start

```arch
sequenceDiagram
  participant VS as VS Code
  participant Ext as Extension
  participant LSP as beskid_lsp
  VS->>Ext: activate
  Ext->>Ext: read workspaceState.focusedProjectUri
  Ext->>LSP: start LanguageClient (initializationOptions.focusedProjectUri)
  LSP-->>Ext: initialized
  Ext->>LSP: executeCommand beskid.listWorkspaces
  LSP-->>Ext: workspaces[]
  Ext->>Ext: populate WorkspaceTreeProvider
  alt focusedProjectUri set
    Ext->>LSP: executeCommand beskid.getGraph (projectDeps)
    LSP-->>Ext: GraphPayload metadata.nodes
    Ext->>Ext: populate ProjectTreeProvider
  end
```

1. Extension **must** start the language client before populating trees (commands are server-backed).
2. If no focus is stored, extension **may** defer Project view population until auto-select or user picks a member.

## Member selection flow

1. User activates a **member** node in `beskidWorkspaceView`.
2. Extension sets `focusedProjectUri = member.uri`.
3. Extension persists workspace state and sends configuration notification to LSP (no restart).
4. Extension refreshes project tree sections, outline, and package panel (parallel `getGraph` + `getProjectDependencies`).
5. Status bar **may** show project name briefly (non-blocking).

## Auto-select from editor

1. `onDidChangeActiveTextEditor` fires with document URI.
2. If `beskid.project.autoSelectFromEditor` is false, stop.
3. Resolve `Project.proj` for editor path; if none, stop.
4. If resolved URI equals current focus, stop.
5. Set focus and run member selection steps 3–4.

## Debounced workspace refresh

1. File watcher fires (manifest, lock, `.bd`, or `workspace.package.json`).
2. Extension debounces (≥300ms coalescing).
3. `executeCommand('beskid.refreshWorkspace')`.
4. Re-fetch `beskid.listWorkspaces`; if focus still valid, re-fetch graph and dependencies.
5. Fire `onDidChangeTreeData` on both providers.

## Reveal in tree

| Command | Behavior |
| --- | --- |
| `beskid.revealInWorkspaceTree` | Expand workspace containing focus; reveal member or workspace root |
| `beskid.revealInProjectTree` | Reveal focused `Project.proj` root and scroll to dependency/target node when `arg` node id provided |

Both **must** be available from editor title/context when a Beskid file is active.

## Verification notes

- Flow tests **should** mock LSP executeCommand and assert ordering: `listWorkspaces` before `getGraph` on cold start.
- Changing `focusedProjectUri` **must not** appear in logs as a full language-client restart.

## Related topics

- [Design model](./design-model/)
- [Examples](./examples/)
