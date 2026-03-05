---
title: "Type Inference"
---


## Goals
- Keep inference local and predictable.
- Require explicit types on public APIs.

Inference never crosses module boundaries. Public signatures are always explicit.

## Inference rules (v0.1)
- `let x = 1;` infers `i32`.
- Function parameters require explicit types.
- Function return types must be explicit.
- Use `unit` for functions that do not return a value.
- Lambda inference behavior is defined in `docs/spec/lambdas-and-closures.md`.
- `for item in expr` infers `item` from iterator `Next() -> Option<T>` item type.

Examples:
```
let count = 1; // i32

i32 add(a: i32, b: i32) { return a + b; }

i32 local_sum(a: i32, b: i32) { // private; return type explicit
    return a + b;
}
```

## Decisions
- Generic function inference is planned for a future version (not in v0.1).

## Example
```
T id<T>(x: T) { return x; }

let a = id<i32>(5); // required in v0.1
```
