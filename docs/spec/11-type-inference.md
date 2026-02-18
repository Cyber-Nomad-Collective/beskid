# 11. Type Inference

## Goals
- Keep inference local and predictable.
- Require explicit types on public APIs.

Inference never crosses module boundaries. Public signatures are always explicit.

## Inference rules (v0.1)
- `let x = 1;` infers `i32`.
- Function parameters require explicit types.
- Public function return types must be explicit.
- Local/private functions may infer return type if all `return` paths are consistent.

Examples:
```
let count = 1; // i32

fn add(a: i32, b: i32) -> i32 { return a + b; }

fn local_sum(a: i32, b: i32) { // private; return type inferred
    return a + b;
}
```

## Decisions
- Generic function inference is planned for a future version (not in v0.1).

## Example
```
fn id<T>(x: T) -> T { return x; }

let a = id<i32>(5); // required in v0.1
```
