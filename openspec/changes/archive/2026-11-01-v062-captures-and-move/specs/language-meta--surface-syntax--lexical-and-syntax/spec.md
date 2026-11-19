## MODIFIED Requirements

### Requirement: Identifier and keyword lexical rules
Identifiers MUST match the `Identifier` production (ASCII letter or `_` followed by alphanumeric/`_` characters) and MUST NOT spell a reserved `Keyword`. Reserved keywords, including DI tokens such as `host`, `registry`, `scope`, `launch`, and `inject`, MUST be tokenized as keywords even when unused in a given compilation unit.

`move` SHALL be a reserved keyword (`MoveKeyword = @{ "move" ~ !IdentTail }` listed in `Keyword`). `exchange` SHALL NOT be a keyword; it is a builtin resolved by name.

#### Scenario: Keyword rejected as identifier
- **GIVEN** source that uses a reserved keyword as a binding name
- **WHEN** the lexer and parser process the input
- **THEN** the name is not accepted as an `Identifier`

#### Scenario: move rejected as identifier
- **GIVEN** `i64 move = 1;`
- **WHEN** the statement is parsed
- **THEN** the parser rejects `move` as an `Identifier`

## ADDED Requirements

### Requirement: move grammar productions
The grammar SHALL add `MoveExpression = { MoveKeyword ~ PostfixExpression }` as an alternative of `UnaryExpression` beside `SpawnUnary` and `PrefixUnary`; `Parameter = { BulkKeyword? ~ (MutKeyword | MoveKeyword)? ~ BeskidType ~ Identifier }`; and `ReceiverParameter = { AttributeList? ~ (MutKeyword | MoveKeyword)? ~ "this" }` as the optional first entry of a method `ParameterList`. The syntax model SHALL expose `MoveExpression`, a `movable: bool` on `Parameter` and a `ReceiverParameter` node; the formatter SHALL emit `move` followed by one space in each position; semantic tokens SHALL tag `move` as a keyword.

#### Scenario: Move expression parses as a unary
- **GIVEN** `Archive a2 = archive.Add(move buffer);`
- **WHEN** the statement is parsed
- **THEN** `move buffer` is a `MoveExpression` whose operand is the path `buffer`, and `-move x` is rejected

#### Scenario: Receiver and parameter modifiers round-trip
- **GIVEN** `pub Archive Add(move this, move u8[] block) { return this; }`
- **WHEN** the method is parsed and formatted
- **THEN** the formatter emits the signature unchanged and `mut move u8[] block` is rejected by the parser
