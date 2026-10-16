## MODIFIED Requirements

### Requirement: Static type rules and diagnostics
Duplicate type or member names in the same scope MUST error with **E1102**, reported once per duplicate (name resolution, "Visibility, duplicates, and shadowing"); **E1001** and **E1006** SHALL NOT be reported for a duplicate binding. Unknown types in definitions MUST error (**E1005**, **E1201**). Generic arity MUST match at use sites (**E1203**, **E1204**). `unit` is the statement-result type; `never` is the bottom type for non-returning calls. Array values MUST use the `BeskidArray` layout documented in execution ABI material. L2 conforming implementations MUST reject programs with unknown types, arity mismatches, and invalid field access per the reference query gate tests in `beskid_queries`; the legacy `beskid_analysis` `TypeChecker` is retired and is not a conformance reference.

#### Scenario: Generic arity mismatch
- **GIVEN** a generic type used with the wrong number of type arguments
- **WHEN** type checking runs
- **THEN** the compiler emits **E1203** or **E1204**

#### Scenario: Duplicate member
- **GIVEN** `type Account { i64 balance, unit balance() {} }`
- **WHEN** the type is checked
- **THEN** the compiler emits **E1102** once for `balance`
