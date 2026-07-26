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

### Requirement: Canonical runtime intrinsic source surface
Canonical Beskid runtime sources MUST express calls to only manifest-approved trusted intrinsics through a typed intrinsic declaration and call surface. That surface MUST support the ABI-required `pointer`, `word`, and `never` source types, retain source spans, and lower through the production Salsa-to-ISLE route; it MUST NOT model trusted calls as user-declarable extern functions. ABI metadata continues to spell the pointer-width unsigned layout type `usize`.

#### Scenario: Canonical trap call
- **GIVEN** canonical runtime source invoking the manifest-approved `trap` intrinsic
- **WHEN** semantic checking and ISLE lowering run
- **THEN** the call receives the ABI-declared signature, maps ABI `usize` parameters to source `word`, is rejected outside the trusted runtime package, and lowers to the direct ABI-v5 trap symbol with its source span

### Requirement: Integer bitwise AND lowering
The `&` binary operator SHALL accept two operands of the same primitive integer type (`i32`, `i64`, `u8`, or `word`), produce that same type, and lower through the generation-safe syntax-fact inventory to stock CLIF `band`. It MUST NOT share the boolean-only `&&` operator fact, coerce operands to boolean, introduce arithmetic overflow behavior, or alter allocation failure handling.

#### Scenario: Allocator alignment mask
- **GIVEN** canonical runtime source computes an aligned address with `(address + alignment - 1) & -alignment` for a power-of-two alignment
- **WHEN** the source is checked and lowered through `TypedProgram` and `CodegenInput`
- **THEN** the addition and subtraction retain their existing overflow semantics, the mask is emitted as an integer CLIF `band`, and an allocation failure remains observable only through the existing nullable-result/OOM path

#### Scenario: Boolean and mixed operands are rejected
- **GIVEN** source uses `true & false` or operands of different integer types
- **WHEN** semantic checking runs
- **THEN** it rejects the expression before code generation; `&&` remains the only boolean conjunction operator
