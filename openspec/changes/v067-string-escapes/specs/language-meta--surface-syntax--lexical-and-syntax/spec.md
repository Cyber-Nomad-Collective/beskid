## ADDED Requirements

### Requirement: String literal escape sequences
A string literal SHALL accept these escape sequences: `\"` (quotation mark), `\\` (backslash), `\${` (literal interpolation opener), `\n` (U+000A), `\t` (U+0009), `\r` (U+000D), `\0` (U+0000), and `\u{H}` where `H` is one to six hexadecimal digits. The value of `\u{H}` SHALL be the Unicode scalar value that the digits spell. The parser SHALL report **E0110** for a `\u{H}` whose value is in the range U+D800 to U+DFFF or is greater than U+10FFFF. The parser SHALL report **E0110** for a `\u` that is not followed by a braced digit sequence. The parser SHALL report **E0109** for every other backslash sequence. Escape sequences SHALL NOT apply inside a char literal, which keeps only `\'`. A char literal that holds more than one character SHALL be **E0114**.

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
- **THEN** the parser SHALL report **E0110**

#### Scenario: Unknown escape
- **GIVEN** the literal `"\q"`
- **WHEN** the literal is lexed
- **THEN** the parser SHALL report **E0109** and name the sequence `\q`

### Requirement: Compound assignment operators
The assignment operators SHALL be `=`, `+=`, `-=`, `*=`, `/=` and `%=`. For an arithmetic operator `op`, `a op= b` SHALL mean `a = a op b`, with the place `a` evaluated once. The operands SHALL follow the typing rules of the arithmetic operator. In 0.6.7 the target SHALL be a mutable local binding; field and element targets are not yet supported. Assignment to an immutable binding SHALL be **E1214**. For `string`, `+=` SHALL concatenate.

#### Scenario: Multiply and assign
- **GIVEN** `mut i64 x = 3; x *= 4;`
- **WHEN** the code runs
- **THEN** `x` is 12

#### Scenario: Immutable target
- **GIVEN** `i64 x = 3; x %= 2;`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1214**

#### Scenario: Char literal with two characters
- **GIVEN** the literal `'ab'`
- **WHEN** the literal is parsed
- **THEN** the parser SHALL report **E0114**
