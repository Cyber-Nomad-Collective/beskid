# Design: definite return (0.6.7)

## Rule

A statement *completes normally* when execution can continue with the statement after it. The end of a body is reachable when every statement of the body completes normally. A function or method whose declared result is not `unit` or `never` must not have a reachable end of body (E1258).

The rule follows C# definite-return semantics where Beskid had no ruling, with one difference: Beskid does not evaluate `if` conditions at compile time. The rule is the same one that lowering implements (the ISLE emitter plants an unreachable trap after an `if`/`else` whose branches all leave, after an infinite `while (true)`, after a `match` with no reachable merge, and after a call that returns `never`), so a body that the check accepts always ends its final block.

## Rulings

| Construct | Completes normally |
|-----------|-------------------|
| `return`, `continue` | Never |
| `break` | Never; it makes the end of its innermost loop reachable |
| `let`, `launch` | Always |
| `for` | Always (the loop can run zero times) |
| `while (cond)` | Always, except when `cond` is the literal `true` (with or without grouping parentheses, as `beskid fmt` writes it) and the body has no reachable `break` for this loop. No other condition is evaluated at compile time (`while (1 == 1)` completes normally). |
| `if (cond) { }` without `else` | Always, also for `if (true)` (no constant folding of `if` conditions; C# would fold `true`) |
| `if`/`else`, `else if` | When at least one branch completes normally |
| `with`, scoped `use` with a block | When the body completes normally |
| Nested block `{ ... };` | When its statements complete normally |
| `match` statement | When an arm body completes normally, or when the match can end without an arm. An enum match cannot end without an arm (its variants are exhaustive, E1304). A primitive match can, unless it has an unguarded `_` or binding arm. A `bool` match with `true` and `false` arms but no catch-all therefore completes normally. |
| Call statement whose proven result is `never` | Never |
| Any other expression statement | Always |

- Statements after a statement that does not complete normally are unreachable (W1403) and do not make the end reachable.
- A `break` inside a nested loop belongs to that loop; it does not make an outer `while (true)` finite.
- A `return` inside a lambda returns from the lambda; lambda bodies are not part of the enclosing body. Lambdas have no declared result and are not judged by this rule.
- `unit` callables (also a test, which declares no result) and `never` callables are not judged by this rule.
- Expression-bodied methods (`=> expr;`) are a `return` of the expression and always satisfy the rule.
- Functions with `[Export]`, Mod and SDK callbacks, methods in `type`, `impl` and `extend type` blocks follow the same rule.

## Placement

The fact is `missing_return` in the legality gate (`check_items`). The gate runs before specialization and lowering in `beskid build`, `beskid test` and `beskid run`, and in `beskid check` and the language server. The diagnostic span is the closing brace of the body block. The related note at the declared name names the function and its declared result.
