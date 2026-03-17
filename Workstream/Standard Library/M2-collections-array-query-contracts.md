# M2 — Collections + Query Contracts

## Goal
Deliver collection fundamentals and query protocol primitives.

## Scope
- `Collections.Array`, `List`, `Map`, `Set`, `Queue`, `Stack`
- `Query.Contracts`

## Tasks
1. Implement `Array.Len` and iterator-facing surface.
2. Add collection candidate APIs with explicit semantics.
3. Define query iteration contract (`Iterator<T>`) and option result shape.
4. Align `for in` compatibility with contract-based iteration.

## Acceptance
- Collection APIs compile and expose documented surfaces.
- Query contracts are backend-neutral and monomorphization-friendly.
