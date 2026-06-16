---
title: ABI versioning and compatibility
description: Versioned ABI guarantees, symbol stability rules, and migration
  expectations between compiler and runtime.
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

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`ABI versioning and compatibility` defines one operational contract that a newcomer can follow end-to-end: first the model, then execution flow, then strict guarantees, concrete examples, and verification guidance.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `AbiVersion` and compatibility definitions in `compiler/crates/beskid_abi/src/lib.rs`
- `RUNTIME_EXPORT_SYMBOLS` in `compiler/crates/beskid_abi/src/symbols.rs`
- JIT/runtime symbol loading in `compiler/crates/beskid_engine/src/jit_module.rs`
- Runtime exports in `compiler/crates/beskid_runtime/src/lib.rs`
</SpecSection>

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-EXEC-ABI-0001`, `D-EXEC-ABI-0002`); use the reader **ADRs** tab for expandable detail.
