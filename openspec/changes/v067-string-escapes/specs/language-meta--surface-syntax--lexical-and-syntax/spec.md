## ADDED Requirements

### Requirement: String literal escape sequences
A string literal SHALL accept these escape sequences: `\"` (quotation mark), `\\` (backslash), `\${` (literal interpolation opener), `\n` (U+000A), `\t` (U+0009), `\r` (U+000D), `\0` (U+0000), and `\u{H}` where `H` is one to six hexadecimal digits. The value of `\u{H}` SHALL be the Unicode scalar value that the digits spell. The lexer SHALL report an error for a `\u{H}` whose value is in the range U+D800 to U+DFFF or is greater than U+10FFFF. The lexer SHALL report an error for a `\u` that is not followed by a braced digit sequence. The lexer SHALL report an error for every other backslash sequence. Escape sequences SHALL NOT apply inside a char literal, which keeps only `\'`.

#### Scenario: Newline and tab
- **GIVEN** the literal `"a\tb\n"`
- **WHEN** the literal is decoded
- **THEN** the value is the characters `a`, TAB, `b`, LF

#### Scenario: Unicode scalar value
- **GIVEN** the literal `"\u{1F600}"`
- **WHEN** the literal is decoded
- **THEN** the value is the single scalar value U+1F600

#### Scenario: Surrogate value
- **GIVEN** the literal `"\u{D800}"`
- **WHEN** the literal is lexed
- **THEN** the lexer SHALL report an error

#### Scenario: Unknown escape
- **GIVEN** the literal `"\q"`
- **WHEN** the literal is lexed
- **THEN** the lexer SHALL report an error that names the sequence `\q`
