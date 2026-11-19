---
title: "Memory model overview"
description: How Beskid splits stack locals, GC heap objects, references, and cross-fiber sharing.
tableOfContents: true
---

Beskid memory law answers three questions without hand-waving:

1. Where do **locals** live?
2. What is **heap** and who collects it?
3. What may **fibers** share without data races cosplaying as features?

Normative article: [memory and references](/platform-spec/language-meta/memory-model/memory-and-references/). Collector algorithms defer to the [memory and GC runtime contract](/platform-spec/execution/runtime/memory-and-gc-runtime-contract/); the `/execution/` tree is a legacy bridge, platform-spec is authoritative.

## Locals and mutability

- Locals live in **function activation records** unless captured by closures ([lambdas and closures](/platform-spec/language-meta/evaluation/lambdas-and-closures/)).
- Reassignment requires the prefix **`mut`** (`mut i64 x = …`, `let mut x = …`), enforced by the reference compiler as **E1214** when you cheat.

## Heap and GC

Reference types and arrays live on the **GC-managed heap**. The runtime uses a concurrent collector story; the tri-color heap work lives under `abfall` in the workspace. See execution ADRs like [ABFALL tri-color heap](/platform-spec/execution/runtime/memory-and-gc-runtime-contract/adr/0006-abfall-tri-color-heap/).

## Parameter passing

- Parameters pass **by value**. When a caller needs the updated state, return it. Arrays need a closer look, because a `T[]` value is a handle: an element write through it (`xs[0] = 5;`) shows up in every handle to the same array, the caller's included. A length change does not. `Array.Append` or `Array.RemoveLast` through one handle never changes what another handle sees; when someone else can still read the array, the handle that grows or shrinks it gets its own copy ([Memory and references](/platform-spec/language-meta/memory-model/memory-and-references/)). `List<T>` is not an array and keeps its shared header with its own copy rules ([Core collections](/platform-spec/core-library/foundation-and-primitives/core-collections/)).
- Cross-fiber sharing of mutable state goes through **channels**, not shared stacks ([fibers and spawn](/platform-spec/language-meta/evaluation/fibers-and-spawn/)).

See also the [memory model area](/platform-spec/language-meta/memory-model/) and [execution runtime](/platform-spec/execution/runtime/) for the full normative tree.
