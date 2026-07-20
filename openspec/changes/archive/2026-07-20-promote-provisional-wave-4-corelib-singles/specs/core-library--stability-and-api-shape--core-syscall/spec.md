## ADDED Requirements

### Requirement: Typed descriptor facade for ReadWith and WriteWith
`ReadWith` / `WriteWith` MUST route via typed `Descriptor`, not raw fd integers in stream modules (**SC-001**). `Core.Input` / `Core.Output` / `Core.Error` MUST use `Descriptor::Standard` only (**SC-004**, **IO-001**, **IO-002**).

#### Scenario: Stream modules reject raw fd integers
- **GIVEN** a call through `Core.Input`, `Core.Output`, or `Core.Error`
- **WHEN** the implementation selects a descriptor
- **THEN** only `Descriptor::Standard` is used and raw fd integers are not accepted in those stream modules

### Requirement: Binary ReadBytes and WriteBytes for arbitrary descriptors
`ReadBytes` MUST support arbitrary non-negative fds via `Descriptor::Raw` (**SC-002**). `WriteBytes` MUST accept `u8[]` payloads for arbitrary fds (**SC-003**).

#### Scenario: Raw descriptor binary round-trip surface
- **GIVEN** a non-negative file descriptor wrapped as `Descriptor::Raw`
- **WHEN** a caller invokes `ReadBytes` or `WriteBytes` with a `u8[]` payload where applicable
- **THEN** the call is accepted for that arbitrary descriptor rather than being limited to standard streams

### Requirement: Stable SyscallError mapping across JIT and AOT
`SyscallError` mapping MUST be stable across JIT and AOT (**SC-005**).

#### Scenario: Same error class under JIT and AOT
- **GIVEN** a syscall failure that maps to a documented `SyscallError` variant
- **WHEN** the same failure is observed under JIT and under AOT
- **THEN** both builds report the same `SyscallError` mapping

### Requirement: Partial writes, EOF reads, and UTF-8 validation
On Linux, the write path MUST loop partial writes; reads MUST return short buffers on EOF (**SC-006**). Text `Read` MUST validate UTF-8 when building `string` (**SC-007**). Binary `ReadBytes` MUST NOT validate UTF-8 (**SC-008**).

#### Scenario: Text Read rejects invalid UTF-8
- **GIVEN** a descriptor whose next bytes are not valid UTF-8
- **WHEN** a caller invokes text `Read` to build a `string`
- **THEN** UTF-8 validation fails rather than producing an invalid string

### Requirement: InvalidFd and InvalidReadLimit guards
A negative fd MUST return `InvalidFd` before the syscall (**SC-009**). `maxBytes < 1` MUST return `InvalidReadLimit` (**SC-010**).

#### Scenario: Negative fd rejected before syscall
- **GIVEN** a caller supplies a negative file descriptor
- **WHEN** a `Core.Syscall` read or write entry is invoked
- **THEN** the call returns `InvalidFd` without performing the underlying syscall

## REMOVED Requirements

### Requirement: Core.Syscall conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
