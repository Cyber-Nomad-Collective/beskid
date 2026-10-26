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

### Requirement: A project without tests passes
`beskid test` without `--target` on a project whose manifest has no `Test` or `Lib` target (for example a project with only an `App` target) SHALL run no tests, SHALL print "No tests found." and SHALL exit with status 0, as it does for a `Lib` target that declares no `test` item. With `--json` the command SHALL write one `result` record with status `success` and a summary with zero tests. `beskid test --target <name>` where `<name>` is not a `Test` or `Lib` target of the manifest SHALL fail with a message that names the target.

#### Scenario: App-only project
- **GIVEN** a project whose manifest declares only `target "app" { kind = App; entry = "Main.bd"; }`
- **WHEN** `beskid test --project <project>` runs
- **THEN** the command prints "No tests found." and exits with status 0

#### Scenario: Selected target that is not a test target
- **GIVEN** the same project
- **WHEN** `beskid test --project <project> --target app` runs
- **THEN** the command fails with "target `app` is not a Test or Lib target"
