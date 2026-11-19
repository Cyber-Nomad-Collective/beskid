## ADDED Requirements

### Requirement: Invalid primitive implementation E1611
The code **E1611** SHALL identify an invalid implementation block for a primitive type. It SHALL be reported at the block, and the block SHALL issue no conformance.

#### Scenario: Unit cannot conform
- **GIVEN** `impl unit : Formatting { }`
- **WHEN** the block is checked
- **THEN** the compiler SHALL report **E1611**
