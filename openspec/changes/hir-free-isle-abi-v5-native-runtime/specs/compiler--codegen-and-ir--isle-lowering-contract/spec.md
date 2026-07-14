## ADDED Requirements

### Requirement: Exhaustive ISLE operation selection
The compiler MUST generate an inventory of typed operations and SHALL bind every operation to exactly one ISLE rule without a Rust lowering fallback.

#### Scenario: Complete rule inventory
- **GIVEN** a compiler build with the typed-operation and ISLE-rule inventories
- **WHEN** coverage validation runs
- **THEN** the build succeeds only when the inventories are bijective

#### Scenario: Missing operation coverage
- **GIVEN** a well-typed AST operation with no ISLE rule
- **WHEN** code generation is requested
- **THEN** compilation fails with the operation's source span before native execution

### Requirement: Verified stock CLIF output
Every generated function MUST use stock Cranelift IR and MUST pass `verify_function` before entering a codegen artifact.

#### Scenario: Invalid generated CLIF
- **GIVEN** an ISLE rule emits invalid CLIF
- **WHEN** the function is finalized
- **THEN** compilation fails and identifies the originating typed operation
