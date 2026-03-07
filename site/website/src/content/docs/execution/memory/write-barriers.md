---
title: "Write barrier insertion policy"
description: Write barrier insertion policy
---


## Purpose
Ensure Go-style concurrent GC remains correct during pointer writes.

## Ownership
- Barrier semantics are owned by runtime memory model policy.
- Lowering is responsible for inserting barrier calls at required write sites.
- Backend choice (JIT/AOT) must not change barrier insertion semantics.

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

## Non-goals
- Defining GC pacing or collector phase transitions.
- Defining language-level mutability or borrow semantics.
