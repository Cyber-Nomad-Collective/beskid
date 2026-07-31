## Question

What compiler constructs still lack ISLE lowering rules, and how should they be grouped into actionable work items for Linear?

Locate or create a mechanical coverage report from the compiler's ISLE rule inventory — cross-reference the full AST/HIR construct catalog against generated or hand-written ISLE lowering rules. Group the gaps into coherent work items (e.g., "Expression forms: LambdaExpression, TryExpression", "Statement forms: ...") and produce a Linear issue per group with the relevant CYB identifiers.

## Constraints

- Must cover every construct in the lowering pipeline; no gaps allowed in the final 0.4 release
- Grouped by AST category so work can be parallelized
- Each group ticket must reference the coverage audit so agents can self-verify
