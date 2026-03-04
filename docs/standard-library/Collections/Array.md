# Collections.Array

## Purpose
Define contiguous array primitives and contracts.

## MVP surface
- `Array.Len<T>(T[] values) -> i64`
- `Array.Iterate<T>(T[] values) -> ArrayIter<T>`

## Notes
- Array behavior should stay close to runtime representation.
- Bounds and safety semantics are language-level guarantees.
