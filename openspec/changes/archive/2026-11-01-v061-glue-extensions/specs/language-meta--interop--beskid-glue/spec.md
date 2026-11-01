## ADDED Requirements

### Requirement: Glue admits repr(C) records by value
Rust Glue SHALL admit a type declared `[GlueRecord]` as a by-value parameter and as a by-value result of Glue imports and exports. A `[GlueRecord]` type SHALL be non-generic and SHALL have 1 to 64 fields. Each field SHALL be one of `i8`, `i16`, `i32`, `i64`, `u8`, `u16`, `u32`, `u64`, `f32`, `f64`, `bool`, `char` or `word`. The record SHALL cross the C ABI by value in parameters and through a checked out parameter for results, with the layout that the C ABI profile computes. Field values SHALL be copied in both directions; a record value SHALL NOT alias managed storage on the foreign side. A `bool` field outside 0 and 1 or a `char` field that is not a Unicode scalar value, received from the foreign side, SHALL cause a checked failure before a managed record is constructed. A `[GlueRecord]` type with a field of another type, with no fields, with more than 64 fields, or with generic parameters SHALL be rejected before adapter generation. Admission SHALL be established by a hand-written C ABI fixture before a generated adapter claims equivalence.

#### Scenario: Record round trip
- **GIVEN** a Rust Glue import that takes and returns a `[GlueRecord]` of two `i64` fields and one `f64` field
- **WHEN** Beskid code calls the import with a record value
- **THEN** the foreign side receives the field values unchanged and the Beskid caller receives a new record with the returned field values unchanged

#### Scenario: Record with an unadmitted field
- **GIVEN** a `[GlueRecord]` type that has a `string` field
- **WHEN** a Glue declaration that uses it is checked
- **THEN** the compiler rejects the declaration before generating an adapter

#### Scenario: Invalid Bool field from the foreign side
- **GIVEN** a Rust Glue export that takes a `[GlueRecord]` with a `bool` field
- **WHEN** the foreign caller passes the value 2 in that field
- **THEN** the checked invocation reports status 1 and the export body does not run

### Requirement: Rust owner types for records and enums
A `[GlueRecord]` type or a `[GlueEnum]` type that a Rust owner import uses SHALL carry `[RustOwner(Path:"implementation::...")]`, which names the Rust type of the owner crate. `Fallible` SHALL be rejected on these placements. The generated owner shell SHALL verify at compile time that a record's Rust type has the profile size and alignment and that each field has the profile offset and type, and SHALL convert enum discriminants by exhaustive matches over the Beskid variant names. A Rust owner type whose layout or variant names differ SHALL fail the owner build.

#### Scenario: Owner record layout differs
- **GIVEN** a `[GlueRecord]` with fields `i64 x` and `i64 y` and a Rust owner type that declares `y` before `x`
- **WHEN** the owner build runs
- **THEN** the build fails before an owner image is published

#### Scenario: Missing Rust owner type
- **GIVEN** a Rust owner import that takes a `[GlueRecord]` without `RustOwner(Path:..)`
- **WHEN** the owner tables are formed
- **THEN** the build fails and names the record declaration

### Requirement: Glue admits fieldless enums as checked discriminants
Rust Glue SHALL admit a non-generic enum declared `[GlueEnum]` with 1 to 4096 variants, none of which has fields, as a parameter and result of Glue imports and exports. The discriminant SHALL be the source-order variant index as `uint32_t`. The receiving side SHALL check each discriminant against the variant count and SHALL report a checked failure, status 1, for a value that names no variant. A `[GlueEnum]` with a variant that has fields SHALL be rejected before adapter generation.

#### Scenario: Unknown discriminant
- **GIVEN** a foreign function that returns the discriminant 7 for a `[GlueEnum]` with three variants
- **WHEN** the Beskid caller receives the value
- **THEN** the call reports a checked failure and does not produce an enum value

#### Scenario: Tagged variant rejected
- **GIVEN** a `[GlueEnum]` with a variant `Some(i64 value)`
- **WHEN** a Glue declaration that uses it is checked
- **THEN** the compiler rejects the declaration before generating an adapter

### Requirement: Glue admits call-scoped callbacks with explicit lifetime rules
Rust Glue SHALL admit a function type `(P1, ..., Pn) => R` with 0 to 16 parameters as a parameter of a Glue import. Each `Pi` SHALL be an admitted scalar form and `R` SHALL be an admitted scalar form or `unit`. The callback SHALL cross as a C function pointer `int32_t (*)(uint64_t context, P1, ..., Pn, R *out)` (without `out` for `unit`) and a `uint64_t` context token. The import adapter SHALL root the function value from before the foreign call until after the foreign call returns. The callback SHALL be invocable only during the import call and only on the thread that made the import call; any other invocation SHALL return status 2 without running Beskid code. Invalid `bool` or `char` arguments SHALL return status 1 without running Beskid code. A trap in Beskid code that the callback runs SHALL end the process without unwinding. No unwind SHALL cross a C frame. A function type in a Glue export, in a Glue result, in a record field, or nested in another function type, and a foreign function pointer used as a Beskid value, SHALL be rejected before adapter generation.

#### Scenario: Foreign code calls a Beskid callback
- **GIVEN** a Rust Glue import that accepts a callback and calls it once before it returns
- **WHEN** Beskid code passes a function value to the import
- **THEN** the function value runs once with the arguments the foreign side supplied and stays rooted until the import returns

#### Scenario: Retained callback after the call
- **GIVEN** a foreign function that stores the callback context token and returns
- **WHEN** foreign code later invokes the stored callback
- **THEN** the invocation returns status 2 and no Beskid code runs

#### Scenario: Callback failure does not unwind through foreign frames
- **GIVEN** a Rust owner import whose callback invocation returns a nonzero status
- **WHEN** the generated Rust callback closure observes the status
- **THEN** the owner shell catches the resulting unwind at the C boundary and the import reports that status as its checked failure

#### Scenario: Callback in an export rejected
- **GIVEN** a Glue export with a function-typed parameter
- **WHEN** the Glue binding facts are queried
- **THEN** the query rejects the declaration before generation

### Requirement: Glue generates the Rust consumer for Beskid exports
The Rust owner build SHALL generate a `beskid` module in the owner crate with one function per export of the consumer packet, named after the export symbol. Each function SHALL call the checked export invocation of the admitted consumer image and SHALL return the export result or a `GlueError`. The loader SHALL bind the checked export invocation addresses into the owner image before owner code can call them. A call SHALL be admitted only on a thread that is inside a Beskid-to-owner import call; any other call SHALL return `GlueError::ForeignThread` without entering Beskid code.

#### Scenario: Generated export consumer
- **GIVEN** a Beskid project that declares a C ABI export and a Rust owner import whose implementation calls `crate::beskid::<symbol>`
- **WHEN** the owner build runs and Beskid code calls the import
- **THEN** the owner code calls the export through the generated module and receives its checked result without a hand-written link step

#### Scenario: Export call outside an import call
- **GIVEN** owner code that calls a generated export function on a thread that is not inside an import call
- **WHEN** the call runs
- **THEN** it returns `GlueError::ForeignThread` and no Beskid code runs
