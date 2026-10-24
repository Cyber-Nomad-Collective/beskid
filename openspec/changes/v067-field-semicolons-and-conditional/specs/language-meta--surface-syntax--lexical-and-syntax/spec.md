## ADDED Requirements

### Requirement: Conditional expression grammar and precedence
The grammar SHALL contain the conditional expression `cond ? a : b`. It SHALL bind more loosely than `||` and more tightly than assignment. It SHALL be right-associative: `c1 ? a : c2 ? b : d` SHALL group as `c1 ? a : (c2 ? b : d)`. The branches `a` and `b` SHALL be full expressions that may themselves be conditional expressions. The postfix error-propagation `?` SHALL remain distinct from the conditional `?`.

#### Scenario: Right associativity
- **GIVEN** `x = c1 ? 1 : c2 ? 2 : 3`
- **WHEN** the expression is parsed
- **THEN** the value of the conditional is assigned to `x`, and the inner conditional is the else branch of the outer one

#### Scenario: Propagation stays distinct
- **GIVEN** `let v = Parse(text)?;`
- **WHEN** the statement is parsed
- **THEN** the `?` is the propagation suffix and not a conditional
