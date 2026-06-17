---
title: Rust ABI profile
description: Rust-hosted runtime surface—exported symbols, unwind at the
  boundary, and stability rules distinct from user C extern libraries.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-01
---

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
The **Rust ABI profile** describes how the **Beskid runtime** (implemented in Rust) exposes **stable C-compatible entrypoints** to JIT and AOT loaders while allowing **Rust-specific** implementation choices **inside** the runtime crate boundary.

This profile is **not** a promise that arbitrary Rust crates can be linked as user `Extern` targets without shims. User-authored foreign code on the supported path remains the **[C ABI profile](/platform-spec/language-meta/interop/c-abi-profile/)** until a future specification promotes additional Rust-native interop.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- Language-owned manifest: `compiler/runtime_manifest.toml`
- Generated symbol names and specs: `compiler/crates/beskid_abi/src/generated/`
- Manifest generator: `compiler/crates/beskid_manifest/`
- Runtime exports and modules: `compiler/crates/beskid_runtime/src/lib.rs`, `compiler/crates/beskid_runtime/src/builtins/mod.rs`
- Syscall and panic bridges (example of `extern "C-unwind"` usage): `compiler/crates/beskid_runtime/src/builtins/panic_io.rs`
- JIT registration of runtime symbols: `compiler/crates/beskid_engine/src/jit_module.rs`
- Symbol inventory and runtime ABI references: `/platform-spec/execution/runtime/`
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-LMETA-RUSTABI-0001` … `D-EXEC-RT-0017`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Rust ABI profile — Boundary and stability](./articles/boundary-and-stability/)
- [Rust ABI profile — Kernel and dispatch](./articles/kernel-and-dispatch/)
- [Rust ABI profile — Runtime manifest](./articles/runtime-manifest/)
- [Rust ABI profile — Shims and compatibility strategy](./articles/shims-and-compatibility/)
<!-- /spec:generate:article-index -->
