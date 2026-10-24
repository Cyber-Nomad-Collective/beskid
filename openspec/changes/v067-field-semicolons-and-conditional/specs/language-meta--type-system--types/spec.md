## ADDED Requirements

### Requirement: Field declarations end with a semicolon
Each field declaration in a `type` body SHALL end with `;`. This SHALL apply to value fields (`i32 x;`), `inject` fields (`inject Configuration configuration;`) and `event` fields (`event Changed();`). The parser SHALL report a parse error, with a code from E0101–E0199, when a comma follows a field declaration, and the help SHALL say to end the field with `;`. Enum variants, struct literal fields, arguments and array literals SHALL keep comma separation.

#### Scenario: Fields with semicolons
- **GIVEN** `type Point { i32 x; i32 y; }`
- **WHEN** the type is parsed
- **THEN** the type has the fields `x` and `y` and no diagnostic is reported

#### Scenario: Comma between fields
- **GIVEN** `type Point { i32 x, i32 y }`
- **WHEN** the type is parsed
- **THEN** the parser SHALL report a parse error at the comma with the help to end the field with `;`

#### Scenario: Enum variants keep commas
- **GIVEN** `enum Color { Red, Green, Blue }`
- **WHEN** the enum is parsed
- **THEN** no diagnostic is reported
