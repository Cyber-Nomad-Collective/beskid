## MODIFIED Requirements

### Requirement: Type expression grammar
A type expression (`BeskidType`) MUST be exactly one of: a primitive (`bool`, `i32`, `i64`, `u8`, `f64`, `char`, `string`, `unit`); a named `Path` with optional `GenericArguments`; an array `T[]`; or a function type `T(params)` / `(params) => R`. The element type `T` of an array MAY be an array type, so `T[][]` is an array whose elements are `T[]`; each `[]` suffix adds one array rank. Primitives MUST map to `HirPrimitiveType` variants in the reference compiler. There is no `null` literal and no nullable reference type (`?T`, `T?`, or `optional` keyword) in v0.1. Optional presence MUST use `Option<T>` or an explicit enum with a dedicated absent variant.

#### Scenario: Nullable reference type rejected
- **GIVEN** a type annotation written as a nullable form such as `T?` or `optional T`
- **WHEN** the type grammar is parsed or checked under v0.1
- **THEN** the compiler rejects the nullable form

#### Scenario: Array of arrays
- **GIVEN** the type annotation `i64[][]`
- **WHEN** the type grammar is parsed
- **THEN** the type is an array whose element type is `i64[]`

## ADDED Requirements

### Requirement: Integer literal and module constant types
An integer literal with a type suffix (`_i8`, `_i16`, `_i32`, `_i64`, `_u8`, `_u16`, `_u32`, `_u64`) MUST have the type of its suffix. An unsuffixed integer literal MUST take the integer type of its destination when the destination declares a primitive integer type: a typed `let`, a `return` value of a function with a declared result, or an argument of a direct call. An unsuffixed integer literal without such a destination MUST have its natural type: `i32` when the value fits `i32`; else `i64` when the value fits `i64`; else `word` for a hexadecimal literal whose value fits 64 bits. A use of a module constant (`const Name = IntegerLiteral;`) MUST have the type that its declared literal has at the same position. A literal or a constant use whose value does not fit the type it takes MUST be rejected with **T0905** (numeric literal outside range) at that literal or use. The compiler MUST NOT truncate, wrap, or sign-change an integer value to make it fit a type, and MUST NOT report an internal compiler error in place of **T0905**.

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

#### Scenario: Inferred literal without a natural integer type
- **GIVEN** `let x = 10000000000000000000;`
- **WHEN** the program is checked
- **THEN** the compiler reports **T0905** at the literal, because the decimal value does not fit `i64`
