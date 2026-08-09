## MODIFIED Requirements

### Requirement: Result type and predicates: Decision [D-CORE-PRIM-0140]
`Result<T,E>` SHALL be the canonical fallible Corelib enum with variants
`Ok(T)` and `Error(E)`. `IsOk()` and `IsError()` MUST report the active variant
accurately for every valid specialization. `Unit` MUST be a valid success type:
`Result<Unit,E>` construction, generic instantiation, discriminant layout,
matching, predicates, mapping, error propagation, ISLE lowering, JIT, and AOT
MUST follow the same single semantic path as other `Result<T,E>` values.
`Ok(Unit)` MUST NOT be encoded or exposed as an `Ok(bool)` compatibility
payload.

#### Scenario: Unit success constructs and matches
- **GIVEN** a function returning `Result<Unit, E>`
- **WHEN** it constructs `Result::Ok(Unit)` and a caller matches the result
- **THEN** the `Ok(Unit)` arm executes, `IsOk()` is true, and no boolean
  payload is required or observed

#### Scenario: Unit result preserves an error
- **GIVEN** a `Result<Unit, E>` containing `Error(error)`
- **WHEN** predicates, matching, or propagation inspect it
- **THEN** `IsError()` is true and the original typed error is preserved
