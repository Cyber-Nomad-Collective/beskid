## ADDED Requirements

### Requirement: Immutable assignment is reported once per binding
Assignment to an immutable binding SHALL be reported with **E1214** once per binding, at the name of the declaration. Each assignment to the binding SHALL be a related location with the label "assigned again". The help SHALL write the declaration with `mut`. The diagnostic SHALL carry a machine-applicable fix that inserts `mut ` before the type of a typed local or a parameter, or after `let`. The iterator of a `for` loop SHALL get the help without a fix.

#### Scenario: Two assignments
- **GIVEN** `i64 x = 1; x = 2; x = 3;`
- **WHEN** the code is checked
- **THEN** one **E1214** is reported at the declaration of `x`, with two related locations "assigned again" and a fix that gives `mut i64 x = 1;`
