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
