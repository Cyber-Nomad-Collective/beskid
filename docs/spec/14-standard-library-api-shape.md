# 14. Standard Library API Shape

This document defines the recommended API design shape for Beskid's standard library.

## 14.1 Design goals

1. Predictable naming and discoverability.
2. Minimal surface area for MVP.
3. Composable modules over monolithic APIs.
4. Stable contracts that can be backed by interop dispatch internally.

## 14.2 Namespace layout

Recommended top-level modules:
- `Std.Core` (core primitives and utilities)
- `Std.IO` (console and stream I/O)
- `Std.String` (string utilities)
- `Std.Collections` (arrays, maps, sets)
- `Std.Path` (path helpers)
- `Std.FS` (file-system operations)
- `Std.Time` (durations, clocks)
- `Std.Math` (numeric helpers)

For MVP, start with:
- `Std.IO`
- `Std.String`
- `Std.Array` or `Std.Collections`

## 14.3 API style rules

### Prefer verbs for operations
- `Std.IO.Print`
- `Std.IO.Println`
- `Std.String.Contains`

### Prefer nouns for types
- `StringBuilder`
- `Duration`
- `PathInfo`

### Keep signatures explicit and small
- Avoid hidden allocations in APIs that look cheap.
- Avoid broad `Any`-style parameters.

## 14.4 Error handling model

Two-tier model:
1. **Total APIs** for common operations where failure is impossible or rare.
2. **Result-based APIs** where errors are expected.

Example shape:
```beskid
pub enum IoError {
    NotFound,
    PermissionDenied,
    InvalidData,
    Other(string message),
}

pub enum Result<TValue, TError> {
    Ok(TValue value),
    Error(TError error),
}
```

## 14.5 Interop Boundary and Syscalls (Zero-Dependency)

To compete directly with low-level systems languages like Go and Rust, Beskid aims to provide a **zero-dependency deployment model**. 

By default, Beskid does not rely on a heavy runtime or a mandatory C standard library (`libc`) to perform Operating System interactions (like file I/O, networking, or memory mapping).

### The Cranelift `inline_asm` / Direct FFI approach
Because Cranelift does not natively expose a high-level `syscall` instruction across all targets, Beskid's lowering phase handles OS-level calls in one of two ways, determined at compile time:

1. **Standalone Mode (Go-like, Static Binaries):**
   Beskid compiler defines internal inline assembly snippets for standard architectures (e.g., `x86_64` Linux `syscall`). Standard library functions (like `Std.IO.Print`) are lowered directly into these assembly nodes in Cranelift. This results in single, statically linked executables with absolutely no dependency on `glibc` or `musl`.

2. **C-ABI Mode (Rust-like, Dynamic Binaries):**
   For platforms without stable syscall numbers (like Windows or macOS), the compiler lowers `std` OS interactions into standard `extern "C"` calls utilizing Cranelift's native C-ABI calling conventions. 

### Syntax for Low-Level FFI
Developers can define their own OS-level bindings without going through the `beskid_runtime`. The `[Extern]` attribute tells the compiler to emit direct C-ABI calls via Cranelift, bypassing any runtime indirection.

```beskid
[Extern(Abi: "C", Library: "libc")]
pub mod LibC {
    // Zero-cost direct FFI. No runtime overhead.
    pub i64 write(i32 fd, ref u8 buf, i64 count);
}
```

Guideline:
- never expose `__interop_*` in user docs.
- keep public `Std.*` signatures stable.
- allow backend rewrites (Syscall vs C-ABI) without breaking user code.

## 14.6 Versioning and compatibility

- `std` API changes should be additive in minor releases.
- Breaking rename/removal requires a migration note.
- New experimental modules should be prefixed or documented as unstable.

## 14.7 Suggested MVP module signatures

```beskid
pub mod std {
    pub mod IO {
        pub unit Print(string text);
        pub unit Println(string text);
    }

    pub mod String {
        pub i64 Len(string text);
        pub bool IsEmpty(string text);
    }

    pub mod Array {
        pub i64 Len<T>(T[] values);
        pub ArrayIter<T> Iterate<T>(T[] values);
    }

    // Zero-Cost Iterators (LINQ-style)
    pub mod Iterators {
        // Base contract for bounding, not for dynamic dispatch
        pub contract Iterator<T> {
            Option<T> Next(self: ref mut Self);
        }

        // Concrete iterators must explicitly declare conformance.
        // Example: impl ArrayIter<T>: Iterator<T> { ... }

        // Concrete generic iterators returned by extension-like methods
        pub type SelectIter<TIn, TOut, TSource> { ... }
        pub type WhereIter<T, TSource> { ... }

        // Example LINQ operations implemented on concrete types
        impl<TSource> TSource {
            pub SelectIter<T, TOut, TSource> Select<T, TOut>(
                self: TSource, 
                mapper: (T) -> TOut
            ) { ... }

            pub WhereIter<T, TSource> Where<T>(
                self: TSource, 
                predicate: (T) -> bool
            ) { ... }

            pub T[] ToList<T>(self: TSource) { ... }
        }
    }
}
```

## 14.8 Zero-Cost LINQ and Lambdas
To achieve optimal performance equivalent to C++ or Rust, Beskid's iterator pipeline does not use virtual interface dispatch (vtable) on `Next()` calls. 

Instead, methods like `.Select()` and `.Where()` wrap the previous iterator in a new, concrete generic `type` (e.g. `SelectIter<TIn, TOut, TSource>`). 
When a pipeline is executed, the compiler monomorphizes the exact chain of types. Lambdas provided to these methods (e.g. `u => u.Name`) are compiled into zero-cost anonymous closures, allowing the optimizer to fully inline the iteration and closure logic into the consuming `while` or `for` loop.

Example usage:
```beskid
let activeNames = users
    .Iterate()                // returns ArrayIter<User>
    .Where(u => u.IsActive)   // returns WhereIter<User, ArrayIter<User>>
    .Select(u => u.Name)      // returns SelectIter<User, string, WhereIter<...>>
    .ToList();                // forces execution and collects to string[]
```

Keep these wrappers thin and map to interop calls behind the scenes where appropriate.
