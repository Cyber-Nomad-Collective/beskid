---
title: Workspace and lock contracts
description: Compiler workspace graph, lock materialization, and resolution
  diagnostics (schema defers to tooling).
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-21
---

<SpecSection title="Authority split" id="authority-split">
**Tooling** owns **`Workspace.proj` / lockfile** schema, update commands, and author-facing reserved-key tables. **This feature** owns how the compiler **materializes** the dependency graph from locks, **rejects** inconsistent workspace layouts, and **diagnoses** resolution failures during analysis and CI builds.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/crates/beskid_analysis/src/resolve/mod.rs` — project and dependency resolution
- `compiler/crates/beskid_cli/src/commands/` — lock policy flags and update entrypoints
- `compiler/crates/beskid_tests/src/projects/corelib/compile.rs` and `layout.rs` — lock-sensitive workspace fixtures
- `compiler/crates/beskid_tests/src/analysis/pipeline/core.rs` — workspace pipeline tests
</SpecSection>

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-PROJ-0010` … `D-COMP-PROJ-0012`); use the reader **ADRs** tab for expandable detail.

## Articles

- [Design model](./design-model/) — materialized graph and lock roots (no duplicate workspace key tables)
- [Flow and algorithm](./flow-and-algorithm/) — resolve and lock application order
- [Contracts and edge cases](./contracts-and-edge-cases/) — graph/lock diagnostic contracts
- [Examples](./examples/)
- [Verification and traceability](./verification-and-traceability/)
- [FAQ and troubleshooting](./faq-and-troubleshooting/)
