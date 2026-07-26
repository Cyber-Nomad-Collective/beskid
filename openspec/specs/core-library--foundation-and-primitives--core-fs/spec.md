<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Core.FS Specification

## Purpose

Provides filesystem text operations and existence checks through runtime filesystem builtins.

## Requirements

### Requirement: Text file operations: Decision [D-CORE-PRIM-0160]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `ReadAllText` MUST delegate to `__fs_read_text` and return `Result<string, FsError>`. `WriteAllText` MUST delegate to `__fs_write_text` and return `Result<Unit, FsError>`. Filesystem failures SHALL be represented as typed results rather than panics.

**Stable ID:** `BSP-REQ-8C4F1A7E0D92B635`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Existence and deletion: Decision [D-CORE-PRIM-0161]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `Exists(string path)` SHALL delegate to `__fs_exists` and return a boolean. `Delete(string path)` MUST delegate to `__fs_delete` and return `Result<Unit, FsError>`.

**Stable ID:** `BSP-REQ-D17A60F4C9E82B53`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Filesystem error taxonomy and tier: Decision [D-CORE-PRIM-0162]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `FsError` SHALL include `InvalidPath(string)`, `NotFound(string)`, `PermissionDenied(string)`, and `IOError(string)` variants. `Core.FS` and `Core.FS.FsError` MUST be exposed at `@tier(supported)`.

**Stable ID:** `BSP-REQ-5B9E3D7A1C64F820`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied
