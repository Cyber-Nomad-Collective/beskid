---
title: Extern dispatch and policy
description: How extern calls are declared, resolved, and constrained by runtime
  and host policy.
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
`Extern dispatch and policy` defines one operational contract that a newcomer can follow end-to-end: first the model, then execution flow, then strict guarantees, concrete examples, and verification guidance.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- Extern parsing and diagnostics in `compiler/crates/beskid_analysis/src/beskid.pest` and `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
- ABI builtins definitions in `compiler/crates/beskid_abi/src/builtins.rs`
- Runtime builtin dispatch in `compiler/crates/beskid_runtime/src/builtins/mod.rs`
- Panic/syscall bridging in `compiler/crates/beskid_runtime/src/builtins/panic_io.rs`
</SpecSection>

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-EXEC-ABI-0005`, `D-EXEC-ABI-0006`); use the reader **ADRs** tab for expandable detail.
