---
title: "Ownership preview"
description: What Beskid takes from ownership thinking without importing Rust's borrow checker wholesale.
tableOfContents: true
---

Rust's ownership story is brilliant **for Rust**. Beskid's story is: **GC + static rules + spawn capture checks**, enough discipline to avoid the worst footguns without forcing `<'a>` on business logic.

## What we kept (ideas, not syntax)

| Idea | Beskid expression |
| --- | --- |
| Aliasing matters | `mut` on bindings, parameters and receivers; `List` copies on assignment |
| Ownership transfer is explicit | `move`, only where a value crosses to another isolate |
| Cross-thread/fiber safety | Channels only; `StackReferenceEscapesSpawn` diagnostic |
| Boundaries are explicit | `extern`, manifests, ABI profiles |

## What we did not cargo-cult

- Move-only default for every value
- Lifetime parameters on every struct
- `unsafe` blocks in application code as a daily tool

The **compiler host** is Rust (`beskid_analysis`, `beskid_engine`, …) and uses Rust's ownership internally. Your Beskid sources target the **language memory model**, not `rustc`'s borrow checker.

## Ordinary code has no ownership rules

Two names can refer to the same value, and nothing is "consumed" by an assignment, a call or a return. You do not write `move` in ordinary code, and the compiler does not report use after move there:

```beskid
use Core.Collections.Array;

unit Main()
{
    u8[] a = Array.Empty<u8>();
    u8[] b = a;
    Array.Append<u8>(a, 1);
    Array.Append<u8>(b, 2);
    return;
}
```

Collections mutate in place (`items.Push(x);`), and a `List` is copied when you assign it or pass it to a parameter that is not `mut`, so two `List` names never share storage. See [Generic collections](/book/07a-generics-write-it-once/generic-collections/).

## Move applies where a value crosses an isolate

Ownership matters in one place: when a value leaves for another isolate. A **crossing** is the capture list of a `Scope.Spawn` or `Parallel.Scope` task, the value sent through a `Port<T>`, a pipeline stage hand-over, or a step of `.Parallel()`. There the value is handed over by pointer, without a copy, which is only safe if the sender stops using it. So the operand is written `move x`, and the compiler consumes it:

```beskid
use Core.Parallel.Port;
use Core.Results;

unit Hand(Port<u8[]> output, u8[] block)
{
    match output.Send(move block)
    {
        Result::Ok(_) => { },
        Result::Error(_) => { },
    };
    return;
}
```

Reading `block` after the `Send` is E1234 ("moved here" on the `move`). The related rules, all from the `v067-move-at-isolate-boundary` change:

| Mistake | Code | Help |
| --- | --- | --- |
| `move x` outside a crossing | E1239 | remove `move`; it applies only when a value crosses to another isolate |
| A crossing operand that needs `move` and has none | E1242 | write `move <name>` |
| A crossing operand that is a place read such as `xs[i]` or `x.f` | E1241 | copy the value first |
| A `move` in a loop with no reassignment before the next round | E1240 | reassign the binding before the next iteration |
| `move x.f` on a field with no canonical empty value | E1243 | use `exchange(x.f, v)` |

`move x.f` takes a field out of its owner for a crossing and leaves the canonical empty value behind (`Option::None`, an empty array, an empty list). `exchange(place, value)` stores a new value and returns the old one, with no `move`.

## Closures and captures

Closures capture environment values; the compiler roots captures for **GC** when lowering `spawn`. If a capture would let stack memory outlive its frame across fibers, you get a diagnostic, not a silent segfault gift basket ([Fibers and spawn semantic rules](/docs/standard/capabilities/language-meta--evaluation--fibers-and-spawn/)).

## When you need Rust-level control

Put it behind **`extern`** / native libraries with a documented ABI profile, or contribute to `compiler/crates/`. Do not demand `unsafe` in Beskid because C# had `unsafe` and nobody learned anyway.

## Standard reference (informative)

[Memory and references](/docs/standard/capabilities/language-meta--memory-model--memory-and-references/)

## Next

[Unsafe and extern preview](/book/10-memory-without-billion-dollar-mistake/unsafe-and-extern-preview/)
