## Why

`Core.Args` still describes the retired `__args_all` builtin. ABI-v5 instead
needs the selected private count/get service pair and a fail-closed execution
contract so process arguments cannot become an ambient capability.

## What Changes

- **MODIFY** `core-library--foundation-and-primitives--core-args` to replace
  `__args_all` with exactly `__args_count() -> i64` and
  `__args_get(i64) -> string`.
- Limit both private services to byte-identical canonical
  `Core/Args/Args.bd`, require managed retained return values and defined
  bounds behavior, and deny copied, symlinked, altered, and user-authored
  sources.
- Define AOT `argv[0]` capture, Windows UTF-16 replacement conversion,
  explicit JIT argument injection, stable non-executable denial, and
  manifest-owned three-target adapter provenance.

## Compatibility and migration

`__args_all` is removed from the ABI contract; there is no compatibility
alias, raw import, ambient process-vector, or empty-vector fallback. Public
`Core.Args.All`, `Count`, and `Get` remain the Corelib API, but their ABI
implementation changes to the count/get pair. No public standard URL or
legacy URL changes.

## Rollback and staged deployment

This contract is staged before compiler and runtime implementation. If a
target adapter cannot meet it, that target remains unsupported for this
capability; it MUST NOT publish a fallback. Reverting a later implementation
must restore the prior release as a unit rather than reintroducing
`__args_all` or an undocumented compatibility route.

## Impact

Spec-only in this change. Follow-on work covers Corelib source authority, ABI
manifest generation, native adapters, AOT/JIT entry APIs, and target-matrix
conformance tests.
