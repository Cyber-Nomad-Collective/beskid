## MODIFIED Requirements

### Requirement: Static type rules and diagnostics
Duplicate type, enum or contract names in the same scope MUST error with **E1102**, reported once at the later declaration (name resolution, "Duplicate names per scope"); **E1001** and **E1006** SHALL NOT be reported for a duplicate name. Unknown types in definitions MUST error (**E1005**, **E1201**). Generic arity MUST match at use sites (**E1203**, **E1204**). `unit` is the statement-result type; `never` is the bottom type for non-returning calls. Array values MUST use the `BeskidArray` layout documented in execution ABI material. L2 conforming implementations MUST reject programs with unknown types, arity mismatches, and invalid field access per the reference query gate tests in `beskid_queries`; the legacy `beskid_analysis` `TypeChecker` is retired and is not a conformance reference.

#### Scenario: Generic arity mismatch
- **GIVEN** a generic type used with the wrong number of type arguments
- **WHEN** type checking runs
- **THEN** the compiler emits **E1203** or **E1204**

#### Scenario: Duplicate type name
- **GIVEN** `type Point { i64 x; }` and `enum Point { Dot }` in one scope
- **WHEN** the file is checked
- **THEN** the compiler emits **E1102** once for `Point` and does not emit **E1001**
