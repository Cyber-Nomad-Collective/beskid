---
title: "Concurrent GC"
description: Beskid concurrent GC specification
---

> **Non-normative (legacy bridge).** This page is transitional documentation from the pre-`platform-spec` tree. **Canonical** execution contracts: [/platform-spec/execution/](/platform-spec/execution/). Full path mapping: [/platform-spec/legacy-spec-mapping/](/platform-spec/legacy-spec-mapping/).

> **Normative platform spec:** [Memory and GC runtime contract](/platform-spec/execution/runtime/memory-and-gc-runtime-contract/). Fiber **Phase A** (single mutator) vs **Phase B** (parallel mutators) is defined there and in [Fiber scheduler and stacks](/platform-spec/execution/runtime/fiber-scheduler-and-stacks/).

## Decision summary
Beskid adopts a concurrent garbage collector:
- **Concurrent, precise, tri-color mark-and-sweep**
- **Write barriers** on pointer writes
- **Short STW pauses** only for root scanning and phase transitions
- **Heap-growth pacing** (heap growth vs CPU tradeoff)

This decision supersedes earlier alternatives (reference counting, conservative GC, region allocation).

The current runtime implementation is backed by the vendored `abfall` tri-color mark-and-sweep heap. Generated allocation calls enter through `alloc`, which creates descriptor-backed Beskid payloads with `abfall::Heap::allocate_beskid`.

## Goals
- Low latency with bounded STW pauses.
- Precise pointer tracing (no conservative scanning).
- Works with both JIT and AOT builds.

## Object model requirements
- Heap objects carry **type descriptors** with pointer layout.
- All allocations use runtime allocators that register metadata.
- Stack frames have **stack maps** describing live pointer locations.

## Root set
- **Stacks**: precise stack maps emitted by compiler.
- **Globals**: static roots registered at module init.
- **Registers**: captured at safepoints.

## Tri-color marking (concurrent)
- **White**: unvisited
- **Gray**: discovered, not scanned
- **Black**: scanned

Mutator runs concurrently with GC. Write barriers prevent black objects from pointing to white ones during marking.

## Write barrier policy
- **Insertion barrier** (Dijkstra-style):
  - On pointer write, ensure the target is marked or gray.
- Applied to:
  - pointer field stores
  - array element stores
  - captured pointer updates

The runtime export `gc_write_barrier(parent, child)` is the canonical barrier hook for generated pointer stores.

## Runtime diagnostics and controls
The runtime exports a small GC state surface for generated code, tests, and host tooling:

- `gc_bytes_allocated`
- `gc_object_count`
- `gc_phase` (`0 = Idle`, `1 = Marking`, `2 = Sweeping`)
- `gc_collect`
- `gc_collect_if_needed`
- `gc_external_root_count`

Rust host code should prefer `beskid_runtime::runtime::GcSnapshot` when it needs a displayable heap snapshot or advanced collection controls.

## GC phases
1. **Sweep (concurrent)**
   - Reclaim free spans.
2. **Off**
   - Normal allocation.
3. **Mark (concurrent)**
   - Root scan (short STW)
   - Concurrent marking
   - Mark termination (short STW)

## Safepoints
- Implicit at function calls and loop backedges.
- Optional explicit safepoint calls inserted by lowering.

## Pacing / tuning
- Default target keeps collection proportional to heap growth.
- Expose configuration via runtime env/flags.

## Required compiler support
- **Stack maps** for each function.
- **Heap object descriptors** for each type.
- **Write barrier insertion** during CLIF lowering.

## Conflicts resolved
Previous runtime spec proposed multiple alternatives:
- **Reference counting**: rejected (cycles and no tracing semantics).
- **Conservative GC**: rejected (not precise enough for Beskid's typed object descriptors).
- **Region allocator**: rejected (no automatic memory reclaim).

All runtime docs must follow this GC decision.

