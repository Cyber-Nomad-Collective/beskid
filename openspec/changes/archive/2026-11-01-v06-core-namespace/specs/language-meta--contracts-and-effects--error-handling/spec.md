## MODIFIED Requirements

### Requirement: Result and Option representation
Recoverable errors SHOULD use `Core.Results.Result<TValue, TError>` from the `Core` dependency. Projects MUST NOT define a second bare `enum Result` in the same scope as an imported `Core.Results.Result`. Absence of value (not failure) MUST use `Option<T>`, not `null` or sentinel pointers. There is no built-in `Result<T,E>` type alias in v0.1 grammar; callers MUST use the corelib generic enum with explicit type arguments.

#### Scenario: Absence uses Option not null
- **GIVEN** an API that models optional presence of a value
- **WHEN** the API is type-checked against v0.1 rules
- **THEN** the type MUST be `Option<T>` (or an explicit absent-variant enum), not a nullable reference
