---
title: Rust ABI profile — Boundary and stability
description: What is stable at the Rust runtime ↔ generated code boundary versus
  implementation-private Rust types.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-06
---

## Stable surface

The **normative stable surface** for loaders and generated code in ABI v3 is:

1. **Kernel exports** — the small set of direct `extern "C-unwind"` symbols published through generated `beskid_abi` tables and realized in `beskid_runtime` (see [kernel and dispatch](/platform-spec/language-meta/interop/rust-abi-profile/kernel-and-dispatch/)).
2. **Dispatch envelope layout** — the versioned `RuntimeInteropEnvelope` band and tag validity rules ([D-LMETA-IC-0004](/platform-spec/language-meta/interop/interop-contracts/adr/0004-dispatch-envelope-layout/)).

Soft runtime ops are **not** stable as individual linker symbols in v3; they are stable as **manifest-assigned dispatch tags** routed through `interop_dispatch_*` kernel entrypoints. Conformance tests lock the kernel allowlist and envelope band for a given **runtime ABI version** (see `compiler/crates/beskid_tests/src/abi/contracts.rs`).

## Implementation-private Rust

Rust types, modules, and internal helpers inside `beskid_runtime` that are **not** part of the exported symbol contract may change across compiler releases without a major ABI version bump, provided tests and documented runtime behavior remain compatible.

## Unwind and panics

Runtime entrypoints may use **`extern "C-unwind"`** (or equivalent) where platform policy requires interoperable unwinding with generated code. The exact mapping is **profile-defined** and must stay consistent with panic and IO documentation under `/execution/runtime/`.
