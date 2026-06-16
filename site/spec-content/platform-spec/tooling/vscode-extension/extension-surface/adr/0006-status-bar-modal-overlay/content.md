---
title: Status bar modal overlay
description: Status bar modal overlay replaces sidebar dashboard webview.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-TOOL-VSC-0006
adrStatus: Accepted
adrDate: 2026-05-30
lastReviewed: 2026-05-30
---

## Context

An earlier sidebar **Dashboard** webview (`beskidDashboardView`) occupied the top of the Beskid activity-bar container. Operators expected the Beskid status-bar item to open a lightweight **popover-style** quick panel (runtime snapshot + actions), not a persistent sidebar header.

VS Code extensions have no native floating popover API. A singleton **WebviewPanel** with modal scrim styling is the supported overlay pattern.

## Decision

1. **Remove** `beskidDashboardView` from `contributes.views.beskidViews`.
2. Status-bar click runs **`beskid.modal.open`**, which creates or reveals a singleton WebviewPanel with centered card UI (LSP phase, focused project, quick actions).
3. Escape, scrim click, or close disposes the panel.
4. **`beskid.debug.enabled`** (default `false`) gates the optional Debug tree view.

## Consequences

- Activity bar shows Workspaces, Project, Outline, and Packages (local deps) only.
- Dashboard HTML moves to the modal panel module; no sidebar webview views remain.
- Integration tests assert `beskid.modal.open` instead of `beskidDashboardView.focus`.

## Verification anchors

`beskid_vscode/package.json`; `beskid_vscode/src/dashboard/BeskidModalPanel.ts`; `test/viewsContract.test.ts`.
