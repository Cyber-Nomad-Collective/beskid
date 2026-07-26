<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Core.ErrorHandling Specification

## Purpose

Core.ErrorHandling provides prelude-bound panic and result-unwrapping primitives for explicit failure control flow.

## Requirements

### Requirement: Panic and Expect operations: Decision [D-CORE-PRIM-0200]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `Panic(string message)` SHALL raise a runtime panic carrying the supplied message. `Expect<T,E>(Result<T,E>, string message)` MUST return the contained `T` for an `Ok` result and MUST panic with the supplied message for an error result.

**Stable ID:** `BSP-REQ-71C4E9A203F856BD`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Try propagation and prelude availability: Decision [D-CORE-PRIM-0201]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `Try<T,E>(Result<T,E>)` MUST return the contained `T` when successful and MUST return the error early when unsuccessful, using the `?` operator or `try!` macro pattern. `Panic`, `Expect`, and `Try` MUST be classified `@tier(standard)` and included in the prelude.

**Stable ID:** `BSP-REQ-C8D1F604A2973EB5`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied
