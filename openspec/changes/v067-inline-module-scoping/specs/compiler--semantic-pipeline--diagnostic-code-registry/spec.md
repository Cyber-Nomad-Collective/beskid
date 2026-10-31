## ADDED Requirements

### Requirement: Ambiguous module qualifier diagnostic
The code **E1104** SHALL also identify a qualified path whose first segment names both an inline module and a `use` alias, where each of them reaches a different item for the rest of the path. The message SHALL have the form "ambiguous module `<Name>`: both the inline module `<Name>` and the import `<Path>` declare `<Member>`". The primary span SHALL be the path. The help SHALL tell the user to rename the inline module or to import the module under another name with `use <Path> as <Name>;`.

#### Scenario: Ambiguous qualifier message
- **GIVEN** `use Core.Random;`, `mod Random { pub i64 New() { return 5; } }` and `return Random.New();`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1104** at `Random.New` with the message "ambiguous module `Random`: both the inline module `Random` and the import `Core.Random` declare `New`"

### Requirement: One code per duplicate name
A duplicate function, type, enum, contract, `use` alias, module declaration, constant or test in one scope SHALL be reported only as **E1102**. The codes **E1001** and **E1006** SHALL NOT be emitted and SHALL NOT be in the code registry; they SHALL NOT be reused for another meaning. **E1104** SHALL identify an ambiguous name or module path, not a duplicate `use` alias.

#### Scenario: Duplicate use alias
- **GIVEN** `use Core.Random;` twice in one scope
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1102** once and SHALL NOT report **E1006** or **E1104**

#### Scenario: Duplicate type
- **GIVEN** `type Point { i64 x; }` twice in one scope
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1102** once and SHALL NOT report **E1001**
