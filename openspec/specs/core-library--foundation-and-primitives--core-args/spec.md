<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Core.Args Specification

## Purpose

Core.Args provides read-only access to the process command-line argument vector.

## Requirements

### Requirement: Argument collection and count: Decision [D-CORE-PRIM-0120]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `All() -> string[]` SHALL read the complete argument vector through the `__args_all` builtin, and `Count() -> i64` SHALL report its number of entries.

**Stable ID:** `BSP-REQ-0000000000000120`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Optional indexed access and errors: Decision [D-CORE-PRIM-0121]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `Get(i64 index) -> Option<string>` SHALL return the argument at a valid index and `None` for an out-of-range index; `Core.Args.ArgsError` MUST define `IndexOutOfRange(i64)` for APIs or callers that require an explicit indexing error.

**Stable ID:** `BSP-REQ-0000000000000121`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied
