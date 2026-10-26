## ADDED Requirements

### Requirement: Conditional expression grammar and precedence
The grammar SHALL contain the conditional expression `cond ? a : b`. It SHALL bind more loosely than `||` and more tightly than assignment. It SHALL be right-associative: `c1 ? a : c2 ? b : d` SHALL group as `c1 ? a : (c2 ? b : d)`. The branches `a` and `b` SHALL be full expressions that may themselves be conditional expressions. A `?` after a complete operand SHALL be resolved as follows. The parser SHALL first try the conditional expression: it SHALL parse a full expression as the first branch and look for the matching `:`. When a matching `:` completes the conditional, the `?` SHALL start a conditional expression. Otherwise the `?` SHALL be the error-propagation suffix. A `?` that cannot be error propagation, because the token after it cannot continue an expression that ends in a propagation suffix, and that has no matching `:`, SHALL be **E0116** at the `?`, with the construct start as a related location. Hence `c ? -1 : 2` is a conditional, `x? - 1` is propagation followed by a subtraction, and `F()? ? x : y` propagates the result of `F()` and then branches.

#### Scenario: Right associativity
- **GIVEN** `x = c1 ? 1 : c2 ? 2 : 3`
- **WHEN** the expression is parsed
- **THEN** the value of the conditional is assigned to `x`, and the inner conditional is the else branch of the outer one

#### Scenario: Propagation then branch
- **GIVEN** `let v = F()? ? 1 : 2;`
- **WHEN** the statement is parsed
- **THEN** the first `?` is error propagation and the second starts the conditional

#### Scenario: Negative literal in a branch
- **GIVEN** `let v = c ? -1 : 2;`
- **WHEN** the statement is parsed
- **THEN** the `?` starts a conditional with the branches `-1` and `2`

#### Scenario: Propagation before a binary operator
- **GIVEN** `let v = x? - 1;`
- **WHEN** the statement is parsed
- **THEN** no matching `:` exists, so the `?` is error propagation and the result is subtracted by 1

#### Scenario: Conditional without colon
- **GIVEN** `let v = flag ? 1;`
- **WHEN** the statement is parsed
- **THEN** the parser SHALL report **E0116** at the `?`

#### Scenario: Propagation stays distinct
- **GIVEN** `let v = Parse(text)?;`
- **WHEN** the statement is parsed
- **THEN** the `?` is the propagation suffix and not a conditional

### Requirement: Statement-level match needs no semicolon
An expression statement that starts with `match` SHALL NOT need a terminating `;`. A `;` after it SHALL stay valid. The formatter SHALL keep the written form and SHALL NOT add or remove the `;`.

#### Scenario: Match without semicolon
- **GIVEN** `match k { 0 => Log("zero"), _ => Log("other") }` as a statement
- **WHEN** the statement is parsed
- **THEN** no diagnostic is reported
