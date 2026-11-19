## ADDED Requirements

### Requirement: Glue uses Interop.Contracts as its one boundary vocabulary
Every admitted Glue logical type SHALL lower to an Interop.Contracts `TypeShape` through one function, and every Glue binding SHALL lower to an `InteropSignature` through one function. The C ABI profile SHALL bind each lowered shape. Lifting a lowered shape SHALL give back the same Glue logical form, in which declaration keys are replaced by their stable qualified identities. Glue emitters SHALL take record layout from the C ABI profile binding of the lowered shape and SHALL NOT compute it again. The `TypeShape` vocabulary SHALL include branded handles, records, enumerations and callbacks, and scalar shapes SHALL carry a value domain (raw, Bool, Unicode scalar or native word).

#### Scenario: Every admitted form round trips
- **GIVEN** each admitted Glue form: every scalar primitive, `unit`, UTF-8, bytes, a nullable and a non-nullable branded handle, a record, an enumeration and a callback
- **WHEN** the boundary vocabulary test lowers the form and lifts the shape
- **THEN** the lifted form equals the original form and the C ABI profile permits the shape

#### Scenario: Unspecialized generic position does not lower
- **GIVEN** a Glue export with an unspecialized generic parameter
- **WHEN** its signature is lowered to an `InteropSignature`
- **THEN** lowering fails before generation
