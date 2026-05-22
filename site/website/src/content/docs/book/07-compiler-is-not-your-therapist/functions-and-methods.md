---
title: "Functions and methods"
description: Functions, methods, contracts, and calls without nullable receivers."
tableOfContents: true
---

Functions do work. Methods attach behavior to types. Contracts document what callers may assume—read the platform spec before treating this page as law.

## Functions

Top-level and scoped functions declare parameters and return types (inference may fill gaps where allowed). Keep signatures honest at API edges—internals can be messier, but not `Option`-as-error-swallowing messier.

## Methods and receivers

Instance methods dispatch on nominal types per [method dispatch](/platform-spec/language-meta/type-system/method-dispatch/). Possibly-absent receivers use `Option<T>` + `match`, not null checks.

## Contracts and effects

Public APIs often use **contracts** (interfaces) with documented effects—see [contracts](/platform-spec/language-meta/contracts-and-effects/contracts/) and [error handling](/platform-spec/language-meta/contracts-and-effects/error-handling/).

## Callable documentation

`///` on functions may use `@arg` on parameters. Do not slap `@arg` on record fields because you were bored.

## Example sketch (illustrative)

```beskid
string greet(string name) {
    return "hello " + name;
}
```

Exact syntax keywords evolve—verify against spec if copy-paste fails parse.

## Next

[Control flow](/book/07-compiler-is-not-your-therapist/control-flow/)
