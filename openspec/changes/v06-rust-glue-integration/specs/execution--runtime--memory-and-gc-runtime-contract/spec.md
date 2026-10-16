## ADDED Requirements

### Requirement: Canonical provider GC handle and root registration exports
The canonical shared runtime SHALL export its source-defined `beskid_rt_v5_gc_resolve_handle` operation with a machine-word handle parameter and pointer result, and `beskid_rt_v5_gc_root_slot_is_registered` with a pointer parameter and Boolean result represented as an unsigned byte. These exports SHALL be declared in the runtime manifest and generated provider headers. Resolution SHALL validate current-heap handle generation; registration checking SHALL inspect current-heap root registrations without dereferencing the supplied address or creating a registration.

#### Scenario: Provider object resolves a managed handle
- **WHEN** a native provider operation calls `beskid_rt_v5_gc_resolve_handle` for a current live handle
- **THEN** the canonical image supplies the source-defined operation with the declared ABI
- **AND** stale or foreign handles resolve to a null pointer

#### Scenario: Existing root registration is required
- **WHEN** a provider publication operation checks a supplied root slot
- **THEN** only an existing registration in the current heap produces a true result
- **AND** an absent or null slot is rejected without allocation or registration

### Requirement: Native provider imports retain target and symbol kind
Every native provider system dependency SHALL have a target-bound manifest contract identifying its owning system library and symbol kind. Function imports SHALL retain physical parameter/result signatures. Data imports SHALL retain a non-void value type without callable parameters and SHALL NOT be admitted as functions. Generated source and installed manifest projections SHALL preserve this distinction. Unknown imports and a changed function/data kind SHALL fail provenance validation.

#### Scenario: Native process transport imports
- **WHEN** a canonical POSIX process provider imports process, signal, environment or memory operations
- **THEN** its actual function signatures and environment data symbol are declared for that exact target
- **AND** an unrelated target does not inherit those imports

#### Scenario: Environment data cannot become a function
- **WHEN** the environment pointer is declared as a platform data import
- **THEN** its manifest projection retains data kind and pointer value type
- **AND** callable parameters, void value types and a tampered kind are rejected
