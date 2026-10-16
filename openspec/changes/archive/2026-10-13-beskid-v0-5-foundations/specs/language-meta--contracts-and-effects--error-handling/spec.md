## ADDED Requirements

### Requirement: Scoped cleanup follows Result propagation
`use` SHALL require a bound type implementing `Disposable.Dispose() -> Result<unit, DisposeError>`. The bound resource MUST be lexically owned by the scoped binding and MUST NOT escape its scope. A `use` binding is legal only in a scope whose enclosing callable returns `Result<T, E>` and for which semantic analysis resolves exactly one explicit `DisposeError -> E` conversion; the identity conversion applies when `E` is `DisposeError`. The compiler MUST reject a non-`Result` enclosing scope, a missing conversion, or an ambiguous conversion at the `use` binding. This conversion is cleanup-specific and MUST NOT create a general implicit error conversion for postfix `?`.

On normal completion, `return`, postfix `?`, or any supported structured exit, lowering MUST invoke each active binding's `Dispose` exactly once in reverse declaration order. A postfix `?` error SHALL propagate unchanged only when every required `Dispose` returns `Result::Ok(unit)`; otherwise the first `Dispose` error encountered in reverse declaration order SHALL be converted to `E` using the statically resolved cleanup conversion and SHALL become the enclosing error result. Disposal results MUST NOT be discarded, panicked, or converted to an implicit exception.

**Stable ID:** `BSP-REQ-91BA42B54DE1`

#### Scenario: Nested use cleans in reverse order
- **GIVEN** nested scoped bindings `use A a = ...;` followed by `use B b = ...;`
- **WHEN** the enclosing scope exits through `return`
- **THEN** `b.Dispose()` executes once before `a.Dispose()` executes once

#### Scenario: Non-disposable binding is rejected
- **GIVEN** a `use` binding whose type does not implement `Disposable`
- **WHEN** semantic analysis completes
- **THEN** compilation fails at the binding with a disposable-contract diagnostic

#### Scenario: Dispose error takes precedence over postfix try error
- **GIVEN** a `use` scope exits through `operation?` with an error and its nearest active binding returns `Result::Error(disposeError)` from `Dispose`
- **WHEN** cleanup completes
- **THEN** the enclosing scope returns `Result::Error(disposeError)` rather than the error from `operation?`

#### Scenario: Incompatible enclosing error is rejected
- **GIVEN** a `use` binding in a callable returning `Result<T, DomainError>` with no explicit `DisposeError -> DomainError` cleanup conversion
- **WHEN** semantic analysis completes
- **THEN** compilation fails at the binding with an incompatible-cleanup-error diagnostic

#### Scenario: Non-Result scope is rejected
- **GIVEN** a `use` binding in a callable that does not return `Result<T, E>`
- **WHEN** semantic analysis completes
- **THEN** compilation fails at the binding before cleanup lowering
