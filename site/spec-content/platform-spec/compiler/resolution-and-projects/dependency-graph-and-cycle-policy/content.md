---
title: Dependency graph and cycle policy
description: Feature hub for the dependency graph and cycle policy in the
  reference compiler.
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

This feature hub defines the normative contract for **dependency graph and cycle policy** and links newcomer-oriented reference articles.

## Implementation anchors
- `compiler/crates/beskid_tests/src/projects/corelib/layout.rs` models multi-project dependency layouts.
- `compiler/crates/beskid_tests/src/projects/corelib/mod.rs` checks graph expectations.
- `compiler/crates/beskid_cli/src/commands/doc.rs` consumes resolved dependency context for docs.

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-PROJ-0001` … `D-COMP-PROJ-0003`); use the reader **ADRs** tab for expandable detail.

- [Design model](./design-model/)
- [Flow and algorithm](./flow-and-algorithm/)
- [Contracts and edge cases](./contracts-and-edge-cases/)
- [Examples](./examples/)
- [Verification and traceability](./verification-and-traceability/)
- [FAQ and troubleshooting](./faq-and-troubleshooting/)
