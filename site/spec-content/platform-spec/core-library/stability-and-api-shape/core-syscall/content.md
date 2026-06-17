---
title: Core.Syscall
description: Typed descriptor syscall facade for text and binary I/O.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-06
---

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`Core.Syscall` exposes typed `ReadWith` / `WriteWith` and binary `ReadBytes` / `WriteBytes` for arbitrary descriptors via `Descriptor::Raw`. Standard stream modules remain a restricted profile (**SC-004**, **IO-001** / **IO-002**).
</SpecSection>

<SpecSection title="Scope" id="scope">
- **In scope:** Typed descriptor facade (`Descriptor`, `ReadRequest`, `WriteRequest`, `SyscallError`), text and binary read/write for arbitrary fds, and stable error mapping across JIT/AOT.
- **Out of scope:** Console markup, terminal controls, and std-stream-only modules (`Core.Input`, `Core.Output`, `Core.Error`) which **must** use `Descriptor::Standard` only.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/corelib/packages/foundation/src/Core/Syscall.bd`
- `compiler/corelib/packages/foundation/src/Core/Syscall/`
- Runtime builtins: `compiler/crates/beskid_runtime/src/builtins/io.rs`
- Corelib tests: `compiler/corelib/beskid_corelib/tests/corelib_tests/src/system/Syscall*Tests.bd`
</SpecSection>

<SpecSection title="Contract statement" id="contract-statement">
| Surface | Rule |
| --- | --- |
| **SC-001** | `ReadWith` / `WriteWith` **must** route via typed `Descriptor`, not raw fd integers in stream modules. |
| **SC-004** | `Core.Input` / `Output` / `Error` **must** use `Descriptor::Standard` only (**IO-001**, **IO-002**). |
| **SC-005** | `SyscallError` mapping **must** be stable across JIT/AOT. |
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
<!-- /spec:generate:article-index -->
