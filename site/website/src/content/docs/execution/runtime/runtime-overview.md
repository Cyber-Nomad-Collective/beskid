---
title: "Runtime overview"
description: Runtime ownership, mandatory services, and execution boundaries.
---


## Purpose
Define runtime responsibilities required to execute lowered Beskid programs.
This document covers runtime ownership, mandatory services, and execution boundaries.

## Runtime components
### 1) Memory management
- **Go-style GC**: concurrent, precise, tri-color mark-and-sweep with write barriers (Phase B; see platform spec).
- **Phase A**: many fibers on an M:N scheduler with a **single GC mutator** thread.
- Short STW pauses only for root scanning and phase transitions (Phase B target).
- GC pacing similar to Go's `GOGC` (heap growth vs CPU tradeoff).

Normative detail: **[Memory and GC runtime contract](/platform-spec/execution/runtime/memory-and-gc-runtime-contract/)** and `/execution/memory/gc.md`.

### 2) Fibers and scheduling
- **Cooperative fibers** (`spawn`, `Fiber<T>`) — **[Fiber scheduler and stacks](/platform-spec/execution/runtime/fiber-scheduler-and-stacks/)**
- **Channels** for fiber communication — **[Channels and synchronization](/platform-spec/execution/runtime/channels-and-synchronization/)**
- **OS threads** for preemptive work — **[System.Threading](/platform-spec/core-library/concurrency/system-threading/)**
- Legacy v0.1 `rt_yield` stubs: see **[Scheduling and fibers](./scheduling-stub-v0-1.md)** (deprecated)

## 2) Core value representations
- `int` -> `i64` (Cranelift `i64`)
- `float` -> `f64`
- `bool` -> `b1` in CLIF; `i8` only at external ABI boundaries
- `string` -> `{ptr, len}` (no handle)
- `array` -> `{ptr, len, cap}` (no handle)
- `struct` -> pointer to heap-allocated layout

## 2.1) Heap object layout
- Heap objects start with a **type descriptor pointer**.
- Type descriptors include size, alignment, and pointer bitmap/offsets.
- Array buffers store element size + pointer map for GC scanning.

## 3) Runtime builtins
Required builtins (v0.1 baseline; concurrency builtins added in v0.2):
- `alloc(size) -> ptr`
- `str_new(ptr, len) -> {ptr, len}`
- `str_len(str) -> i64`
- `array_new(elem_size, len) -> {ptr, len, cap}`
- `panic(msg_ptr, msg_len) -> never`
- `fiber_*`, `channel_*`, `hub_*`, `mutex_*`, `wait_group_*` (v0.2 — see platform spec)

All builtins are declared via `cranelift_module::Module::declare_function` and called from CLIF.

## 4) Corelib boundary
- **Corelib** is Beskid code + runtime builtins.
- Low-level operations are implemented as host functions.
- Concurrency user API lives in **`corelib_concurrency`** (`Fiber`, `Channel`, `Hub`) — thin wrappers only.
- Corelib should not depend on compiler internals.
- Std-facing runtime/system operations cross through stable runtime ABI entrypoints.
- Platform-specific behavior (syscalls, OS API selection, blocking policy) is owned by runtime only.

## Runtime bundling policy
- Production AOT outputs bundle Beskid runtime components.
- Runtime bundling is part of backend architecture policy, not a userland feature toggle.
- JIT uses the same runtime ABI surface in-process for development-time execution.

## ABI rules
- Use Cranelift default calling convention for the host ISA.
- Complex types passed by pointer.
- Runtime builtins exposed to host use C ABI; internal runtime calls may use Beskid ABI with stack maps.

## Notes
- JIT and AOT share the same runtime ABI.
- AOT is the primary production execution path; JIT is a thin development-time runner.
- Runtime should be minimal to keep CLIF lowering straightforward.
- GC strategy is finalized to Go-style concurrent mark/sweep (no manual free); fiber Phase A runs before full parallel GC.
