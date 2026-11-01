## ADDED Requirements

### Requirement: Formatting contract
Corelib SHALL provide `Core.Text.Formatting` with `contract Formatting { string Format(); }`. Every primitive type that can conform and `string` SHALL implement it. An integer SHALL format as decimal digits. A float SHALL format as the shortest text that reads back to the same value. A `bool` SHALL format as `true` or `false`. A `char` SHALL format as its UTF-8 text. A `string` SHALL format as itself.

#### Scenario: Integer and bool
- **GIVEN** the values `42_i64` and `true`
- **WHEN** `Format()` is called through the bound
- **THEN** the results are `"42"` and `"true"`
