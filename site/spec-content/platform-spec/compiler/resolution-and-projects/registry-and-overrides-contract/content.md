---
title: Registry and overrides contract
description: Feature hub for the registry and overrides contract in the reference compiler.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-04-30
---

This feature hub defines the normative contract for **registry and overrides contract** and links newcomer-oriented reference articles.

## Implementation anchors
- `compiler/crates/beskid_tests/src/projects/corelib/mod.rs` validates project source selection behavior.
- `compiler/crates/beskid_cli/src/commands/` provides CLI-level switches for registry interaction.
- `pckg/src/Server/` is the registry-side system consumed by compiler/project tooling.

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-PROJ-0007` … `D-COMP-PROJ-0009`); use the reader **ADRs** tab for expandable detail.

- [Design model](./design-model/)
- [Flow and algorithm](./flow-and-algorithm/)
- [Contracts and edge cases](./contracts-and-edge-cases/)
- [Examples](./examples/)
- [Verification and traceability](./verification-and-traceability/)
- [FAQ and troubleshooting](./faq-and-troubleshooting/)
