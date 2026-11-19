## ADDED Requirements

### Requirement: Dead assignment to a mutable parameter
The code **E1259** SHALL identify an assignment to a `mut` parameter whose value no later read of the parameter can observe. The message SHALL have the form "the value assigned to the `mut` parameter `<name>` is never read". The primary span SHALL be the assignment. The diagnostic SHALL have a related note at the parameter declaration with the text "`<name>` is passed by value". The help SHALL tell the user to return the new value, or to assign the fields of the caller's object.

#### Scenario: Dead assignment to a parameter
- **GIVEN** `unit AssignWhole(mut Size s) { s = Size { columns: 80, rows: 24, }; }`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1259** at the assignment with the message "the value assigned to the `mut` parameter `s` is never read" and the note "`s` is passed by value"
