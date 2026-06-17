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
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-PROJ-0001` … `D-COMP-PROJ-0003`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Dependency graph and cycle policy - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Dependency graph and cycle policy - Design model](./articles/design-model/)
- [Dependency graph and cycle policy - Examples](./articles/examples/)
- [Dependency graph and cycle policy - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Dependency graph and cycle policy - Flow and algorithm](./articles/flow-and-algorithm/)
- [Dependency graph and cycle policy - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
