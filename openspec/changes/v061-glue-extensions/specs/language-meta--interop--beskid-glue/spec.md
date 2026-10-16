## ADDED Requirements

### Requirement: Glue admits repr(C) records by value
Rust Glue SHALL admit a `repr(C)` record whose fields are all admitted Glue types as a by-value parameter and as a by-value result, in both directions. Admission SHALL be established by a hand-written C ABI fixture before a generated adapter claims equivalence. A record with a field that is not an admitted Glue type SHALL be rejected before adapter generation.

#### Scenario: Record round trip
- **GIVEN** a Rust Glue import that takes and returns a `repr(C)` record of two `i64` fields and one `f64` field
- **WHEN** Beskid code calls the import with a record value
- **THEN** the foreign side receives the field values unchanged and the Beskid caller receives the returned record with its field values unchanged

#### Scenario: Record with an unadmitted field
- **GIVEN** a `repr(C)` record that contains a field of a type Glue does not admit
- **WHEN** the Glue declaration is checked
- **THEN** the compiler rejects the declaration before generating an adapter

### Requirement: Glue admits callbacks with explicit lifetime rules
Rust Glue SHALL admit a Beskid function value as a foreign callback and a foreign function pointer as a Beskid callable. Each admitted callback form SHALL define its GC root, lifetime, calling-thread and panic rules. A callback form whose rules are not defined SHALL remain rejected before adapter generation.

#### Scenario: Foreign code calls a Beskid callback
- **GIVEN** a Rust Glue import that accepts a callback and calls it once before it returns
- **WHEN** Beskid code passes a function value to the import
- **THEN** the function value runs once with the arguments the foreign side supplied and stays rooted until the import returns

#### Scenario: A panic does not cross the boundary
- **GIVEN** a callback that panics while foreign code calls it
- **WHEN** the panic occurs
- **THEN** the panic does not unwind through the foreign frames and the import reports a checked failure

### Requirement: Glue generates the Rust consumer for Beskid exports
Rust Glue SHALL generate the Rust-side consumer for Beskid exports through the owner build, so that Rust code calls a Beskid export without a hand-linked consumer.

#### Scenario: Generated export consumer
- **GIVEN** a Beskid project that declares a C ABI export for Rust Glue
- **WHEN** the owner build runs
- **THEN** the generated Rust consumer calls the export and receives its checked result without a hand-written link step

### Requirement: Glue admits fieldless enums as checked discriminants
Rust Glue SHALL admit a fieldless enum as an integer discriminant. The receiving side SHALL check each discriminant value and SHALL report a checked failure for a value that names no variant.

#### Scenario: Unknown discriminant
- **GIVEN** a foreign function that returns a discriminant value that names no variant of the declared enum
- **WHEN** the Beskid caller receives the value
- **THEN** the call reports a checked failure and does not produce an enum value
