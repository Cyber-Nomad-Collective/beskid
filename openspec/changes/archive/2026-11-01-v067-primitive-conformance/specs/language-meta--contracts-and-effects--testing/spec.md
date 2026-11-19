## ADDED Requirements

### Requirement: Generic equality assertions
`Testing.Assert.Equal<T>`, `Testing.Assert.NotEqual<T>` and `Testing.Expect.Equal<T>` SHALL require `T: Formatting`. The failure record SHALL carry `Format()` of the expected and the actual value. The functions `Expect.EqualI64`, `Expect.EqualString` and `Expect.EqualBool` SHALL NOT exist.

#### Scenario: Failure carries both values
- **GIVEN** `Assert.Equal<i64>(3, 4)`
- **WHEN** the assertion fails
- **THEN** the failure record carries "3" and "4"
