---
title: "Types"
---


## Primitive Types
`bool`, `i32`, `i64`, `u8`, `f64`, `char`, `string`, `unit` (`()`)

### Primitive type meanings
- `bool`: logical true/false.
- `i32`: 32-bit signed integer (default integer literal type).
- `i64`: 64-bit signed integer for large ranges.
- `u8`: 8-bit unsigned integer (byte).
- `f64`: 64-bit floating-point (IEEE 754).
- `char`: single Unicode scalar value.
- `string`: UTF-8 string.
- `unit` (`()`): empty value used for no-result returns.

Example:
```beskid
bool ok = true;
i32 count = 42;
i64 big = 1_000_000;
f64 ratio = 3.14;
char letter = 'A';
string name = "Beskid";
unit none = ();
```

## Type Definitions (product types)
Use `type` to define structures:
```beskid
type User {
    string name,
    i32 age,
}
```

Example construction and field access:
```beskid
let u = User { name: "Ada", age: 37 };
let n = u.name;
```

## Generics (v0.1)
Allowed for functions and types:
```beskid
T id<T>(T x) { return x; }
```

Generic type usage:
```beskid
type Option<T> { ... }
Option<i32> x = ...;
```

Example:
```beskid
T first<T>(T a, T b) { return a; }
let v = first<i32>(1, 2);
```

## Function types and lambdas
Function types use arrow syntax:
```beskid
(T1, T2) -> TOut
```

Examples:
```beskid
type Predicate = (i32) -> bool;
type Mapper<TIn, TOut> = (TIn) -> TOut;
```

Lambda expressions are first-class values assignable to compatible function types.

### Closure constraints (v0.1)
- Detailed closure/capture semantics are defined in `docs/spec/lambdas-and-closures.md`.
- This chapter defines function type syntax only.

## References
`ref T` is an explicit read-only reference type:
```beskid
i32 len(ref string s) { return s.len(); }
```

Example:
```beskid
unit show(ref string s) {
    println(s);
}
```

## Array types
`T[]` is a contiguous array of elements of type `T`.

Example:
```beskid
i32 sum(i32[] values) {
    i32 mut total = 0;
    for i in range(0, values.len()) { total = total + values[i]; }
    return total;
}
```

## Namespaces in types
Type paths use dots:
```beskid
net.http.Client
```

Example:
```beskid
net.http.Client client = net.http.Client::new();
```

## Option
```beskid
enum Option<T> {
    Some(T),
    None,
}
```
`null` does not exist in the language.

Example:
```beskid
Option<i32> maybe_len(string s) {
    if s.len() > 0 { return Some(s.len()); }
    return None;
}
```

## Mutability
- Mutability is explicit. Bindings are immutable by default.
- `let x = 1;` immutable (inferred)
- `i32 mut x = 1;` mutable (typed)
- `mut` applies to the binding (reassignment). Interior mutability is not modeled in v0.1; references are explicit via `ref`/`out`.

Example:
```beskid
let x = 1;
i32 mut y = 1;
// x = 2; // error
y = 2;
```

## Equality
- `==` compares values structurally.
- `===` compares reference identity when references are involved.

Example:
```beskid
let a = User { name: "Ada", age: 37 };
let b = User { name: "Ada", age: 37 };
let same_value = a == b; // true
```

## Assignments
- Assignment moves the value by default.
- Simple value types are `Copy` (no move; value is duplicated).

Example:
```beskid
let a = User { name: "Ada", age: 37 };
let b = a; // a moved
// a.name; // error: use after move

let n = 1;
let m = n; // Copy
```
