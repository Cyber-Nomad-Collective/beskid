## ADDED Requirements

### Requirement: Tests have their own namespace
A `test` item SHALL be in a namespace of its own, keyed by module and name. A test SHALL NOT be part of the item scope of its module, and no path SHALL resolve to a test. A test MAY share its name with any non-test item of the module. Two tests with the same name in one module SHALL be **E1102**.

#### Scenario: Test and function share a name
- **GIVEN** a function `Parse` and `test Parse { }` in one module
- **WHEN** the module is resolved
- **THEN** no diagnostic is reported

#### Scenario: Duplicate tests
- **GIVEN** `test Parse { }` twice in one module
- **WHEN** the module is resolved
- **THEN** the compiler SHALL report **E1102** at the second test
