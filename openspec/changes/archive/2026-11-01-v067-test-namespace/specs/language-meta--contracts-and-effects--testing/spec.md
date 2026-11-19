## ADDED Requirements

### Requirement: Test discovery with a separate namespace
`beskid test` SHALL discover every `test` item, including a test that shares its name with a function or type. The test report SHALL identify a test by its module and name.

#### Scenario: Shared name is discovered
- **GIVEN** a function `Parse` and `test Parse { }`
- **WHEN** `beskid test` runs
- **THEN** the test `Parse` runs and appears in the report
