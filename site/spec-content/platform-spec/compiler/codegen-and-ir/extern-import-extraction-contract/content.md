---
title: Extern import extraction contract
description: Feature hub for the extern import extraction contract in the
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

This feature hub defines the normative contract for **extern import extraction contract** and links newcomer-oriented reference articles.

## Implementation anchors
- `compiler/crates/beskid_abi/src/builtins.rs` and `symbols.rs` define import-facing ABI names.
- `compiler/crates/beskid_runtime/src/builtins/mod.rs` provides runtime implementations for extracted imports.
- `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs` verifies extern calls end-to-end.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-IR-0004` … `D-COMP-IR-0006`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Extern import extraction contract - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Extern import extraction contract - Design model](./articles/design-model/)
- [Extern import extraction contract - Examples](./articles/examples/)
- [Extern import extraction contract - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Extern import extraction contract - Flow and algorithm](./articles/flow-and-algorithm/)
- [Extern import extraction contract - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
