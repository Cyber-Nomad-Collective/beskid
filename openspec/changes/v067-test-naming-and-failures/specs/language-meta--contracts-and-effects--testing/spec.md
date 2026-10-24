## ADDED Requirements

### Requirement: Assertion failure reporting
A failed assertion in `Testing.Assert` SHALL end the test as a test failure. It SHALL NOT end the test as a runtime trap. The failure report SHALL name the test, the call site of the `Assert` call (file, line and column), the expected value and the actual value. The report text SHALL have the form `assertion failed: expected <expected>, found <actual>`. A runtime trap during a test body SHALL be reported separately, with the form `test crashed: <reason>`, and SHALL NOT be reported as an assertion failure. Both outcomes SHALL count as failures in the run summary. Language-server and editor integrations SHALL show an assertion failure as an error on the line of the `Assert` call.

#### Scenario: Assertion failure
- **GIVEN** a test whose body calls `Assert.Equal(3, Add(1, 3))`
- **WHEN** the test runs
- **THEN** the runner reports `assertion failed: expected 3, found 4` under the test name, with the location of the `Assert.Equal` call

#### Scenario: Runtime trap
- **GIVEN** a test whose body divides by zero
- **WHEN** the test runs
- **THEN** the runner reports `test crashed:` with the trap reason and does not report an assertion failure

#### Scenario: Failure count
- **GIVEN** one failed assertion and one crashed test
- **WHEN** the run ends
- **THEN** the summary counts two failures
