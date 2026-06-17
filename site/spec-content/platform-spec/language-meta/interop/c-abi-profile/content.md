---
title: C ABI profile
description: System V-style C ABI binding for user extern contracts—types,
  calling conventions, libraries, and engine resolution policy.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-20
---

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
The **C ABI profile** is the normative mapping from **[Interop.Contracts](/platform-spec/language-meta/interop/interop-contracts/)** primitives to **C-compatible** foreign libraries on tier-1 hosts. v0.3 **Standard** conformance uses **link-time** binding ([link-time linking](/platform-spec/language-meta/interop/c-abi-profile/link-time-linking/)), **interop view types** ([interop view types](/platform-spec/language-meta/interop/c-abi-profile/interop-view-types/)), and **System V AMD64** for the reference compiler path.

**Dynamic resolution** (`dlopen` / `dlsym`) is a **Proposed** appendix only ([dynamic resolution profile](/platform-spec/language-meta/interop/c-abi-profile/dynamic-resolution-profile/)). **WinAPI** is **out of scope** for stdlib Standard ([platform tier matrix](/platform-spec/language-meta/interop/c-abi-profile/platform-tier-matrix/)).

Lowering uses **Cranelift**; foreign libraries need only expose C ABI entrypoints compatible with emitted calls.
</SpecSection>

<SpecSection title="v0.3 delivery bands" id="v03-delivery-bands">
| Band | Content | Status |
| --- | --- | --- |
| **v0.3.0** | Interop views, link-time import, symbol overrides | Standard (spec); impl may trail |
| **v0.3.1** | `CLayout` primitive structs | Proposed |
| **Later** | Nested FFI structs, enum ABI, foreign-thread entry | Planned after basic FFI |
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- Extern import metadata: `compiler/crates/beskid_codegen/src/lowering/context.rs` (`ExternImport`)
- Collection: `compiler/crates/beskid_codegen/src/lowering/lowerable.rs`
- Contract calls: `compiler/crates/beskid_codegen/src/lowering/expressions/call_expression.rs`
- Signature validation: `compiler/crates/beskid_codegen/src/cranelift_host.rs`
- Legacy dynamic resolution: `compiler/crates/beskid_engine/src/engine.rs` (`extern_dlopen`, Proposed)
- Stable view layouts (embedding): `compiler/crates/beskid_abi/src/types.rs`
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-LMETA-CABI-0001` … `D-LMETA-CABI-0005`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [C ABI profile — C layout types (v0.3.1)](./articles/c-layout-types/)
- [C ABI profile — Dynamic resolution profile](./articles/dynamic-resolution-profile/)
- [C ABI profile — Extern contracts and linking](./articles/extern-contracts-and-linking/)
- [C ABI profile — Interop view types (v0.3.0)](./articles/interop-view-types/)
- [C ABI profile — Link-time linking](./articles/link-time-linking/)
- [C ABI profile — Platform tier matrix](./articles/platform-tier-matrix/)
- [C ABI profile — Types and call conventions](./articles/types-and-call-conventions/)
<!-- /spec:generate:article-index -->
