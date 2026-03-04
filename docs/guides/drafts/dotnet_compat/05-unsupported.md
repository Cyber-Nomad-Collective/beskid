# 05. Unsupported C# Features

This document lists C# features that are explicitly **not supported** by the transpiler in v0.1. Each entry includes the rationale and the error message the transpiler emits.

## 5.1 Error strategy

When the transpiler encounters an unsupported construct, it:

1. Emits a **compile-time error** with the construct's location.
2. Includes a **migration hint** suggesting the Beskid-idiomatic alternative.
3. Continues processing to report all errors in one pass (does not abort on first error).

Error format:
```
error[CS2BD-XXX]: unsupported C# construct `<name>`
  --> src/MyFile.cs:42:5
  |
  | hint: <migration guidance>
```

## 5.2 Language features

### Inheritance and OOP

| Feature | Error code | Migration hint |
|---|---|---|
| `abstract class` (as base) | CS2BD-100 | Use a `contract` and separate `type` declarations |
| Deep inheritance (> 2 levels) | CS2BD-101 | Flatten to composition; see §03 |
| `protected` members | CS2BD-102 | Make `pub` or restructure as a separate helper module |
| `internal` visibility | CS2BD-103 | Use `pub` or default private; Beskid has module-level visibility |
| `new` (method hiding) | CS2BD-104 | Rename method to avoid shadowing |
| Covariant/contravariant generics (`in`/`out`) | CS2BD-105 | Use concrete generic instantiation |
| Explicit interface implementation | CS2BD-106 | Rename conflicting methods |

### Type system

| Feature | Error code | Migration hint |
|---|---|---|
| `dynamic` | CS2BD-200 | Use concrete types or generics |
| `object` as a general type | CS2BD-201 | Use a specific type, generic, or enum |
| Implicit conversions (`implicit operator`) | CS2BD-202 | Add explicit conversion functions |
| Operator overloading (`operator +`) | CS2BD-203 | Define named methods (`Add`, `Multiply`, etc.) |
| `Span<T>` / `Memory<T>` | CS2BD-204 | Use `T[]` |
| `ref struct` | CS2BD-205 | Use standard `type` |
| `record` types | CS2BD-206 | Transpile as `type` with value equality (auto-supported in Beskid) |
| `nint` / `nuint` (native integers) | CS2BD-207 | Use `i64` |
| `decimal` | CS2BD-208 | Use `f64` with precision caveat comment |
| Multidimensional arrays (`int[,]`) | CS2BD-209 | Use jagged arrays `i32[][]` |
| Pointer types (`int*`, `void*`) | CS2BD-210 | Not applicable; Beskid manages memory via GC |
| `stackalloc` | CS2BD-211 | Use standard array allocation |

### Control flow and exceptions

| Feature | Error code | Migration hint |
|---|---|---|
| `try/catch/finally` | CS2BD-300 | Rewrite throwing methods to return `Result<T, E>`; use `?` for propagation |
| `throw` expression | CS2BD-301 | Return `Result::Error(...)` |
| `throw` in expression position | CS2BD-302 | Extract to statement; return `Result::Error(...)` |
| Exception filters (`when` in catch) | CS2BD-303 | Use `match` on `Result` with guards |
| `checked`/`unchecked` arithmetic | CS2BD-304 | Beskid arithmetic follows platform defaults |
| `goto` | CS2BD-305 | Restructure with loops and `break`/`continue` |
| `yield return` (iterators) | CS2BD-306 | Implement the `Iterator` contract manually |
| `lock` statement | CS2BD-307 | No concurrency primitives in v0.1 |

### Async and concurrency

| Feature | Error code | Migration hint |
|---|---|---|
| `async` / `await` | CS2BD-400 | Convert to synchronous code or use callbacks |
| `Task` / `Task<T>` | CS2BD-401 | Use `Result<T, E>` for fallible operations |
| `ValueTask<T>` | CS2BD-402 | Use synchronous return |
| `Parallel.ForEach` | CS2BD-403 | Use sequential `for` loop |
| `CancellationToken` | CS2BD-404 | Pass a `bool` flag or `Result`-based early exit |
| `Channel<T>` | CS2BD-405 | Not available in v0.1 |
| `SemaphoreSlim`, `Mutex` | CS2BD-406 | No concurrency primitives in v0.1 |

### Advanced language features

| Feature | Error code | Migration hint |
|---|---|---|
| `unsafe` blocks | CS2BD-500 | Not applicable; managed memory only |
| `fixed` statement | CS2BD-501 | Not applicable |
| `sizeof` | CS2BD-502 | Not available in v0.1 |
| `typeof` / `nameof` at runtime | CS2BD-503 | `nameof` can be inlined as a string literal; `typeof` has no equivalent |
| Reflection (`System.Reflection`) | CS2BD-504 | Use Beskid metaprogramming (source generators) |
| `Expression<T>` (expression trees) | CS2BD-505 | Use Beskid AST metaprogramming |
| Attributes with runtime semantics | CS2BD-506 | Only compile-time attributes (source generators) are supported |
| Preprocessor directives (`#if`, `#define`) | CS2BD-507 | Use Beskid build-time configuration or remove conditionals |
| `extern alias` | CS2BD-508 | Use Beskid `use ... as` aliasing |
| Top-level statements (C# 9+) | CS2BD-509 | Wrap in a `unit Main() { ... }` function |
| File-scoped types (`file class`) | CS2BD-510 | All Beskid types are module-scoped by default |
| `required` members (C# 11) | CS2BD-511 | All struct fields are required at construction in Beskid |
| Collection expressions (`[1, 2, 3]`) | CS2BD-512 | Use Beskid array literals directly |
| Primary constructors (C# 12) | CS2BD-513 | Expand to explicit fields and factory function |
| `init` accessors | CS2BD-514 | Beskid fields are set at construction and immutable by default |
| `with` expressions (records) | CS2BD-515 | Construct a new instance with modified fields |

### String features

| Feature | Error code | Migration hint |
|---|---|---|
| Format specifiers (`{value:F2}`) | CS2BD-600 | Use explicit formatting functions |
| `FormattableString` | CS2BD-601 | Use plain string interpolation |
| Raw string literals (`"""..."""`) | CS2BD-602 | Use standard string literals with escaping |
| UTF-8 string literals (`"text"u8`) | CS2BD-603 | Beskid strings are UTF-8 natively |

## 5.3 Partial support (emit warning, not error)

These features are partially supported. The transpiler emits a warning and produces best-effort output:

| Feature | Warning | Behavior |
|---|---|---|
| `float` | Widened to `f64` | Precision change; may affect equality comparisons |
| `short` / `ushort` | Widened to `i32` | Safe for arithmetic |
| Auto-properties with logic | Expanded to field + methods | May not preserve exact C# semantics |
| String format with simple specifiers | Dropped format specifier | Value is interpolated without formatting |
| `const` fields | Inlined as literals | Works for primitives; complex const expressions may fail |

## 5.4 Progressive support roadmap

Features are planned for future transpiler versions:

### v0.2
- `record` types (as value-equality `type` declarations)
- `yield return` (lowered to `Iterator` contract impl)
- `checked` arithmetic (via Beskid overflow-checking intrinsics)
- `decimal` (if Beskid adds a fixed-point type)

### v0.3
- `async`/`await` (if Beskid adds a coroutine or async model)
- `lock` / basic synchronization (if Beskid adds concurrency primitives)
- Operator overloading (if Beskid adds operator contracts)

### v0.4
- `Span<T>` / `Memory<T>` (if Beskid adds stack-scoped references)
- Expression trees (via Beskid metaprogramming AST)
