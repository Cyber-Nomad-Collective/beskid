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
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-PROJ-0007` … `D-COMP-PROJ-0009`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Registry and overrides contract - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Registry and overrides contract - Design model](./articles/design-model/)
- [Registry and overrides contract - Examples](./articles/examples/)
- [Registry and overrides contract - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Registry and overrides contract - Flow and algorithm](./articles/flow-and-algorithm/)
- [Registry and overrides contract - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
