---
title: Import closure not directory sweep
description: Build and run discovery enqueue one file per pub mod seed; further
  units enter only via use edges.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-BUILD-0023
adrStatus: Accepted
adrDate: 2026-05-29
lastReviewed: 2026-05-29
---

## Context

`ImportClosure` and `WorkspaceScan` modes were conflated in places: directory sweeps pulled unrelated `.bd` files into compile graphs, breaking determinism and parity with explicit `use` graphs.

## Decision

For `AssemblyDiscovery::ImportClosure` (build, run, lower, test, LSP document snapshots):

| Rule | Detail |
| --- | --- |
| Seeds | Entry file, prelude union seeds (D-COMP-BUILD-0022), and each `pub mod A.B` resolve **exactly one** module file before traversal |
| Expansion | Additional units enter the queue **only** when a queued file contains a `use` import that resolves under effective roots |
| No sweep | `ImportClosure` **must not** enumerate all `*.bd` under roots (that mode is **`WorkspaceScan`** only, for LSP workspace indexing) |

`WorkspaceScan` remains capped by `max_units` with deterministic sort; it **must not** be used for `beskid build` / `beskid run` / `beskid test`.

## Consequences

Assembly unit count tracks the transitive `use` graph plus explicit prelude seeds. Tests assert closure size for fixture projects.

## Verification anchors

- `compiler/crates/beskid_analysis/src/projects/assembly/loader.rs`
- `compiler/crates/beskid_analysis/src/projects/model.rs` (`AssemblyDiscovery`)
- `compiler/crates/beskid_tests/src/projects/composition.rs`
