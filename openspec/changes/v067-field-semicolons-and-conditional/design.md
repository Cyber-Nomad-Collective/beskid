# Design: field semicolons and the conditional expression (0.6.7)

## Fields

The member list of a `type` body is a sequence of members. A field member is `Type name;`, `inject Type name;` or `event Name(params);`. A method member keeps its body and needs no `;`. Enum variants stay comma-separated because a variant list is a list of values, as in C#. The composition spec already writes `inject Configuration configuration;`; this change makes the grammar match it.

## Conditional expression

`cond ? a : b` parses as `ConditionalExpression = LogicalOr ~ ("?" ~ ConditionalExpression ~ ":" ~ ConditionalExpression)?`. It binds looser than `||` and tighter than assignment, so `x = c ? a : b` assigns the conditional, and `c1 ? a : c2 ? b : d` groups as `c1 ? a : (c2 ? b : d)`. The type of the expression is the common type of both branches. The compiler does not widen: the branch types must be equal. Only the chosen branch runs, which matters for side effects and traps. A `?` after an expression that is a `Result` or `Option` value is the error-propagation suffix of the language; the grammar distinguishes the two by the following `:` and the position (suffix `?` is postfix on a primary, conditional `?` follows a complete operand with space-separated operands). The parse slice records the exact disambiguation rule.
