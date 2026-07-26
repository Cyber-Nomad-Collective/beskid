<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Core.Results Specification

## Purpose

Canonical Result<T,E> error-handling primitives for fallible Beskid corelib operations.

## Requirements

### Requirement: Result type and predicates: Decision [D-CORE-PRIM-0140]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `Result<T,E>` SHALL be the canonical error-handling enum with variants `Ok(T)` and `Error(E)`. `IsOk()` and `IsError()` MUST report the active variant accurately, and all fallible corelib APIs MUST return `Result`.

**Stable ID:** `BSP-REQ-7A4C91E2F08B6D13`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

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
