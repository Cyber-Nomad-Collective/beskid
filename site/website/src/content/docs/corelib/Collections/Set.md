---
title: "Collections.Set"
---


## Purpose
Uniqueness-preserving collection for membership operations.

## Candidate surface
- `Set<T>.Add(T value) -> bool`
- `Set<T>.Contains(T value) -> bool`
- `Set<T>.Remove(T value) -> bool`

## Notes
- Equality semantics must match `Map` key semantics.
- Capacity behavior should be explicit for performance-sensitive code.
