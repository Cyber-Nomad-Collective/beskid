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

3. **Interop dispatch contract parity**
   - Interop uses generated tag constants and generated dispatch routing only.
   - Return-group routing is fixed to:
     - `unit` -> `interop_dispatch_unit`
     - `usize` -> `interop_dispatch_usize`
     - `ptr` -> `interop_dispatch_ptr`

4. **Single ABI boundary**
   - Runtime entrypoints are exposed through stable C ABI symbols.
   - AOT and JIT must not introduce backend-only ABI hooks.

5. **Generated dispatch ownership**
   - `crates/beskid_runtime/src/interop_generated.rs` is generated from `crates/beskid_runtime/interop_spec`.
   - Manual edits to generated dispatch artifacts are forbidden.

6. **Versioned ABI compatibility**
   - ABI compatibility is controlled by `BESKID_RUNTIME_ABI_VERSION`.
   - ABI-breaking changes require:
     1) ABI version bump,
     2) migration note,
     3) updated contract tests.

## Required enforcement

The following checks are mandatory and CI-gated:

1. Interop freshness: `pekan_cli interop --check`
2. ABI contracts: symbol allowlist + ABI version checks
3. Dispatch contracts: generated runtime exact-match + return-group routing tests
4. JIT/AOT parity suite

## Operator workflow

- Regenerate interop artifacts: `cargo run -p beskid_cli -- interop`
- Verify contract freshness: `cargo run -p beskid_cli -- interop --check`
- Run stabilization tests: `cargo test -p beskid_tests`
