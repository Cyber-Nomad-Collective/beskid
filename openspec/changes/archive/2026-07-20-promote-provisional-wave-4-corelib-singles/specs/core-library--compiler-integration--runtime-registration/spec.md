## ADDED Requirements

### Requirement: Host registration before user entry
Process-start registration for host-backed dispatch MUST complete before user static init and user `main` / JIT entry. Under the default `std` runtime profile, `beskid_host_register_all()` MUST register host handlers before user entry. The `minimal` profile MUST NOT perform that host registration step.

#### Scenario: std profile registers host handlers first
- **GIVEN** a process started under the `std` runtime profile
- **WHEN** user static init or user entry begins
- **THEN** host-owned dispatch registration via `beskid_host_register_all()` has already completed

### Requirement: Host-owned vs language-owned registration authority
Host-owned dispatch rows (`fs_*`, `env_*`, `process_*`, `tty_winsize`) MUST be registered by `beskid_host_register_all()` and MUST NOT be registered by `Runtime.Init`. `Runtime.Init` MUST remain a documented no-op stub in ABI v4. Language-owned soft-dispatch entries MAY use the `[Runtime]` attribute and static runtime fallback independently of the host table.

#### Scenario: Host-owned tags skip Runtime.Init
- **GIVEN** a host-owned dispatch tag such as `fs_*`
- **WHEN** registration authority is applied at process start
- **THEN** the tag is registered by `beskid_host_register_all()` and not by `Runtime.Init`

### Requirement: Deterministic trap without host table
When no host handler table is registered, host-owned tags MUST trap deterministically. Language-owned tags MAY still use the static runtime fallback.

#### Scenario: Unregistered host tag traps
- **GIVEN** a process with no host handler table registered
- **WHEN** a call targets a host-owned dispatch tag
- **THEN** the call traps deterministically rather than falling through to undefined behavior

### Requirement: Runtime.Abi status-code single source
Concurrency and IO modules MUST import runtime status constants from `Runtime.Abi` and MUST NOT duplicate those literals from `beskid_runtime::status` as a second source of truth. Envelope layouts, dispatch tag constants, and status codes in `Runtime.Abi` MUST be the single source for domain packages.

#### Scenario: Domain modules import Runtime.Abi constants
- **GIVEN** a concurrency or IO corelib module that needs a runtime status code
- **WHEN** the module references that constant
- **THEN** the constant is imported from `Runtime.Abi` rather than duplicated from Rust runtime literals

## REMOVED Requirements

### Requirement: Runtime registration conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
