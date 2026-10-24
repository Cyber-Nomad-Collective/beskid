## ADDED Requirements

### Requirement: Test name case diagnostic
The code **W1637** SHALL identify a `test` name that is not PascalCase. The code SHALL keep its number. Before 0.6.7 it identified a test name that was not snake_case. The warning SHALL be reported on the test name token.

#### Scenario: Snake_case test name
- **GIVEN** `test parse_empty_input { }`
- **WHEN** the naming check runs
- **THEN** the compiler SHALL report **W1637** on `parse_empty_input`

#### Scenario: PascalCase test name
- **GIVEN** `test ParseEmptyInput { }`
- **WHEN** the naming check runs
- **THEN** no diagnostic is reported
