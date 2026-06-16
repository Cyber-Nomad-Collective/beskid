---
title: Examples
description: corelib workspace and single-app project scenarios.
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

## corelib workspace

1. Open `compiler/corelib` (or superrepo with corelib submodule) in VS Code.
2. **Workspaces** lists `Workspace.proj` with member packages (for example `beskid_corelib`, console packages).
3. Click a member → focus updates; **Packages → This project** shows locked `corelib` and siblings from `Project.lock`.
4. **Registry search** for `corelib` hits the configured default registry; **Fetch** runs `beskid fetch --project` on the focused root.

## Single-app project

1. Open a folder with only `Project.proj` (no workspace).
2. Auto-select focuses that manifest when editing `.bd` files.
3. **Project** view lists declared path/git/registry deps; unresolved registry deps show warning icons.
4. `beskid lock` from the Packages view title updates `Project.lock` via CLI.
