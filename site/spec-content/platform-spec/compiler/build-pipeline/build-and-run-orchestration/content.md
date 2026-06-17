---
title: Build and run orchestration
description: Feature hub for the build and run orchestration in the reference compiler.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-29
---

This feature hub defines the normative contract for **build and run orchestration** and links newcomer-oriented reference articles.

## Implementation anchors
- `compiler/crates/beskid_cli/src/commands/` coordinates compile, run, and doc commands.
- `compiler/crates/beskid_engine/src/jit_module.rs` executes JIT pipelines from compiled artifacts.
- `compiler/crates/beskid_tests/src/runtime/jit.rs` and e2e fixtures verify orchestration behavior.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-BUILD-0004` … `D-COMP-BUILD-0021`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Build and run orchestration - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Build and run orchestration - Design model](./articles/design-model/)
- [Build and run orchestration - Examples](./articles/examples/)
- [Build and run orchestration - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Build and run orchestration - Flow and algorithm](./articles/flow-and-algorithm/)
- [Build and run orchestration - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
