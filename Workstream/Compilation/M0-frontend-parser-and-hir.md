# M0: Frontend (parser + HIR) parity

Goals
- Ensure grammar + syntax tree align with spec chapters

Tasks
- Verify tokens/keywords (including event, ref/out, lambdas)
- Audit string interpolation parsing and escaping edge cases
- Add parser tests from spec examples
- HIR invariants audit; ensure attributes/events are fully represented

Exit criteria
- Parser/HIR tests for lexical-and-syntax and types pass in CI

