---
title: Core.Bytes
description: Byte buffer primitives over u8[] and runtime array builtins.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-06
---

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`Core.Bytes` provides allocation-explicit byte buffer operations on `u8[]` handles backed by `BeskidArray` and `__array_*` / `__bytes_*` runtime builtins. It **must not** call syscalls directly.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/corelib/packages/foundation/src/Core/Bytes/`
- `compiler/crates/beskid_runtime/src/builtins/arrays.rs`
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-CORE-PRIM-0010`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Design model](./articles/design-model/)
- [Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
