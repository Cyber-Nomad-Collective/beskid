---
title: Resolver contract - Examples
description: Concrete symbol identity and cross-unit reference scenarios.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-05
---

## Prefetch dependency symbol

`Main.bd` calls `Output.WriteLine` from a dependency unit collected into `ModuleIndex`:

| Identity | Example |
| --- | --- |
| `ItemId` | Dense index into merged `items` (stable for prefetch rows) |
| `SymbolId` | Interned key for export |
| **`symbolKey`** (api.json) | `corelib_mvp::Std::System::IO::Output::WriteLine` (exact package prefix from materialized project) |
| **`qualifiedName`** | May use module-relative display; prefer **`symbolKey`** for cross-package links |

Workspace find-references on the `WriteLine` use site **must** include references in `Output.bd` when assembly is available.

## Entry-defined symbol referenced elsewhere

`helper()` declared in the entry unit and called from a dependency file:

- Entry merged resolution assigns `helper` a registry symbol under the host **`project_name`**.
- Per-unit resolve of the dependency file may assign a **different dense `ItemId`** to the same logical import target.
- IDE reference matching **must** still succeed via equal **`SymbolId`**, not `ItemId` equality.

## `@ref` by full symbol key

Documentation comment:

```beskid
/// See also @ref(corelib::Std::Console::Esc)
```

Resolution **must** locate the target item by exact registry string before falling back to `qualifiedName` suffix heuristics (`doc/refs.rs`).

## Non-exportable rows

Parameters and other synthetics have **`ItemInfo.symbol: None`**. They omit **`symbolKey`** in `api.json` and use **`ItemId`** / local identity in IDE queries.

## Anchored fixtures

- `compiler/crates/beskid_e2e_tests/fixtures/corelib_mvp/` — assembly-backed document tests
- `compiler/corelib/beskid_corelib/tests/corelib_tests/` — corelib integration surfaces
