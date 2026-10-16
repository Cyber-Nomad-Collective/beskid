---
title: "Functions and methods"
description: "Functions, methods, contracts, and calls without nullable receivers."
tableOfContents: true
---

Functions do work. Methods attach behavior to types. Contracts document what callers may assume: read the platform spec before treating this page as law.

## Functions

Top-level and scoped functions declare parameters and return types (inference may fill gaps where allowed). Keep signatures honest at API edges: internals can be messier, but not `Option`-as-error-swallowing messier.

## Methods and receivers

Instance methods dispatch on nominal types per [method dispatch](/docs/standard/capabilities/language-meta--type-system--method-dispatch/). Possibly-absent receivers use `Option<T>` + `match`, not null checks.

## Contracts and effects

Public APIs often use **contracts** (interfaces) with documented effects: see [contracts](/docs/standard/capabilities/language-meta--contracts-and-effects--contracts/) and [error handling](/docs/standard/capabilities/language-meta--contracts-and-effects--error-handling/).

## Functions are values

A function type is written `(parameter types) => result`. A value of that type can be passed, stored in a field, returned, and called:

```beskid
i64 Apply(i64 v, (i64) => i64 f) {
    return f(v);
}

i64 Double(i64 x) {
    return x * 2;
}

i64 Main() {
    i64 offset = 10;
    i64 a = Apply(4, Double);
    i64 b = Apply(5, x => x + offset);
    return a + b;
}
```

What the compiler does with that:

- **Named functions** become values when you use them without calling them (`Apply(4, Double)`). Generic functions cannot be used this way; there is no single entry point to hand out.
- **Lambdas** are `x => expr`, `(i64 x) => expr`, or a block body `(i64 x) => { ... }`. Untyped parameters take their types from the position the lambda sits in: the callee's parameter, an annotated local, a field type, or a declared return type. With no such context you get **E1202**.
- **Calls through values** work on any expression of function type: a parameter, a local, a field (`handler.op(5)`), or the result of another call (`Make()(1)`). A function-typed local shadows any item with the same name.
- **Captures are copies** taken when the closure is created. A lambda may not capture a `mut` local or a native pointer: that is **E1233**. Copy the value into an immutable local first.
- **Allocation is decided by use.** A lambda bound to an immutable local, with an expression body, and only ever called is inlined at each call and allocates nothing. Pass it, store it, return it, or give it a block body, and it becomes a heap closure managed by the GC.

The normative rules are in [Lambdas and closures](/docs/standard/capabilities/language-meta--evaluation--lambdas-and-closures/).

## Callable documentation

`///` on functions may use `@arg` on parameters. Do not slap `@arg` on record fields because you were bored.

## Example sketch (illustrative)

```beskid
string Greet(string name) {
    return "hello " + name;
}
```

Exact syntax keywords evolve. Verify against spec if copy-paste fails parse.

## Next

[Control flow](/book/07-compiler-is-not-your-therapist/control-flow/)
