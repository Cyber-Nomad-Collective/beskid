## ADDED Requirements

### Requirement: CLIF block contexts
A `clif { ... }` block SHALL state one straight-line Cranelift basic block in
Beskid source, one statement per line. A value block SHALL appear only where
the expected type is known (a declared return, an annotated binding, or a typed
argument) and SHALL yield a value of that type. A block used as an expression
statement SHALL yield no value.

**Stable ID:** `BSP-REQ-CLIF-CONTEXTS`

#### Scenario: Value block yields a value in a typed context
- **GIVEN** `pub i64 Twice(i64 value)` whose body returns a CLIF block holding
  `%d = iadd %0, %0` and `return %d` on separate lines
- **WHEN** the function is compiled and called with `21`
- **THEN** it returns `42`

#### Scenario: Value block without a typed context is rejected
- **GIVEN** `let x = clif { return %0 };` with no type annotation
- **WHEN** the program is type-checked
- **THEN** the compiler rejects the block because it needs a typed context

### Requirement: CLIF block operands
In a CLIF block, `%N` (decimal) SHALL name parameter `N` of the enclosing
function; in a method `%0` SHALL be the receiver and SHALL NOT be usable as a
value. `%name` SHALL name a block-local value that is defined exactly once and
used only after its definition.

**Stable ID:** `BSP-REQ-CLIF-OPERANDS`

#### Scenario: A block-local value is used before its definition
- **GIVEN** a CLIF block that reads `%t` on a line before the line defining `%t`
- **WHEN** the block is parsed
- **THEN** the compiler rejects the use of an undefined block-local value

### Requirement: CLIF block opcodes
CLIF block instructions SHALL use only the opcodes the reference compiler
admits: integer, carry and overflow, bitwise, comparison and selection,
conversion, floating-point, SIMD-lane, and explicit conditional-trap opcodes.
Branches, raw CLIF call syntax, stack slots, globals, and atomics SHALL be
rejected.

**Stable ID:** `BSP-REQ-CLIF-OPCODES`

#### Scenario: Raw branch is rejected
- **GIVEN** a CLIF block containing a `brif` instruction
- **WHEN** the block is parsed
- **THEN** the compiler rejects the opcode as not admitted in a CLIF block

### Requirement: CLIF block array access
`%p = payload %N` SHALL yield the element base address and `%n = length %N`
the element count of array parameter `N` of type `u8[]`, `u32[]`, or `i64[]`.
Memory access SHALL be limited to addresses derived from a `payload` value by
`iadd` or `isub` with an integer offset, and the caller SHALL keep every access
in bounds.

**Stable ID:** `BSP-REQ-CLIF-ARRAY-ACCESS`

#### Scenario: Payload of an unsupported array type is rejected
- **GIVEN** a CLIF block that applies `payload` to a `string[]` parameter
- **WHEN** the block is type-checked
- **THEN** the compiler rejects the operand type

### Requirement: CLIF block named calls
`call @symbol(...)` in a CLIF block SHALL call only a kit platform import or a
C-ABI `[Extern]` contract method with a library. A payload address SHALL be
passed only to a C-ABI `[Extern]` symbol. In a value block a result-less named
call SHALL be allowed only as the final statement.

**Stable ID:** `BSP-REQ-CLIF-NAMED-CALLS`

#### Scenario: Unknown symbol is rejected
- **GIVEN** a CLIF block that calls `@not_a_kit_symbol` with no matching
  `[Extern]` declaration
- **WHEN** the block is lowered
- **THEN** the compiler rejects the call target

### Requirement: CLIF block indirect calls
A CLIF block SHALL accept `%r = call_indirect %callee(%a, ...) -> <type>` and,
where a result-less named call is allowed, `call_indirect %callee(%a, ...)`.
`%callee` SHALL be a `pointer` parameter or a block-local value computed from
parameters by admitted integer opcodes. The signature SHALL be the argument
CLIF types and the declared result type, with the calling convention of
`call @symbol(...)`.

**Stable ID:** `BSP-REQ-CLIF-CALL-INDIRECT`

#### Scenario: Runtime code calls a fixed-signature entry point
- **GIVEN** a runtime function `i64 Enter(pointer entry, i64 task)` whose CLIF
  block holds `%r = call_indirect %0(%1) -> i64` and `return %r`
- **AND** `entry` holds the address of a function taking and returning `i64`
- **WHEN** `Enter` is called
- **THEN** the function at `entry` runs with `task` and `Enter` returns its result

### Requirement: CLIF block indirect call authority
The compiler SHALL accept `call_indirect` only in sources with runtime or
Corelib source authority, the same per-file authority that grants Corelib
native services, and SHALL reject it in any other source. The compiler SHALL
reject a callee or an argument derived from a `payload` value.

**Stable ID:** `BSP-REQ-CLIF-CALL-INDIRECT-AUTHORITY`

#### Scenario: User source cannot call indirectly
- **GIVEN** a CLIF block containing `call_indirect` in a user package source
- **WHEN** the program is compiled
- **THEN** the compiler rejects the statement because the source lacks runtime
  or Corelib source authority

#### Scenario: Payload addresses are not callees
- **GIVEN** a runtime CLIF block that computes `%p = payload %0` and then
  `call_indirect %p()`
- **WHEN** the block is checked
- **THEN** the compiler rejects the payload-derived callee

### Requirement: CLIF block indirect calls are not closures
`call_indirect` SHALL NOT pass an environment implicitly and SHALL NOT have a
generic form. Lambdas and function-typed values SHALL be represented and called
only as specified by `language-meta--evaluation--lambdas-and-closures`.

**Stable ID:** `BSP-REQ-CLIF-CALL-INDIRECT-NOT-CLOSURES`

#### Scenario: Lambdas do not lower through CLIF blocks
- **GIVEN** a program that passes a lambda to a function-typed parameter
- **WHEN** the program is compiled
- **THEN** the lambda lowers through the function-value representation of
  `language-meta--evaluation--lambdas-and-closures`, not through a CLIF block
