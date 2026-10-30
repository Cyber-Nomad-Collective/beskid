## ADDED Requirements

### Requirement: Ambiguous module qualifier diagnostic
The code **E1104** SHALL also identify a qualified path whose first segment names both an inline module and a `use` alias, where each of them reaches a different item for the rest of the path. The message SHALL have the form "ambiguous module `<Name>`: both the inline module `<Name>` and the import `<Path>` declare `<Member>`". The primary span SHALL be the path. The help SHALL tell the user to rename the inline module or to import the module under another name with `use <Path> as <Name>;`.

#### Scenario: Ambiguous qualifier message
- **GIVEN** `use Core.Random;`, `mod Random { pub i64 New() { return 5; } }` and `return Random.New();`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1104** at `Random.New` with the message "ambiguous module `Random`: both the inline module `Random` and the import `Core.Random` declare `New`"
