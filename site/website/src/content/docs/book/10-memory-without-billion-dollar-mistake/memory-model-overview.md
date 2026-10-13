---
title: "Memory model overview"
description: How Beskid splits stack locals, GC heap objects, references, and cross-fiber sharing.
tableOfContents: true
---

Beskid memory law answers three questions without hand-waving:

1. Where do **locals** live?
2. What is **heap** and who collects it?
3. What may **fibers** share without data races cosplaying as features?

Normative article: [Memory and references](/docs/standard/capabilities/language-meta--memory-model--memory-and-references/). Collector algorithms defer to [Memory and GC runtime contract](/docs/standard/capabilities/execution--runtime--memory-and-gc-runtime-contract/) (the `/execution/` tree is a legacy bridge; platform-spec is authoritative).

## Locals and mutability

- Locals live in **function activation records** unless captured by closures ([Lambdas and closures](/docs/standard/capabilities/language-meta--evaluation--lambdas-and-closures/)).
- Reassignment requires prefix **`mut`** (`mut i64 x = …`, `let mut x = …`) where the reference compiler enforces it (**E1214** when you cheat).

## Heap and GC

Reference types and arrays live on the **GC-managed heap**. The runtime uses a concurrent collector story (tri-color heap work lives under `abfall` in the workspace; see execution ADRs like [ABFALL tri-color heap](/docs/standard/capabilities/execution--runtime--memory-and-gc-runtime-contract/)).

## Parameter passing

- Parameters pass **by value** in v0.1; use return values or heap/`T[]` handles when callers need updated state.
- Cross-fiber sharing of mutable state goes through **channels**, not shared stacks ([Fibers and spawn](/docs/standard/capabilities/language-meta--evaluation--fibers-and-spawn/)).

```mermaid
flowchart TB
  accTitle: Memory model areas
  accDescr: Stack activations and the GC heap hold values, fibers are scheduled cooperatively, and channels carry cross-fiber payloads.
  stack[Stack activations: locals, spans]
  heap[GC heap: objects, arrays]
  fibers[Fibers: cooperative scheduling]
  channels[Channels: cross-fiber payloads]
  stack --> heap
  fibers --> channels
  heap --> fibers
```

## Domain map

- [Memory model area](/docs/standard/capabilities/taxonomy--language-meta--memory-model/)
- [Execution runtime](/docs/standard/capabilities/taxonomy--execution--runtime/)

## Next

[Stack, heap, and spans](/book/10-memory-without-billion-dollar-mistake/stack-heap-and-spans/)
