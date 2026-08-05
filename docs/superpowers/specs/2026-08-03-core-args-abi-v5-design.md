# Core.Args ABI-v5 design

## Decision

Foundation uses two private Corelib services:

- `__args_count() -> i64`
- `__args_get(i64) -> string`

`__args_all` is not an ABI entry point. `Core.Args.All()` constructs its array by
calling the two services and copies every returned string into managed storage.

## Authority and data contract

Only byte-identical Foundation `Core/Args/Args.bd` at the canonical source path
receives the two imports. User code, copied sources, symlinks, altered sources,
and every other Corelib source receive no Args import. The services are manifest
owned, target-specific ABI-v5 adapters; they are not user-callable runtime
intrinsics and are never supplied by ISLE, JIT host registration, or Rust
runtime fallback.

`__args_count` includes executable `argv[0]`. `__args_get` returns a managed
UTF-8 string for an index in `[0, count)` and reports a stable bounds failure
outside it. Each value returned to Foundation is independent of any native
scratch buffer, so `All()` may retain all elements safely. Invalid native input
uses the manifest-defined replacement/diagnostic policy consistently on every
target; it is never silently reinterpreted as raw bytes.

## Execution semantics

Native AOT executables capture process arguments through a manifest-owned entry
adapter before Beskid `Main` executes. Linux, macOS, and Windows each implement
the same ordered vector and include `argv[0]`; Windows converts its native
UTF-16 command line into the defined UTF-8 representation.

Library/shared outputs do not fabricate a process vector and reject use of
`Core.Args` with a stable diagnostic. JIT has no implicit host-process
inheritance: its public execution API explicitly receives an argument vector
before code using `Core.Args` can run. It may not use an ambient global or an
empty-vector fallback.

## Implementation boundaries

1. OpenSpec changes Core.Args requirements from `__args_all` to this pair and
   adds scenarios for authority, target behavior, bounds, ownership, and JIT.
2. The runtime manifest and generated ABI artifacts declare per-target adapter
   bindings. Generator validation rejects missing, duplicate, mismatched, or
   undeclared bindings.
3. The existing source-scoped Corelib-service capability carries the exact two
   signatures into `CodegenInput` and verified CLIF. It does not gain a second
   lowering path.
4. Native target adapters, AOT entry handling, and the JIT API implement the
   specified semantics. Legacy ABI-v3 routers remain untouched until direct
   ABI-v5 coverage makes their deletion safe.

## Verification

- OpenSpec validation and regenerated catalog.
- Manifest parser/generator freshness and negative binding tests.
- Exact-source allow/deny tests, including copied, symlinked, and altered
  `Args.bd`.
- Syntax-to-ISLE verified-CLIF tests for both services and ordinary-user denial.
- Linux, macOS, and Windows installed debug/release kit tests for ordering,
  `argv[0]`, Unicode conversion, bounds, and provenance.
- AOT executable and explicitly-defined JIT behavior tests.
- Full Core.Args then complete Corelib and release gates.
