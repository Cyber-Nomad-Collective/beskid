## ADDED Requirements

### Requirement: Struct literals in condition, iterable and scrutinee positions
The grammar SHALL NOT parse a struct literal at the top level of an `if` condition, a `while` condition, a `for` iterable or a `match` scrutinee. In these positions a path followed by `{` SHALL end the expression, and the `{` SHALL open the statement body or the match arms. A struct literal in these positions SHALL be written in parentheses. Inside a nested delimited position of such an expression (parentheses, call or enum-constructor arguments, subscripts, array literals, blocks, match arms, macro arguments and string or code interpolations) the grammar SHALL parse struct literals as in every other expression position. The restriction SHALL NOT add, remove or rename syntax nodes, and it SHALL NOT change the source span of any node.

#### Scenario: Empty block after a path in a condition
- **GIVEN** `if a == b {}`
- **WHEN** the reference parser builds its syntax tree
- **THEN** the condition is the binary expression `a == b` with the path `b` as its right operand, and the then block is empty

#### Scenario: Empty loop and match bodies
- **GIVEN** `while i < n {}`, `for x in xs {}` and `match x {};`
- **WHEN** the reference parser builds its syntax tree
- **THEN** the condition, iterable and scrutinee are the paths `n`, `xs` and `x`, and each body or arm list is empty

#### Scenario: Parenthesized struct literal in a condition
- **GIVEN** `if (P { x: 1 }) == p {}`
- **WHEN** the reference parser builds its syntax tree
- **THEN** the left operand is a grouped expression that contains the struct literal `P { x: 1 }`

#### Scenario: Struct literal in call arguments inside a condition
- **GIVEN** `if Same(P { x: 1 }, p) {}`
- **WHEN** the reference parser builds its syntax tree
- **THEN** the first call argument is the struct literal `P { x: 1 }`

#### Scenario: Unparenthesized struct literal at the end of a condition
- **GIVEN** `if p == P { x: 1 } { return; }`
- **WHEN** the reference parser parses the source
- **THEN** it reports a parse error
