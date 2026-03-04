# Collections.Map

## Purpose
Key/value associative container with explicit semantics.

## Candidate surface
- `Map<TKey, TValue>.Set(TKey key, TValue value) -> unit`
- `Map<TKey, TValue>.TryGet(TKey key) -> Result<TValue, MapError>`
- `Map<TKey, TValue>.ContainsKey(TKey key) -> bool`

## Notes
- Hashing/equality rules must be deterministic.
- Iteration order guarantees should be documented explicitly.
