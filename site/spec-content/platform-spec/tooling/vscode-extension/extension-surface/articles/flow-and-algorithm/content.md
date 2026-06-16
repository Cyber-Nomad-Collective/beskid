---
title: Flow and algorithm
description: Activation through LSP init, tree refresh, and package search.
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

## Activation sequence

1. `extension.ts` constructs `BeskidExtensionRuntime`.
2. Register tree providers, commands, task providers, file watchers.
3. Start `LanguageClient` with `focusedProjectUri` from workspace state.
4. `initialized` → LSP workspace scan → `beskid/status` progress.
5. `beskid.listWorkspaces` populates **Workspaces** view.

## Package search flow

1. User runs **Search packages** or view welcome link → `InputBox`.
2. Provider debounces 300ms, calls cached `GET /api/search`.
3. Registry rows expand → `GET /api/packages/{name}` for versions/deps.
4. **Fetch** / **Lock** view title → `beskidCliRunner` → refresh **This project** via `beskid.getProjectDependencies`.

## Watchers

Glob: `**/{*.bd,*.proj,Project.lock,workspace.package.json}` → debounced `beskid.refreshWorkspace` + tree refresh.
