<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Core.Environment Specification

## Purpose

Provides environment-variable access and mutation with typed permission and key errors.

## Requirements

### Requirement: Environment access and enumeration: Decision [D-CORE-PRIM-0150]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `Get(string key)` SHALL read through the `__env_get` builtin and return `Option<string>`, while `All()` MUST return the complete environment as `Map<string,string>`. Missing keys SHALL be represented by `None`, not a panic.

**Stable ID:** `BSP-REQ-4E91B7C2A6D0F835`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Environment mutation and errors: Decision [D-CORE-PRIM-0151]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `Set` and `Unset` MUST delegate to `__env_set` and `__env_unset` respectively and return `Result<Unit, EnvironmentError>`. `EnvironmentError` SHALL include `KeyNotFound(string)`, `PermissionDenied(string)`, and `InvalidKey(string)` variants; mutation failures MUST NOT be silently ignored.

**Stable ID:** `BSP-REQ-A83F1D6C0E9274B5`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Supported environment tier: Decision [D-CORE-PRIM-0152]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `Core.Environment` and its `Core.Environment.EnvironmentError` submodule MUST be exposed at `@tier(supported)`.

**Stable ID:** `BSP-REQ-2F6A9C1E4D8B7035`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied
