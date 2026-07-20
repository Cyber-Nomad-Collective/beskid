## ADDED Requirements

### Requirement: Type expression grammar
A type expression (`BeskidType`) MUST be exactly one of: a primitive (`bool`, `i32`, `i64`, `u8`, `f64`, `char`, `string`, `unit`); a named `Path` with optional `GenericArguments`; an array `T[]`; or a function type `T(params)` / `(params) => R`. Primitives MUST map to `HirPrimitiveType` variants in the reference compiler. There is no `null` literal and no nullable reference type (`?T`, `T?`, or `optional` keyword) in v0.1. Optional presence MUST use `Option<T>` or an explicit enum with a dedicated absent variant.

#### Scenario: Nullable reference type rejected
- **GIVEN** a type annotation written as a nullable form such as `T?` or `optional T`
- **WHEN** the type grammar is parsed or checked under v0.1
- **THEN** the compiler rejects the nullable form

### Requirement: Nominal type declarations and members
`type Name<G…> : Contracts… { members }` MUST introduce a nominal record-like type. Members MAY be value fields, `event` fields, `inject` fields, or methods with implicit receiver access to the type's fields. Inline methods in the owning type body MAY access all fields (public and private) of that type. Conformance lists MUST declare contract implementations checked by the contracts capability. `extend type` MUST add members externally per the extend-type capability.

#### Scenario: Type with field and method
- **GIVEN** `type Account { i32 balance; pub unit Deposit(i32 amount) { ... } }`
- **WHEN** the type is validated
- **THEN** the nominal type exposes both the field and the method to subsequent resolution

### Requirement: Static type rules and diagnostics
Duplicate type or member names in the same scope MUST error (**E1001**, **E1006**). Unknown types in definitions MUST error (**E1005**, **E1201**). Generic arity MUST match at use sites (**E1203**, **E1204**). `unit` is the statement-result type; `never` is the bottom type for non-returning calls. Array values MUST use the `BeskidArray` layout documented in execution ABI material. L2 conforming implementations MUST reject programs with unknown types, arity mismatches, and invalid field access per the reference `beskid_analysis` type tests.

#### Scenario: Generic arity mismatch
- **GIVEN** a generic type used with the wrong number of type arguments
- **WHEN** type checking runs
- **THEN** the compiler emits **E1203** or **E1204**

## REMOVED Requirements

### Requirement: Types conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
