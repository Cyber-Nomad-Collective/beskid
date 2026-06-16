---
title: SharedResolution entry query bundle
description: Arc-backed Resolution snapshot with symbol registry helpers for
  tooling queries.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-MODS-0019
adrStatus: Accepted
adrDate: 2026-06-05
lastReviewed: 2026-06-05
---

## Context

`beskid_queries` exports `SharedResolution(Arc<Resolution>)` but tooling historically read raw `Resolution` from `FrontEndTypedResult` or `DocumentAnalysisSnapshot`. Callers that need symbol registry lookups duplicated `symbol_lookup` imports or skipped registry-aware paths entirely.

Full `prepare_compilation` / typecheck is heavier than LSP or doc paths that only need assembly-backed entry resolve.

## Decision

1. **`SharedResolution`** wraps `Arc<Resolution>` and exposes thin delegates: `symbols()`, `by_symbol()`, `symbol_for_item`, `item_id_for_symbol`, `canonical_item_id`, `qualified_name` (no duplicated registry logic).

2. **`entry_resolution_with_db`** in `beskid_queries::entry` runs the assembly + `ModuleIndex::resolve_entry_hir` spine and returns `SharedResolution` **without** typing the entry program.

3. **`typed_entry_bundle`** remains the executable path; resolution-only callers **should** prefer `entry_resolution_with_db` when type results are not needed.

IDE document analysis continues to use `DocumentAnalysisSnapshot.resolution`; registry invariants are the same `Resolution` product described in [D-COMP-SEM-0016](/platform-spec/compiler/semantic-pipeline/resolver-contract/adr/0005-package-prefixed-symbol-identity/).

## Consequences

- Incremental hosts can memoize entry resolution separately from typed HIR when safe.
- Tests assert non-empty `by_symbol` on fixture projects after `entry_resolution_with_db`.

## Verification anchors

- `compiler/crates/beskid_queries/src/output.rs`
- `compiler/crates/beskid_queries/src/entry.rs`
- `compiler/crates/beskid_queries/tests/incremental.rs`
