## ADDED Requirements

### Requirement: Field declarations end with a semicolon
Each field declaration in a `type` body SHALL end with `;`. This SHALL apply to value fields (`i32 x;`), `inject` fields (`inject Configuration configuration;`) and `event` fields (`event Changed();`). The parser SHALL report **E0115** at the comma when a comma follows a field declaration. The help SHALL say to end the field with `;`, and the diagnostic SHALL carry a fix that replaces `,` with `;`. Enum variants, struct literal fields, arguments and array literals SHALL keep comma separation.

#### Scenario: Fields with semicolons
- **GIVEN** `type Point { i32 x; i32 y; }`
- **WHEN** the type is parsed
- **THEN** the type has the fields `x` and `y` and no diagnostic is reported

#### Scenario: Comma between fields
- **GIVEN** `type Point { i32 x, i32 y }`
- **WHEN** the type is parsed
- **THEN** the parser SHALL report **E0115** at the comma with a fix that replaces `,` with `;`

#### Scenario: Enum variants keep commas
- **GIVEN** `enum Color { Red, Green, Blue }`
- **WHEN** the enum is parsed
- **THEN** no diagnostic is reported
