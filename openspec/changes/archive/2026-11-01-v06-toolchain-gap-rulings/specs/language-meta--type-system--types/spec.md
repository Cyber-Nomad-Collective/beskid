## MODIFIED Requirements

### Requirement: Type expression grammar
A type expression SHALL be a primitive (`bool`, `i8`, `i16`, `i32`, `i64`, `u8`, `u16`, `u32`, `u64`, `f32`, `f64`, `char`, `string`, `unit`, `never`, `word`, `pointer`), named Path with optional GenericArguments, array `T[]`, or function type `T(params)` / `(params) => R`. The element type `T` of an array MAY be an array type, so `T[][]` is an array whose elements are `T[]`; each `[]` suffix adds one array rank. Primitive identity SHALL be consistent through parser, generated SDK syntax, semantic/query typing, typed AST and canonical ISLE lowering; retired HIR representations SHALL NOT be restored. Signed/unsigned fixed integers SHALL have their declared bit width, exact representable range and checked rejection of out-of-range literals/conversions; f32/f64 SHALL use IEEE 754 binary32/binary64, round-to-nearest ties-to-even for narrowing and preserve signed zero. Char SHALL denote a Unicode scalar, excluding surrogates and values above 0x10ffff. Word SHALL be unsigned selected-target pointer width; pointer SHALL remain an explicitly unsafe address construct, not a serializable value. Unit SHALL denote no value, never nonreturning control flow. Nullable syntax `?T`, `T?` and `optional T` SHALL remain rejected; absence SHALL use Option<T> or an explicit enum.

#### Scenario: Full primitives are real language types
- **GIVEN** a program with each fixed-width integer and f32/f64 plus generic instantiations
- **WHEN** parse/typecheck/query and canonical AOT lowering run
- **THEN** each type retains the declared width and value semantics through actual native execution rather than wrapper-only aliases

#### Scenario: Ranges and scalar validity reject
- **GIVEN** an integer outside its exact width or a surrogate char literal
- **WHEN** the compiler checks the program
- **THEN** it rejects the value with a source diagnostic before code generation

#### Scenario: Float narrowing and native width
- **GIVEN** an exactly halfway f64-to-f32 narrowing, negative zero and a word conversion on a selected target
- **WHEN** the operations execute
- **THEN** narrowing uses ties-to-even, negative zero is preserved and native-width overflow is rejected

#### Scenario: Nullable reference type rejected
- **GIVEN** a nullable type annotation such as T?
- **WHEN** the grammar is parsed
- **THEN** the nullable form is rejected

#### Scenario: Array of arrays
- **GIVEN** the type annotation `i64[][]`
- **WHEN** the type grammar is parsed
- **THEN** the type is an array whose element type is `i64[]`

## ADDED Requirements

### Requirement: Integer literal and module constant types
An integer literal with a type suffix (`_i8`, `_i16`, `_i32`, `_i64`, `_u8`, `_u16`, `_u32`, `_u64`) MUST have the type of its suffix. An unsuffixed integer literal MUST take the integer type of its destination when the destination declares a primitive integer type: a typed `let`, a `return` value of a function with a declared result, or an argument of a direct call. An unsuffixed integer literal that is an operand of a binary expression MUST take the type of the other operand, including when the other operand is a call result (rule T1); when both operands are unsuffixed literals or constant uses, both take the type that the binary expression takes from its own destination. The other operand MUST NOT be promoted to a wider type to hold the literal, in arithmetic or in a comparison. An unsuffixed integer literal without such a destination or operand MUST have its natural type: `i32` when the value fits `i32`; else `i64` when the value fits `i64`; else `word` for a hexadecimal literal whose value fits 64 bits. A use of a module constant (`const Name = IntegerLiteral;`) MUST have the type that its declared literal has at the same position. A literal or a constant use whose value does not fit the type it takes MUST be rejected with **T0905** (numeric literal outside range) at that literal or use. The compiler MUST NOT truncate, wrap, or sign-change an integer value to make it fit a type, and MUST NOT report an internal compiler error in place of **T0905**.

#### Scenario: Wide literal in an inferred let keeps its value
- **GIVEN** `let x = 3000000000;`
- **WHEN** the program is type-checked and lowered
- **THEN** `x` has the type `i64` and holds `3000000000`

#### Scenario: Word-sized constant keeps its bit pattern
- **GIVEN** `const LIMIT_INVALID = 0xFFFFFFFFFFFFFFFE;` and a `word` value compared with `LIMIT_INVALID`
- **WHEN** the comparison is lowered
- **THEN** the constant has the type `word` and its 64-bit value `0xFFFFFFFFFFFFFFFE`

#### Scenario: Constant that does not fit its destination
- **GIVEN** `const BIG = 3000000000;` and the statement `i32 x = BIG;`
- **WHEN** the program is checked
- **THEN** the compiler reports **T0905** at the use of `BIG` and does not lower the program

#### Scenario: Literal operand takes the type of the other operand
- **GIVEN** `x` of type `i32` and the statement `i32 y = x + 3000000000;`
- **WHEN** the program is checked
- **THEN** the literal takes the type `i32` from `x`, and the compiler reports **T0905** at the literal instead of promoting `x` to `i64`

#### Scenario: Constant compared with a narrower operand
- **GIVEN** `const BIG = 3000000000;`, `x` of type `i32`, and the comparison `x == BIG`
- **WHEN** the program is checked
- **THEN** `BIG` takes the type `i32` from `x`, and the compiler reports **T0905** at the use of `BIG`; the comparison is not done at `i64`

#### Scenario: Inferred literal without a natural integer type
- **GIVEN** `let x = 10000000000000000000;`
- **WHEN** the program is checked
- **THEN** the compiler reports **T0905** at the literal, because the decimal value does not fit `i64`
