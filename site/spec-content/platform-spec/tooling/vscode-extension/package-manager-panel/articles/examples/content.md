---
title: Examples
description: Corelib locked dependencies and registry search in the Packages view.
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

Worked examples for local and registry sections of the package panel.

## Corelib — This project

**Precondition:** `compiler/corelib` open; member `collections` focused; `Project.lock` present.

**Steps:**

1. Open **Packages** view.
2. Expand **This project**.

**Expected rows:** Dependencies such as `corelib` with `resolvedVersion` from lock, `registry: default`, tooltip showing materialized path under `.beskid/packages/`.

**Fetch/Lock:** View title **Lock** runs `beskid lock` at `packages/collections/`; status bar shows `lock` phase; on success, locked versions refresh without restarting LSP.

## Registry search — `corelib`

**Precondition:** Registry reachable at resolved base URL (workspace default or localhost).

**Steps:**

1. View title **Search** → query `corelib`.
2. Expand hit `corelib`.

**Expected:** Versions list from `PackageDetailsResponse.versions`; latest non-yanked version highlighted; dependencies under expanded version match `PackageDependencyResponse` shapes.

**Actions:**

- **Open in browser** uses `buildRegistryPackageUrl`.
- **Add dependency** prompts version; after apply, user runs **Fetch** from view title.

## Private registry with API key

**Precondition:** Registry requires authentication; package `my.internal.lib` not visible anonymously.

**Steps:**

1. Command palette → configure **Beskid: Set Package Registry API Key** (stores secret).
2. Search `my.internal.lib`.

**Expected:** Authenticated search returns hits; without key, 401 error node with configuration hint.

## Related topics

- [Workspace explorer examples](../workspace-project-explorer/examples/)
- [FAQ](../extension-surface/faq-and-troubleshooting/)
