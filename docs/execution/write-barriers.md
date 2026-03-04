---
description: Write barrier insertion policy
---

# Write barrier insertion policy

## Purpose
Ensure Go-style concurrent GC remains correct during pointer writes.

## Barrier type
- **Insertion barrier** (Dijkstra-style).
- On pointer write, mark/gray the target before store completes.

## Insertion points
- Heap field stores (`obj.field = ptr`).
- Array element stores (`arr[i] = ptr`).
- Captured environment updates in closures.

## Lowering rule
- Emit a runtime builtin call: `gc_write_barrier(dst, value)`.
- Perform barrier **before** the store.

## Exclusions
- Stores of non-pointer values.
- Stack-only locals (no heap escape).

## Required metadata
- Pointer/non-pointer typing for each field.
- Escape analysis to distinguish stack vs heap objects.
