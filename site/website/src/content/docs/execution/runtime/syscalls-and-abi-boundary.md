---
title: "Runtime syscall ownership and ABI boundary"
description: Runtime ownership of syscall policy and runtime ABI boundaries.
---


## Purpose
Define execution-level ownership for runtime ABI entrypoints, platform syscalls, and backend neutrality.

## Boundary invariants
1. Runtime owns platform behavior (`syscall`, OS API, blocking policy).
2. JIT and AOT import the same runtime ABI surface.
3. Frontend/lowering MUST NOT encode backend-specific syscall behavior.
4. Corelib-facing APIs remain stable while runtime internals evolve.

## ABI ownership split
- **Language-level** `Extern` syntax and typing: `/platform-spec/language-meta/interop/ffi-and-extern/`.
- **Interop.Contracts** (language-agnostic primitives): `/platform-spec/language-meta/interop/interop-contracts/`.
- **C ABI profile** (user `Extern` libraries): `/platform-spec/language-meta/interop/c-abi-profile/`.
- **Rust ABI profile** (runtime export surface): `/platform-spec/language-meta/interop/rust-abi-profile/`.
- Runtime symbol/link/loading behavior: this document.
- Corelib API-level contracts: `/corelib/` (Starlight corelib docs).

## Runtime-mediated execution model
- System-facing corelib operations call stable runtime ABI entrypoints.
- Runtime implements Linux/OS-specific details internally.
- Optional interop dispatcher symbols may exist for language/runtime interop boundaries.

## Required guarantees
- Backends preserve ABI parity across JIT and AOT.
- Runtime symbol/signature divergence is a compatibility break.
- User-facing docs must not expose internal `__interop_*` implementation details.

## Maintenance rules
- Runtime ABI surface changes require versioned compatibility handling.
- Platform-policy changes belong in runtime docs and implementation only.
- Backend docs may reference runtime ABI usage but must not redefine runtime ownership.

## References
- `docs/execution/runtime/runtime-overview.md`
- `docs/execution/runtime/ffi.md`
- `docs/execution/architecture/jit-aot-boundary.md`
