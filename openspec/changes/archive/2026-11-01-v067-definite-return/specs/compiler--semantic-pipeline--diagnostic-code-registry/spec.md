## ADDED Requirements

### Requirement: Missing return at end of body
The code **E1258** SHALL identify a function or method whose declared result is not `unit` or `never` and whose end of body is reachable. The message SHALL have the form "`<name>` can reach the end of its body without returning a value". The primary span SHALL be the closing brace of the body. The diagnostic SHALL have a related note at the declared name with the text "`<name>` returns `<type>`".

#### Scenario: Value function without a final return
- **GIVEN** `i32 Main() { 0; }`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1258** at the closing brace with the message "`Main` can reach the end of its body without returning a value" and the note "`Main` returns `i32`"
