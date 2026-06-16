---
title: Core-backed surfaces
description: Corelib APIs backed by runtime builtins, host dispatch, and syscall
  facades under the unified Core.* namespace.
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
`Core-backed surfaces` defines one operational contract that a newcomer can follow end-to-end: first the model, then execution flow, then strict guarantees, concrete examples, and verification guidance. All modules listed here use the `Core.*` prefix per [D-CORE-NS-0001](/platform-spec/core-library/stability-and-api-shape/corelib-api-shape/adr/0004-single-core-namespace/).
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- Corelib docs in `compiler/corelib/beskid_corelib/docs/Core/`
- Console package: `compiler/corelib/packages/console/`
- Stream split: `Core.Input`, `Core.Output`, `Core.Error` in `compiler/corelib/packages/foundation/src/Core/`
- Runtime builtins in `compiler/crates/beskid_runtime/src/builtins/mod.rs`
- ABI builtin specs in `compiler/crates/beskid_abi/src/builtins.rs`
- Corelib ABI tests in `compiler/crates/beskid_tests/src/abi/contracts.rs`
</SpecSection>

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-CORE-STAB-0001` … `D-CORE-STAB-0004`); use the reader **ADRs** tab for expandable detail.
