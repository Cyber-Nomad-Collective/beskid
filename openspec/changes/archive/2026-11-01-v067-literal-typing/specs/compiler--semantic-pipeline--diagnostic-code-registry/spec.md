## ADDED Requirements

### Requirement: Literal does not fit its type
The code **T0905** SHALL identify a numeric literal whose value does not fit the type given by its context or suffix. The message SHALL have the form "`<value>` does not fit in `<type>`" and SHALL be reported at the literal. The literal SHALL NOT be wrapped or truncated.

#### Scenario: Negative unsigned
- **GIVEN** `u32 x = -1;`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **T0905** with the message "`-1` does not fit in `u32`"
