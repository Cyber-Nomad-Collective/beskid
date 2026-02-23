# 02. Types

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
```
let ok: bool = true;
let count: i32 = 42;
let big: i64 = 1_000_000;
let ratio: f64 = 3.14;
let letter: char = 'A';
let name: string = "Pecan";
let none: unit = ();
```

## Type Definitions (product types)
Use `type` to define structures:
```
type User {
    string name,
    i32 age,
}
```

Example construction and field access:
```
let u = User { name: "Ada", age: 37 };
let n = u.name;
```

## Generics (v0.1)
Allowed for functions and types:
```
T id<T>(x: T) { return x; }
```

Generic type usage:
```
type Option<T> { ... }
let x: Option<i32> = ...;
```

Example:
```
T first<T>(a: T, b: T) { return a; }
let v = first<i32>(1, 2);
```

## References
`ref T` is an explicit read-only reference type:
```
i32 len(s: ref string) { return s.len(); }
```

Example:
```
unit show(ref s: string) {
    println(s);
}
```

## Array types
`T[]` is a contiguous array of elements of type `T`.

Example:
```
i32 sum(values: i32[]) {
    let mut total = 0;
    for i in range(0, values.len()) { total = total + values[i]; }
    return total;
}
```

## Namespaces in types
Type paths use dots:
```
net.http.Client
```

Example:
```
let client: net.http.Client = net.http.Client::new();
```

## Option
```
enum Option<T> {
    Some(T),
    None,
}
```
`null` does not exist in the language.

Example:
```
Option<i32> maybe_len(s: string) {
    if s.len() > 0 { return Some(s.len()); }
    return None;
}
```

## Mutability
- Mutability is explicit. Bindings are immutable by default.
- `let x = 1;` immutable
- `let mut x = 1;` mutable
- `mut` applies to the binding (reassignment). Interior mutability is not modeled in v0.1; references are explicit via `ref`/`out`.

Example:
```
let x = 1;
let mut y = 1;
// x = 2; // error
y = 2;
```

## Equality
- `==` compares values structurally.
- `===` compares reference identity when references are involved.

Example:
```
let a = User { name: "Ada", age: 37 };
let b = User { name: "Ada", age: 37 };
let same_value = a == b; // true
```

## Assignments
- Assignment moves the value by default.
- Simple value types are `Copy` (no move; value is duplicated).

Example:
```
let a = User { name: "Ada", age: 37 };
let b = a; // a moved
// a.name; // error: use after move

let n = 1;
let m = n; // Copy
```
