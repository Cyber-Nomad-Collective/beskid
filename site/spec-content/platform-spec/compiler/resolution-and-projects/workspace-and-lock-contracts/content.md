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
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-PROJ-0010` … `D-COMP-PROJ-0012`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Workspace and lock contracts - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Workspace and lock contracts - Design model](./articles/design-model/)
- [Workspace and lock contracts - Examples](./articles/examples/)
- [Workspace and lock contracts - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Workspace and lock contracts - Flow and algorithm](./articles/flow-and-algorithm/)
- [Workspace and lock contracts - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
