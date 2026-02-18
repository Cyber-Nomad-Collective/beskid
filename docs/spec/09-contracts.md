# 09. Contracts (Structural Interfaces)

## Purpose
Contracts define behavior. Any type that provides the required method signatures automatically satisfies the contract (no `implements`).

Contracts are structural: compatibility depends on method shape, not explicit declarations.

## Declaration
```
contract Reader {
    read(p: u8[]) -> Result<i32, Error>;
}
```

## Implicit satisfaction
```
type File { /* ... */ }

fn File.read(p: u8[]) -> Result<i32, Error> { ... }
```

`File` now satisfies `Reader`.

Example call:
```
fn read_all(r: Reader) -> Result<i32, Error> {
    return r.read([]);
}
```

## Usage
```
fn copy(r: Reader, w: Writer) -> Result<i32, Error> { ... }
```

## Composition
Contracts can embed other contracts:
```
contract Reader { read(p: u8[]) -> Result<i32, Error>; }
contract Writer { write(p: u8[]) -> Result<i32, Error>; }

contract ReadWriter {
    Reader
    Writer
}
```

Example:
```
fn copy_all(rw: ReadWriter) -> Result<i32, Error> { ... }
```

## Method sets
- Value methods: `fn T.method(...)`
- Reference methods: `fn ref T.method(...)` (when `ref mut` is introduced)

A type satisfies a contract if its available method set covers all required methods.

Example:
```
contract Size { fn size(self) -> i32; }

type Buf { len: i32 }
fn Buf.size(self: Buf) -> i32 { return self.len; }
```

## Design guidelines
- Keep contracts small (1–3 methods) and compose them.
- Define contracts near consumers, not implementers.
- Avoid “empty contract” unless you truly need an `any`-like type.

## Decisions
- Associated types and generic constraints are not supported in v0.1.
- There is no explicit contract cast syntax in v0.1.
- Method conflicts in composed contracts are compile-time errors.

## Conflict example
```
contract A { fn id() -> i32; }
contract B { fn id() -> string; }

contract AB {
    A
    B
}
// error: conflicting method id
```
