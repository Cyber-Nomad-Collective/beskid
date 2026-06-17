---
title: Project manifest contract
description: Compiler resolution and graph contracts for Project.proj (schema
  and author surfaces defer to tooling).
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
**Tooling** owns the normative **`Project.proj` schema** (keys, types, Mod blocks, link metadata, and CLI/LSP examples). **This feature** owns how the reference compiler **loads**, **validates in the resolution graph**, and **diagnoses** manifest-driven project graphs—without duplicating key tables.

When editing manifest keys, update [tooling / design model](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/design-model/) first; adjust compiler resolution text here only when graph behavior or diagnostic bands change.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/crates/beskid_analysis/src/bsol.pest` — Bsol surface grammar for manifests
- `compiler/crates/beskid_analysis/src/projects/bsol/` — AST builder (`parse_bsol_document`)
- `compiler/crates/beskid_analysis/src/projects/manifest_resolve.rs` — discovery and parse into workspace graph
- `compiler/crates/beskid_analysis/src/projects/graph/` — DAG insertion, Mod topology
- `compiler/crates/beskid_cli/src/commands/` — manifest-driven compile inputs
- `compiler/crates/beskid_tests/src/projects/corelib/mod.rs` and `compile.rs` — manifest fixtures
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-PROJ-0004` … `D-COMP-PROJ-0006`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Project manifest contract - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Project manifest contract - Design model](./articles/design-model/)
- [Project manifest contract - Examples](./articles/examples/)
- [Project manifest contract - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Project manifest contract - Flow and algorithm](./articles/flow-and-algorithm/)
- [Project manifest contract - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
