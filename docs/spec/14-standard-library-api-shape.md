# 14. Standard Library API Shape

This document defines the recommended API design shape for Pecan's standard library.

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
```pecan
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

## 14.5 Interop boundary policy

Public std APIs should be pure Pecan-facing wrappers.
Interop hooks remain internal and unstable:
- `__interop_dispatch_unit`
- `__interop_dispatch_ptr`
- `__interop_dispatch_usize`

Guideline:
- never expose `__interop_*` in user docs,
- keep public `Std.*` signatures stable,
- allow backend rewrites without API breakage.

## 14.6 Versioning and compatibility

- `std` API changes should be additive in minor releases.
- Breaking rename/removal requires a migration note.
- New experimental modules should be prefixed or documented as unstable.

## 14.7 Suggested MVP module signatures

```pecan
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
    }
}
```

Keep these wrappers thin and map to interop calls behind the scenes.
