---
title: "Stack, heap, and spans"
description: Activation records, GC objects, and where span metadata shows up in the compiler story.
tableOfContents: true
---

Not everything is an object. Not everything should be.

## Stack (activations)

Function entry allocates an **activation record**: parameters, locals, temporaries. Returns pop the frame. This is the fast path—until you capture locals in a closure or `spawn` and the compiler has opinions.

Fiber stacks are **separate** from the C#-style "thread pool fantasy"—see [Fiber scheduler and stacks](/platform-spec/execution/runtime/fiber-scheduler-and-stacks/).

## Heap (GC)

Objects with identity, arrays, and most shared data live on the **heap**. The collector traces from roots including fiber handles and channel buffers per runtime contract.

You do not `free()` in Beskid. You **stop leaking references** like a professional.

## Spans (compiler-facing)

In platform-spec and compiler crates you will see **`Span`** / source locations (`Spanned<T>` in diagnostics)—metadata for **where** in source, not a Rust `Span<T>` slice type for users. When reading [front-end](/platform-spec/compiler/front-end/) docs, "span" usually means **syntactic range**, not stackalloc.

| Term in docs | Meaning |
| --- | --- |
| Source span | Start/end offsets for diagnostics |
| Stack frame | Runtime activation record |
| Heap object | GC-traced allocation |

## Arrays

Arrays are a primitive Beskid type with unified length semantics where the type system allows—see [Types](/platform-spec/language-meta/type-system/types/) and corelib packages for surface API.

## Next

[Ownership preview](/book/10-memory-without-billion-dollar-mistake/ownership-preview/)
