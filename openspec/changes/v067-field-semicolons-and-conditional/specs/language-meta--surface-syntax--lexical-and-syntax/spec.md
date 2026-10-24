## ADDED Requirements

### Requirement: Conditional expression grammar and precedence
The grammar SHALL contain the conditional expression `cond ? a : b`. It SHALL bind more loosely than `||` and more tightly than assignment. It SHALL be right-associative: `c1 ? a : c2 ? b : d` SHALL group as `c1 ? a : (c2 ? b : d)`. The branches `a` and `b` SHALL be full expressions that may themselves be conditional expressions. The postfix error-propagation `?` binds first. A `?` that is directly followed by `)`, `;`, `,`, `.`, `]`, `}`, another `?`, or a binary operator SHALL be error propagation. Any other `?` SHALL start a conditional expression and SHALL be followed, after its first branch, by `:`. A conditional expression without `:` SHALL be **E0116**, reported at the `?` with the construct start as a related location. Hence `F()? ? x : y` propagates the result of `F()` and then branches.

#### Scenario: Right associativity
- **GIVEN** `x = c1 ? 1 : c2 ? 2 : 3`
- **WHEN** the expression is parsed
- **THEN** the value of the conditional is assigned to `x`, and the inner conditional is the else branch of the outer one

#### Scenario: Propagation then branch
- **GIVEN** `let v = F()? ? 1 : 2;`
- **WHEN** the statement is parsed
- **THEN** the first `?` is error propagation and the second starts the conditional

#### Scenario: Conditional without colon
- **GIVEN** `let v = flag ? 1;`
- **WHEN** the statement is parsed
- **THEN** the parser SHALL report **E0116** at the `?`

#### Scenario: Propagation stays distinct
- **GIVEN** `let v = Parse(text)?;`
- **WHEN** the statement is parsed
- **THEN** the `?` is the propagation suffix and not a conditional
