## MODIFIED Requirements

### Requirement: Qualified constructors and arity
An enum constructor SHALL be spelled `Enum::Variant` or `Enum::Variant(args)`, where `Enum` is a type path that names an enum in scope (the grammar rule `EnumPath`). The compiler SHALL resolve `Enum` as a type and SHALL look `Variant` up among that enum's variants. An unqualified call whose name is a variant of a known enum and that binds no other declaration SHALL fail with **E1303**. For nullary variants, parentheses MAY be omitted (`Enum::Variant` and `Enum::Variant()` are equivalent). For variants with fields, `Enum::Variant(args)` MUST include parentheses and constructor arity MUST match the variant field list (**E1302**, **E1307**). When `Enum` is generic and written without type arguments, the constructor SHALL take its applied enum type from a proven value context (an annotated binding, a parameter, a return type or a field); without such a context the compiler SHALL report an error and SHALL NOT guess the type arguments.

#### Scenario: Arity mismatch on field-carrying variant
- **GIVEN** a constructor call for a variant with fields whose argument count does not match the field list
- **WHEN** constructor checking runs
- **THEN** the compiler emits **E1302** or **E1307**

#### Scenario: Qualified constructor
- **GIVEN** `pub enum Result<TValue, TError> { Ok(TValue value), Error(TError error) }`
- **WHEN** a function with return type `Result<i64, string>` returns `Result::Ok(1)`
- **THEN** the constructor binds to variant `Ok` of `Result` with the applied type `Result<i64, string>`

#### Scenario: Unqualified variant call
- **GIVEN** the same enum and no declaration named `Ok` in scope
- **WHEN** a function calls `Ok(1)`
- **THEN** the compiler emits **E1303**

### Requirement: Match arm typing and guards
`match scrutinee { arms }` MUST evaluate the scrutinee once, then select the first arm whose pattern matches. Each arm `pattern => expression` MUST produce the same type; mismatches MUST error (**E1305**). A `when guard` on an arm MUST be `bool` (**E1308**). Patterns MAY be wildcard `_`, literals, identifiers (bind), or `Enum::Variant(subpatterns)`. The variant of an enum pattern SHALL be looked up in the enum of the scrutinee type, and the subpattern count SHALL match the variant's field count.

#### Scenario: Arm type mismatch
- **GIVEN** a `match` whose arms produce incompatible expression types
- **WHEN** match typing runs
- **THEN** the compiler emits **E1305**

#### Scenario: Enum pattern spelling
- **GIVEN** a scrutinee of type `Result<u8[], string>`
- **WHEN** an arm is written `Result::Ok(bytes) => bytes`
- **THEN** the pattern binds `bytes` to the payload of variant `Ok`
