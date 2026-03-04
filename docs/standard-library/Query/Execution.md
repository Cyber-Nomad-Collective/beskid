# Query.Execution

## Purpose
Specify query execution model and performance constraints.

## Execution model
- Pipelines monomorphize into concrete chains.
- No virtual dispatch required for `Next()` in optimized paths.
- Capturing lambdas follow closure non-escape rules.

## Guarantees
- Predictable lowering into loops/conditionals.
- No hidden heap allocation per element in baseline operators.
