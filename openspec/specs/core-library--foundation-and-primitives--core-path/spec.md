<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Core.Path Specification

## Purpose

Provides pure, platform-aware string path manipulation without performing I/O.

## Requirements

### Requirement: Path composition and components: Decision [D-CORE-PRIM-0170]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `Join(string... parts)` SHALL compose paths using the platform-aware separator. `DirectoryName` and `FileName` MUST return the corresponding path components without filesystem access, and `Separator()` SHALL return the platform-specific separator string.

**Stable ID:** `BSP-REQ-6D2A9F4C81E703B5`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Path extensions and normalization: Decision [D-CORE-PRIM-0171]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `Extension(string path)` SHALL return `Option<string>`, while `ChangeExtension` MUST produce a path with the requested extension. `IsRooted` and `GetFullPath` SHALL classify and normalize paths as platform-defined string operations and MUST NOT perform I/O.

**Stable ID:** `BSP-REQ-E84B1C6D3A907F25`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Supported path tier: Decision [D-CORE-PRIM-0172]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `Core.Path` MUST be exposed at `@tier(supported)` and every operation SHALL remain pure with respect to external filesystem state.

**Stable ID:** `BSP-REQ-31F7A9C2E6058D4B`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied
