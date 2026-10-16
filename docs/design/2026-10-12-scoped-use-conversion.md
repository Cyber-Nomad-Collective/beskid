# Scoped `use` cleanup conversion lookup

Date: 2026-10-12. Scope: `beskid_queries` scoped-cleanup fact (E1230).

## Problem

The corelib Network tests passed as seven separate targets, but failed when
they were merged into one suite target. The error was
`scoped use rejected: InvalidConversion` on the only scoped `use` in the
network tests:

```beskid
Result<unit, NetworkError> ScopedListener(SocketAddress address) {
    use TcpListener listener = TcpListener.Bind(address, 1_i64)?;
    return Result::Ok(());
}
```

## Root cause

`Dispose()` returns `Result<unit, DisposeError>`. The enclosing callable
returns `NetworkError`, so the compiler must find exactly one visible
`[CleanupConversion]` function `NetworkError F(DisposeError)`.
`cleanup_conversion_candidates`
(`compiler/crates/beskid_queries/src/semantic_contract/cleanup/scope_lookup.rs`)
checks every `[CleanupConversion]` function in the unit and its imported
units. Before the fix, any visible conversion whose signature did not match
the pair `(DisposeError -> enclosing error)` set the `invalid` flag. That
included its return type. The flag rejected the `use` with
`InvalidConversion` before the compiler counted the candidates.

`ScopeTests.bd` alone imports only `Network.Errors`. That module has one
conversion, `NetworkError FromDisposeError(DisposeError)`. The merged suite
also contains `TcpTests.bd`, which has `use Core.IO;`, so
`Core.IO.IoError FromDisposeError(DisposeError)` also became visible. That
conversion is correct, but it targets `IoError`. The lookup treated it as an
invalid conversion for a `NetworkError` site. The cause was not unit order,
fact keys, duplicate names, or generic specialization. A conversion that is
correct but targets a different error type caused the rejection.

## Rule

A cleanup conversion is a conversion *to* a specific error type. It applies
only to sites whose enclosing error type is that type.

- In Rust, `?` calls `From<E>` for the function's error type only. An
  `impl From<DisposeError> for IoError` that is in scope has no effect on a
  function that returns `Result<_, NetworkError>`. Rust checks a malformed
  `impl` where it is declared, not at unrelated call sites.
- C# `using` does not convert errors. `Dispose` exceptions propagate as they
  are, so unrelated conversions cannot affect a `using` site.
- Swift `throws(E)` and Kotlin `use {}` follow the same pattern: the target
  type selects the conversion.

The fixed lookup applies this rule:

1. Ignore a `[CleanupConversion]` function unless its return type is the
   enclosing error type of this `use`. It is not a candidate and does not
   make the `use` invalid.
2. A function that targets the enclosing error must be non-generic, take
   exactly one parameter, and take `DisposeError` as that parameter. If it
   does not, the `use` gets `InvalidConversion`. A malformed conversion for
   this target still fails closed.
3. Zero valid candidates gives `MissingConversion`. Two or more give
   `AmbiguousConversion`. Exactly one gives the conversion.

Ignoring a conversion never accepts a program that the old rule rejected for
any reason other than the false `InvalidConversion`. If no conversion
targets the enclosing error, the result is still `MissingConversion`.

## Known gap

A malformed `[CleanupConversion]` whose return type does not match any
enclosing error is now not reported anywhere. This includes generic return
types such as `T F<T>(DisposeError)`. The right place for that check is a
declaration-site legality check on the attributed function. Rust reports
malformed `impl` blocks in the same way. This fix does not include that
check. It is a separate follow-up.

## Changes

- `scope_lookup.rs`: `cleanup_conversion_candidates` filters by target type
  first. It then checks the shape of each conversion that targets the
  enclosing error.
- Regression test
  `conversions_to_other_error_types_do_not_reject_an_unrelated_scoped_use`
  in `compiler/crates/beskid_queries/tests/semantic_facts/scoped_cleanup.rs`.
- The seven network test files are merged into `network/NetworkSuite.bd`,
  which is target `NetworkSuite` in `corelib_tests.bproj`.
