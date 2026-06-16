---
title: Design model
description: Extension layout, focus model, and status-bar phases for the Beskid
  VS Code extension.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-30
---

## Activity bar layout

| View ID | Purpose |
| --- | --- |
| `beskidWorkspaceView` | All `Workspace.proj` trees and members |
| `beskidProjectView` | Focused `Project.proj` targets, dependencies, sources |
| `beskidProjectOutlineView` | Document symbols for `.bd` under focused project |
| `beskidPackagesView` | **This project** dependencies only (local lockfile rows) |

Registry browse and package details use a **document WebviewPanel** (`beskid.packages.open`), not the sidebar tree.

## Status bar modal overlay

Clicking the Beskid status-bar item runs **`beskid.modal.open`**, which reveals a singleton WebviewPanel styled as a modal overlay (runtime snapshot, focused project, quick actions). There is **no** sidebar dashboard webview. See [ADR 0006](./adr/0006-status-bar-modal-overlay/).

## Debug view (optional)

`beskidDebugView` is contributed only when **`beskid.debug.enabled`** is `true` (default **false**). Contributors enable it for LSP/runtime inspection.

## Focus model

- **Focused project** — one `Project.proj` URI drives LSP `focusedProjectUri`, CLI cwd, and the **This project** package section.
- **Auto-select** — when `beskid.project.autoSelectFromEditor` is true, the active editor selects the nearest project manifest.
- **Override** — `beskid.selectProject` quick pick remains available.

## Status bar phases

| Phase | Source |
| --- | --- |
| `workspace_scan` | LSP notification `beskid/status` |
| `search` / `details` | pckg HTTP |
| `fetch` / `lock` / `build` / `test` / `analyze` | CLI runner |

Implementation: `beskid_vscode/src/status/beskidStatusController.ts`, `FocusCoordinator`, slim `BeskidExtensionRuntime`.
