---
title: "Contracts (Explicit Interfaces)"
---


## Purpose
Contracts define behavior through explicit interface declarations.

Contract conformance is nominal in v0.1: a type satisfies a contract only when it explicitly declares that relationship.

## Declaration
```
contract Reader {
    Result<i32, Error> read(p: u8[]);
}
```

## Explicit conformance
```
type File : Reader {
    /* ... */
}

impl File {
    Result<i32, Error> read(p: u8[]) { ... }
}
```

`File` satisfies `Reader` because conformance is explicitly declared.

Example call:
```
Result<i32, Error> read_all(r: Reader) {
    return r.read([]);
}
```

## Usage
```
Result<i32, Error> copy(r: Reader, w: Writer) { ... }
```

Passing a concrete type where a contract is expected requires an explicit declaration:
```
type Socket : Reader, Writer {
    /* ... */
}

impl Socket {
    Result<i32, Error> read(p: u8[]) { ... }
    Result<i32, Error> write(p: u8[]) { ... }
}
```

## Composition
Contracts can embed other contracts:
```
contract Reader { Result<i32, Error> read(p: u8[]); }
contract Writer { Result<i32, Error> write(p: u8[]); }

contract ReadWriter {
    Reader
    Writer
}
```

Example:
```
Result<i32, Error> copy_all(rw: ReadWriter) { ... }
```

## Method sets
- Value methods: `type T : ContractA, ContractB { ... }` + `impl T { ReturnType method(...) { ... } }`
- `this` receiver is implicit inside methods and bound to the containing `impl T` type.
- Reference receiver modifiers are not part of v0.1 contract satisfaction rules.

A declared conformance is valid only if the type's available method set covers all required methods.

Example:
```
contract Size { i32 size(); }

type Buf : Size { i32 len }

impl Buf {
    i32 size() { return this.len; }
}
```

## Design guidelines
- Keep contracts small (1–3 methods) and compose them.
- Define contracts near consumers, not implementers.
- Avoid “empty contract” unless you truly need an `any`-like type.

## Decisions
- Associated types and generic constraints are not supported in v0.1.
- There is no explicit contract cast syntax in v0.1.
- There is no implicit (duck-typed) contract satisfaction in v0.1.
- Method conflicts in composed contracts are compile-time errors.

## Conflict example
```
contract A { i32 id(); }
contract B { string id(); }

contract AB {
    A
    B
}
// error: conflicting method id
```
