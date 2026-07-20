## ADDED Requirements

### Requirement: Socket builtins use one opaque generation-tagged ABI handle
The runtime SHALL represent every TCP listener, TCP stream, and UDP socket in
its socket ABI as one opaque handle containing a table slot and generation. A
builtin MUST validate both values before accessing a native socket. The handle,
all builtin symbols, and their signatures MUST be manifest-generated and
registered through the existing builtin registry. Native descriptors and
platform constants MUST NOT cross the runtime/corelib ABI or appear in a public
Network API.

**Stable ID:** `BSP-REQ-3D4E0AE8B901`

#### Scenario: Reused slot rejects a stale handle
- **GIVEN** a closed socket whose table slot is reused with a new generation
- **WHEN** a late operation presents the previous opaque handle
- **THEN** the runtime rejects it as closed or stale without touching the new socket

### Requirement: Socket builtin registry has one generated implementation path
Every socket ABI operation SHALL be declared in the runtime manifest and MUST
have exactly one generated ABI signature, runtime export or dispatch entry, and
runtime implementation. Hand-written import signatures, direct Cranelift
socket calls, and target-specific public entrypoints are prohibited.

**Stable ID:** `BSP-REQ-B094EDC16A72`

#### Scenario: Manifest parity rejects an unregistered operation
- **GIVEN** a runtime socket operation that is not declared by the manifest
- **WHEN** ABI registry generation or conformance validation runs
- **THEN** validation fails before JIT or AOT execution
