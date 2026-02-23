# 09. Contracts (Structural Interfaces)

## Purpose
Contracts define behavior. Any type that provides the required method signatures automatically satisfies the contract (no `implements`).

Contracts are structural: compatibility depends on method shape, not explicit declarations.

## Declaration
```
contract Reader {
    Result<i32, Error> read(p: u8[]);
}
```

## Implicit satisfaction
```
type File { /* ... */ }

Result<i32, Error> File.read(p: u8[]) { ... }
```

`File` now satisfies `Reader`.

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
- Value methods: `ReturnType T.method(...)`
- Reference methods: `ReturnType ref T.method(...)` (when `ref mut` is introduced)

A type satisfies a contract if its available method set covers all required methods.

Example:
```
contract Size { i32 size(self); }

type Buf { i32 len }
i32 Buf.size(self: Buf) { return self.len; }
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
contract A { i32 id(); }
contract B { string id(); }

contract AB {
    A
    B
}
// error: conflicting method id
```
