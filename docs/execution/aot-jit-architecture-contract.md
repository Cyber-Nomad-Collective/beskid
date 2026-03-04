---
description: Immutable AOT/JIT execution and ABI contract
---

# AOT/JIT architecture contract

This document freezes the execution contract between lowering, runtime, JIT, and AOT.

## Contract invariants (immutable unless ABI version bump)

1. **Lowering parity**
   - JIT and AOT consume the same lowered artifact semantics.
   - No backend-specific language behavior is allowed.

2. **Runtime symbol parity**
   - JIT symbol binding and AOT linker/runtime bridge resolve the same runtime symbol surface.
   - Runtime exports are defined by `beskid_abi::RUNTIME_EXPORT_SYMBOLS`.

3. **Runtime-mediated platform execution**
   - Platform-specific execution policy (syscalls/OS APIs/blocking behavior) is owned by `beskid_runtime`.
   - JIT and AOT must not implement backend-specific syscall policy.
   - Compiler lowering may target runtime ABI entrypoints only for runtime/system functionality.

4. **Single ABI boundary**
   - Runtime entrypoints are exposed through stable C ABI symbols.
   - AOT and JIT must not introduce backend-only ABI hooks.

5. **Interop dispatch scope**
   - Runtime interop dispatch symbols remain ABI-level runtime exports.
   - Interop dispatch is for language/runtime interop boundaries, not a required stdlib generation workflow.
   - Return-group routing remains fixed to:
     - `unit` -> `interop_dispatch_unit`
     - `usize` -> `interop_dispatch_usize`
     - `ptr` -> `interop_dispatch_ptr`

6. **Versioned ABI compatibility**
   - ABI compatibility is controlled by `BESKID_RUNTIME_ABI_VERSION`.
   - ABI-breaking changes require:
     1) ABI version bump,
     2) migration note,
     3) updated contract tests.

## Required enforcement

The following checks are mandatory and CI-gated:

1. ABI contracts: runtime symbol allowlist + ABI version checks
2. JIT/AOT import parity: both backends resolve the same runtime symbol surface
3. Runtime dispatch contracts: return-group routing and dispatch behavior tests
4. JIT/AOT execution parity suite for runtime ABI calls
5. Architecture policy checks: no backend-specific platform execution policy in JIT/AOT

## Operator workflow

- Validate architecture and ABI contracts: `cargo test -p beskid_tests`
- Verify runtime ABI symbol and dispatch parity in CI
- Keep runtime as the only platform policy owner during refactors
