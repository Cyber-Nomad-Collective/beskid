---
title: Type-system pass contract
description: Feature hub for the type-system pass contract in the reference compiler.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-16
---

This feature hub defines the normative contract for the authoritative **`lower.type_check`** pass: three internal stages (surface, check, lowering prep), `HirNodeId`-keyed `TypeResult`, per-unit Salsa surfaces, and `EntryOnly` / `FullClosure` dependency typing policy.

## Implementation anchors

| Anchor | Role |
| --- | --- |
| `compiler/crates/beskid_analysis/src/services/lower.rs` | `lower.type_check` orchestration, `DependencyTypingPolicy` |
| `compiler/crates/beskid_analysis/src/services/unit_ops.rs` | `type_entry`, `type_entry_gate` |
| `compiler/crates/beskid_analysis/src/hir/index.rs` | `HirNodeId` assignment |
| `compiler/crates/beskid_analysis/src/types/surface.rs` | Per-unit `UnitTypeSurface` |
| `compiler/crates/beskid_analysis/src/types/checker.rs` | Body typing, `node_types` |
| `compiler/crates/beskid_analysis/src/types/inference/` | Constraint solver |
| `compiler/crates/beskid_analysis/src/types/lowering_prep.rs` | Codegen metadata |
| `compiler/crates/beskid_queries/src/unit.rs` | `unit_type_surface_tracked` |
| `compiler/crates/beskid_tests/src/analysis/type_check_diagnostics.rs` | **E12xx** prepare-spine conformance |
| `compiler/crates/beskid_tests/src/analysis/diagnostics.rs` | Stable issue kind codes |

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-SEM-0013` … `D-COMP-SEM-0015`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Type-system pass contract - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Type-system pass contract - Design model](./articles/design-model/)
- [Type-system pass contract - Examples](./articles/examples/)
- [Type-system pass contract - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Type-system pass contract - Flow and algorithm](./articles/flow-and-algorithm/)
- [Type-system pass contract - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
