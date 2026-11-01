## ADDED Requirements

### Requirement: Qualified test identity and selection
The identity of a test SHALL be its qualified name relative to its source unit: the names of the inline modules that enclose it, outermost first, followed by the test name, joined by `::`. A test at the unit root SHALL have its name alone as identity. Test discovery, the `qualified_name` of each test in the `beskid test` report, and the selection of the test that the runner builds and runs SHALL all use this identity. A selection that names no test SHALL fail the build of the test target. A selection that names more than one test SHALL fail the build of the test target and SHALL NOT select one of them. Two tests with the same name in different inline modules SHALL be distinct tests.

#### Scenario: Nested test runs by its qualified name
- **GIVEN** `mod Topic { test Inner { } }` in a Test target
- **WHEN** `beskid test` runs
- **THEN** the report contains the test `Topic::Inner` with outcome `passed`, and the build reports no missing test

#### Scenario: Failing nested test fails
- **GIVEN** `mod Topic { test Broken { Assert.Fail("x"); } }` in a Test target
- **WHEN** `beskid test` runs
- **THEN** the report contains the test `Topic::Broken` with outcome `failed`, and the command fails

#### Scenario: Same-named tests in two modules
- **GIVEN** `mod Alpha { test Shared { } }`, `mod Beta { test Shared { } }` and `test Shared { }` in one file
- **WHEN** the file is checked and `beskid test` runs
- **THEN** the check reports no duplicate name, and the report contains `Alpha::Shared`, `Beta::Shared` and `Shared`, each with its own outcome

#### Scenario: Bare name does not select a nested test
- **GIVEN** `mod Topic { test Inner { } }` and no test `Inner` at the unit root
- **WHEN** the selection `Inner` is built
- **THEN** the build fails because no test has the identity `Inner`
