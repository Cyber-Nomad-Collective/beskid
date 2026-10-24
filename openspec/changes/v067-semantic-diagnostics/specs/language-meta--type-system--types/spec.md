## ADDED Requirements

### Requirement: Result and Option mismatch help
When an expression of type `Result<T, E>` or `Option<T>` is used where `T` is expected, the mismatch diagnostic SHALL print the short type names and SHALL give the help "add `?` to propagate the error, or `match` on the result". The help SHALL NOT suggest a cast. A cast SHALL be suggested only between numeric primitive types.

#### Scenario: Result where a value is expected
- **GIVEN** `i64 n = Parse(text);` where `Parse` returns `Result<i64, ParseError>`
- **WHEN** the code is checked
- **THEN** the mismatch help says to add `?` or to `match`, and does not suggest a cast
