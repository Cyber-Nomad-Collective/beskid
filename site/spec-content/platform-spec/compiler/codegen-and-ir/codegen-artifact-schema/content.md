---
title: Codegen artifact schema
description: Feature hub for the codegen artifact schema in the reference compiler.
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

This feature hub defines the normative contract for **codegen artifact schema** and links newcomer-oriented reference articles.

## Implementation anchors
- `compiler/crates/beskid_engine/src/jit_module.rs` consumes generated artifact fields.
- `compiler/crates/beskid_tests/src/runtime/jit.rs` validates runtime execution from codegen output.
- `compiler/crates/beskid_tests/src/abi/contracts.rs` checks ABI-level schema compatibility.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-IR-0001` … `D-COMP-IR-0003`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Codegen artifact schema - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Codegen artifact schema - Design model](./articles/design-model/)
- [Codegen artifact schema - Examples](./articles/examples/)
- [Codegen artifact schema - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Codegen artifact schema - Flow and algorithm](./articles/flow-and-algorithm/)
- [Codegen artifact schema - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
