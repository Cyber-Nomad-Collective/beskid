---
title: Flow and algorithm
description: From lowering call sites through BUILTIN_SPECS to runtime C exports.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-22
---

## Purpose

Trace how a builtin reference in CLIF becomes a live function pointer at run time. Registry diagram: [design model](./design-model/).

## Lowering to import declaration

1. HIR/lowering selects a runtime operation (allocate string, `fiber_yield`, etc.).
2. Codegen emits a `call` to the stable symbol string (for example `alloc`, not a mangled Rust name).
3. During JIT `compile`, `declare_builtin_imports` walks `BUILTIN_SPECS` in declaration order.
4. For each spec, codegen maps `AbiParamKind::Ptr` to the host pointer type and `I64` to `i64`, then sets return type from `AbiReturnKind`.

## Runtime entry

1. Generated code calls using the platform default calling convention (SysV on Linux x86_64).
2. The runtime builtin enters `enter_runtime_scope` / GC rules as needed (`alloc`, barriers).
3. Fiber/channel builtins park or enqueue work via `beskid_runtime::scheduler` without exposing scheduler internals to CLIF.

## String builtin algorithm (`str_concat`)

1. Read `BeskidStr` headers for left and right operands.
2. Allocate a fresh buffer via `alloc` for combined byte length.
3. Copy UTF-8 payload; return new `{ ptr, len }` handle.
4. On allocation failure or null inputs, trap via `panic` (no implicit `Option` at ABI layer).

## GC barrier hook

1. Lowering emits `gc_write_barrier(parent, child)` after pointer stores when concurrent GC is active.
2. Runtime barrier ensures tri-color invariant (see [Memory and GC](/platform-spec/execution/runtime/memory-and-gc-runtime-contract/)).
3. Phase A may simplify barrier work when only one mutator runs; symbol remains reserved.

## Implementation anchors
- `compiler/crates/beskid_codegen/src/` — `declare_builtin_imports` Cranelift registration
- `compiler/crates/beskid_abi/src/builtins.rs` — signature specification table
- `compiler/crates/beskid_engine/src/jit_module.rs` — symbol map initialization

## Related topics

- [Contracts and edge cases](./contracts-and-edge-cases/)
- `compiler/crates/beskid_abi/src/builtins.rs` — full spec table
