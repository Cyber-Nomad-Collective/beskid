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

### Requirement: Production syntax-fact adapter
The production codegen adapter MUST derive ISLE terms solely from a generation-safe `CodegenInput` and expanded-AST Salsa facts. Synthetic `NodeFacts`, HIR, and `Lowerable` MAY exist only in isolated tests until the corresponding production path has been deleted; they MUST NOT be selected by JIT, AOT, CLI, or runtime-kit builds.

#### Scenario: Parsed source reaches verified CLIF
- **GIVEN** a parsed project source expression
- **WHEN** it is built into a `TypedProgram` and lowered for a supported target
- **THEN** `CodegenInput` supplies the syntax facts, exactly one ISLE rule emits the operation, and the resulting stock CLIF verifies without HIR or `Lowerable`

### Requirement: Full production operation migration
The production adapter and ISLE inventory MUST cover expressions, statements, calls, locals, memory operations, control flow, items, closures/captures, spawn, runtime intrinsics, aggregate layout, and diagnostic spans before legacy lowering is deleted.

#### Scenario: Unsupported typed operation
- **GIVEN** a typed syntax operation not represented in the ISLE inventory
- **WHEN** a production compilation requests it
- **THEN** compilation fails deterministically with its syntax span; it MUST NOT fall back to HIR or Rust lowering
