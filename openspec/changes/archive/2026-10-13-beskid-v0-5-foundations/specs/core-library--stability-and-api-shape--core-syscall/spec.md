## ADDED Requirements

### Requirement: ReadBytesWith returns Result<u8[], SyscallError>
`Core.Syscall.ReadBytesWith` SHALL declare and return `Result<u8[], SyscallError>`. Its declared type, corelib implementation, runtime builtin signature, and JIT and AOT typechecking behavior MUST agree; it MUST NOT declare a scalar result type for a byte-array result.

**Stable ID:** `BSP-REQ-277D7253AE0E`

#### Scenario: ReadBytesWith typechecks as bytes
- **GIVEN** a caller assigning `Core.Syscall.ReadBytesWith(...)` to `Result<u8[], SyscallError>`
- **WHEN** the caller typechecks under JIT and AOT compilation
- **THEN** both modes accept the assignment with the same result type
