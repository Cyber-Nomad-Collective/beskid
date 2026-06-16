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

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-IR-0004` … `D-COMP-IR-0006`); use the reader **ADRs** tab for expandable detail.

- [Design model](./design-model/)
- [Flow and algorithm](./flow-and-algorithm/)
- [Contracts and edge cases](./contracts-and-edge-cases/)
- [Examples](./examples/)
- [Verification and traceability](./verification-and-traceability/)
- [FAQ and troubleshooting](./faq-and-troubleshooting/)
