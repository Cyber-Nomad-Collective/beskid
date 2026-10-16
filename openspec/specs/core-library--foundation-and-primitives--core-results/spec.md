<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Core.Results Specification

## Purpose

Canonical Result<T,E> error-handling primitives for fallible Beskid corelib operations.
## Requirements
### Requirement: Result type and predicates: Decision [D-CORE-PRIM-0140]
`Result<T,E>` SHALL be the canonical fallible Corelib enum with variants
`Ok(T)` and `Error(E)`. `IsOk()` and `IsError()` MUST report the active variant
accurately for every valid specialization. `Unit` MUST be a valid success type:
`Result<unit, E>` construction, generic instantiation, discriminant layout,
matching, predicates, mapping, error propagation, ISLE lowering, JIT, and AOT
MUST follow the same single semantic path as other `Result<T,E>` values.
`Ok(Unit)` MUST NOT be encoded or exposed as an `Ok(bool)` compatibility
payload.

#### Scenario: Unit success constructs and matches
- **GIVEN** a function returning `Result<unit, E>`
- **WHEN** it constructs `Result::Ok(Unit)` and a caller matches the result
- **THEN** the `Ok(Unit)` arm executes, `IsOk()` is true, and no boolean
  payload is required or observed

#### Scenario: Unit result preserves an error
- **GIVEN** a `Result<unit, E>` containing `Error(error)`
- **WHEN** predicates, matching, or propagation inspect it
- **THEN** `IsError()` is true and the original typed error is preserved

### Requirement: Result transformations and unwrapping: Decision [D-CORE-PRIM-0141]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `Unwrap()` and `UnwrapError()` MUST panic when called on the opposite variant; `UnwrapOr(default)` SHALL return the contained value or the supplied default. `Map` and `MapError` SHALL transform the success or error value while preserving the other variant.

**Stable ID:** `BSP-REQ-19D7A4C2E6F80B35`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Prelude availability: Decision [D-CORE-PRIM-0142]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> The `Core.Results` module MUST be `@tier(standard)` and MUST be available in the language prelude.

**Stable ID:** `BSP-REQ-C53E8A17B942D6F0`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

