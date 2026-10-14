## ADDED Requirements

### Requirement: Builtin names and canonical runtime corpus scope
Ordinary source SHALL name only the public, single-segment builtins of the builtin manifest, and only unqualified, at the outermost level of the value order (name resolution, "Unqualified value name order"). A private builtin or runtime adapter SHALL resolve only in a Corelib source unit that the compiler admits for it from attested source identity; elsewhere a call to it SHALL fail closed. A legacy syscall spelling SHALL bind to its compiler-minted Corelib service only in an admitted Corelib unit. A runtime intrinsic SHALL bind only inside the canonical runtime corpus. Inside the canonical runtime corpus, units SHALL see each other's functions and constants without `pub`, through the private corpus scope; equal constant values SHALL count as one constant and distinct values SHALL be ambiguous. Spelling a builtin, intrinsic or service name SHALL NOT grant any of these admissions.

#### Scenario: Private runtime adapter from user code
- **GIVEN** a user source unit that calls a private runtime adapter of the builtin manifest
- **WHEN** the compiler checks the unit
- **THEN** the call fails closed and is not lowered

#### Scenario: Shared constant in the runtime corpus
- **GIVEN** two canonical runtime corpus units, where one declares `const PageSize = 4096;` and the other reads `PageSize` without a `use`
- **WHEN** the compiler checks the reading unit
- **THEN** `PageSize` resolves to 4096
