## ADDED Requirements

### Requirement: Default parameter grammar
A parameter SHALL have the form `Attributes? "bulk"? ("mut" | "move")? Type Identifier ("=" Expression)?`. A parameter with `= Expression` SHALL be optional, and its expression SHALL be its default value. A default value in an event parameter list SHALL be a parse error.

#### Scenario: Optional parameter
- **GIVEN** `unit Log(string text, i64 level = 1) { }`
- **WHEN** the function is parsed
- **THEN** `level` is an optional parameter with the default value `1`
