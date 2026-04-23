---
title: "JIT/AOT execution boundary"
description: Immutable execution boundary between JIT and AOT backends
---


This document defines the execution boundary between lowering, runtime, JIT, and AOT.
It specifies what MUST remain identical across backends and what MAY differ.

## Boundary invariants (immutable unless ABI version bump)

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
   - Interop dispatch is for language/runtime interop boundaries, not a required corelib generation workflow.
   - Return-group routing remains fixed to:
     - `unit` -> `interop_dispatch_unit`
     - `usize` -> `interop_dispatch_usize`
     - `ptr` -> `interop_dispatch_ptr`

6. **Versioned ABI compatibility**
   - ABI compatibility is controlled by `BESKID_RUNTIME_ABI_VERSION`.
   - ABI-breaking changes require:
     1) ABI version bump,
     2) migration note,
     3) updated boundary validation notes.

## Allowed backend differences
The following differences are allowed and do not violate the boundary:

1. Packaging and linkage strategy (in-memory JIT finalization vs object/link pipeline).
2. Target selection (host ISA for JIT, explicit target triple for AOT).
3. Final artifact form (in-memory executable code vs object/static/shared/executable outputs).

## Forbidden backend differences
The following differences violate the boundary and require architecture review:

1. Different language behavior between JIT and AOT for the same source.
2. Different runtime symbol surfaces imported by JIT and AOT.
3. Backend-owned syscall/OS policy that bypasses `beskid_runtime`.
4. Backend-specific ABI entrypoints not versioned through runtime ABI policy.

## Validation intent
Boundary compliance should be validated through architecture tests and review of:

1. Runtime symbol allowlist and ABI version checks.
2. JIT/AOT import-surface consistency.
3. Runtime dispatch routing behavior.
4. Execution behavior parity for runtime ABI calls.
5. Absence of backend-specific platform execution policy.

## Maintenance workflow
- Keep runtime as the only platform policy owner during refactors.
- Treat boundary changes as architecture changes, not implementation-only edits.
- Document any ABI-surface change with version, rationale, and migration note.
