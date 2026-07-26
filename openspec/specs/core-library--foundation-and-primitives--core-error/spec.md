<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Core.Error Specification

## Purpose

Core.Error is the standard prelude error hub that provides the canonical error interface and unifies corelib failures.

## Requirements

### Requirement: Canonical error interface and variants: Decision [D-CORE-PRIM-0190]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `Core.Error` SHALL re-export `Core.Error.Error` as the canonical error interface and expose the `Error` enum variants `Syscall(i64)`, `Io(string)`, `Encoding(string)`, `Parse(string)`, and `Other(string)`. All corelib error types MUST converge on this hub for top-level catch patterns.

**Stable ID:** `BSP-REQ-6D3A8F10C2E947B1`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Prelude availability and tier: Decision [D-CORE-PRIM-0191]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `Core.Error` MUST be classified `@tier(standard)` and MUST be included in the language prelude so conforming programs can apply top-level error handling without an explicit module import.

**Stable ID:** `BSP-REQ-A5E18C7390F246D8`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied
