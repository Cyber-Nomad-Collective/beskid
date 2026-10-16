## ADDED Requirements

### Requirement: Glue uses one boundary vocabulary
The Glue boundary SHALL use one type vocabulary. Either every admitted Glue logical type SHALL lower to an interop `TypeShape` and `InteropSignature` through one function, verified by a test that round trips every admitted form, or the interop contracts SHALL NOT describe Glue boundaries. The choice is recorded by task 1.2 of this change.

#### Scenario: Every admitted form round trips
- **GIVEN** the set of admitted Glue logical types
- **WHEN** the boundary vocabulary test runs
- **THEN** each admitted form maps to exactly one interop shape and back to the same logical type, or the interop contracts contain no Glue boundary text
