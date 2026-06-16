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
