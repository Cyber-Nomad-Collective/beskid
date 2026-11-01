# Design: field semicolons and the conditional expression (0.6.7)

## Fields

The member list of a `type` body is a sequence of members. A field member is `Type name;`, `inject Type name;` or `event Name(params);`. A method member keeps its body and needs no `;`. Enum variants stay comma-separated because a variant list is a list of values, as in C#. The composition spec already writes `inject Configuration configuration;`; this change makes the grammar match it.

## Conditional expression

`cond ? a : b` parses as `ConditionalExpression = LogicalOr ~ ("?" ~ ConditionalExpression ~ ":" ~ ConditionalExpression)?`. It binds looser than `||` and tighter than assignment, so `x = c ? a : b` assigns the conditional, and `c1 ? a : c2 ? b : d` groups as `c1 ? a : (c2 ? b : d)`. The type of the expression is the common type of both branches. The compiler does not widen typed values: the branch types must be equal. A bare literal takes the type of the other branch (see `v067-literal-typing`). Only the chosen branch runs, which matters for side effects and traps. The rule is in the lexical requirement: the parser tries the conditional first; a matching `:` makes it a conditional, otherwise the `?` is error propagation; E0116 applies only when the `?` cannot be propagation and has no matching `:`. A comma between fields is E0115 with a fix.
