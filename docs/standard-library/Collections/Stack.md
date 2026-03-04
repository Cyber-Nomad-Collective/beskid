# Collections.Stack

## Purpose
LIFO collection for scoped and algorithmic workflows.

## Candidate surface
- `Stack<T>.Push(T value) -> unit`
- `Stack<T>.TryPop() -> Result<T, StackError>`
- `Stack<T>.Count() -> i64`

## Notes
- Error behavior for empty stack must be explicit.
- Growth controls should be documented for deterministic performance.
