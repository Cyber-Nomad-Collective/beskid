---
description: Pecan GC specification (Go-style)
---

# Pecan GC specification (Go-style)

## Decision summary
Pecan adopts a Go-style garbage collector:
- **Concurrent, precise, tri-color mark-and-sweep**
- **Write barriers** on pointer writes
- **Short STW pauses** only for root scanning and phase transitions
- **Pacing** similar to Go’s `GOGC` (heap growth vs CPU tradeoff)

This decision supersedes earlier alternatives (reference counting, conservative GC, region allocation).

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
- Default target similar to Go’s `GOGC=100` (heap growth 100%).
- Expose configuration via runtime env/flags.

## Required compiler support
- **Stack maps** for each function.
- **Heap object descriptors** for each type.
- **Write barrier insertion** during CLIF lowering.

## Conflicts resolved
Previous runtime spec proposed multiple alternatives:
- **Reference counting**: rejected (cycles + not Go-like).
- **Conservative GC**: rejected (not precise, diverges from Go behavior).
- **Region allocator**: rejected (no automatic memory reclaim).

All runtime docs must follow this GC decision.

## References
- Go GC guide (cycle and latency): https://go.dev/doc/gc-guide
- Go GC runtime overview: https://go.dev/src/runtime/mgc.go
