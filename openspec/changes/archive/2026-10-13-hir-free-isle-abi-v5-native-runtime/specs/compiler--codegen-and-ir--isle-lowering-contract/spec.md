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

#### Scenario: Canonical runtime parameters use contextual structural terms
- **GIVEN** canonical runtime source declares `pointer parent` or `pointer event` as a function parameter
- **WHEN** source parsing runs outside an `inject parent::` qualifier or an `event` field declaration
- **THEN** `pointer` parses as the primitive type and `parent` or `event` parses as the parameter identifier;
  the contextual injection qualifier and event-field declaration remain recognized only in their structural positions

#### Scenario: Cross-unit canonical intrinsic call lowers inline
- **GIVEN** the exact embedded canonical runtime corpus and its compiler-minted intrinsic capability, including `Runtime/Fiber/Scheduler.bd`
- **WHEN** `SchedInit` invokes manifest-authorized `pointer_add` and `raw_word_store`
- **THEN** each call is classified as its exact `RuntimeIntrinsic` kind through the generation-safe syntax facts, emits its inline verified CLIF operation, and creates neither a dynamic dispatch nor an ABI import; an ordinary program, a foreign source unit, or a manifest-absent name remains unavailable

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

### Requirement: Integer shift lowering
The `<<` and `>>` binary operators SHALL accept two operands of the same primitive integer type (`i32`, `i64`, `u8`, or `word`), produce that same type, and lower through the generation-safe syntax-fact inventory to stock CLIF `ishl` and logical `ushr`, respectively. The operators MUST NOT share the boolean-only `&&` operator fact, coerce operands, silently promote mixed integer widths, or fall back to HIR/Rust lowering. Invalid, boolean, floating-point, and mixed-type operands SHALL be rejected before code generation.

#### Scenario: Runtime header composition
- **GIVEN** canonical runtime source computes `(generation << 32) | slotIndex` from `word` operands
- **WHEN** the source is checked and lowered through `TypedProgram` and `CodegenInput`
- **THEN** the shift is emitted as integer CLIF `ishl`, the OR is emitted as the corresponding integer operation, and the result remains a `word`

#### Scenario: Invalid shift operands fail closed
- **GIVEN** source uses `true << false`, `1_i32 >> 1_i64`, or a floating-point shift operand
- **WHEN** semantic checking runs
- **THEN** it rejects the expression before code generation without a coercion, HIR fallback, or generated CLIF

### Requirement: Integer bitwise OR lowering
The `|` binary operator SHALL accept two operands of the same primitive integer type (`i32`, `i64`, `u8`, or `word`), produce that same type, and lower through the generation-safe syntax-fact inventory to stock CLIF `bor`. It MUST NOT share the boolean-only `||` operator fact, coerce operands, silently promote mixed integer widths, or fall back to HIR/Rust lowering.

#### Scenario: Runtime generation and slot composition
- **GIVEN** canonical runtime source computes `(generation << 32) | slotIndex` from `word` operands
- **WHEN** the source is checked and lowered through `TypedProgram` and `CodegenInput`
- **THEN** the shift is emitted as `ishl`, the composition is emitted as integer CLIF `bor`, and the result remains a `word`

### Requirement: Explicit primitive numeric conversion lowering
The primitive conversion call forms `i32(value)`, `i64(value)`, `u8(value)`, and `word(value)` SHALL be classified by a generation-safe AST/Salsa fact only when they have exactly one primitive numeric argument. The fact SHALL carry the exact source and target primitive types, and ISLE SHALL emit the corresponding stock CLIF integer width conversion (`sextend`, `uextend`, `ireduce`, or identity) without importing a runtime symbol. Invalid arity, boolean, pointer, floating-point, string, aggregate, or unresolved operands SHALL remain unavailable before code generation. This conversion surface MUST NOT use dynamic dispatch, HIR, `Lowerable`, or a Rust fallback.

#### Scenario: Canonical scheduler widens a fiber-table index
- **GIVEN** canonical scheduler source returns `i64(index)` where `index` has primitive `word` type
- **WHEN** the source is checked through `TypedProgram` and lowered through `CodegenInput` and ISLE
- **THEN** a generation-safe conversion fact declares `word` to `i64`, verified CLIF emits the required integer conversion, and no call import or dynamic-dispatch symbol is created

#### Scenario: Invalid primitive conversion fails closed
- **GIVEN** source invokes `i64(pointerValue)`, `word(true)`, `u8(1, 2)`, or `i32(unresolved)`
- **WHEN** semantic checking or production lowering runs
- **THEN** it reports the conversion as unavailable before CLIF emission and does not select a dynamic builtin, HIR path, or fallback lowering
