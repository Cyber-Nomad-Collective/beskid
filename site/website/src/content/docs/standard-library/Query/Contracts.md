---
title: "IteratorQuery.Contracts"
---


## Purpose
Define core iterator contracts used by the `IteratorQuery` feature, including pipelines and `for in` lowering.

## Core contract
```beskid
pub contract Iterator<T> {
    Option<T> Next();
}
```

## Notes
- `for item in expr` consumes iterator-capable values through `Next()`.
- Contract remains backend-neutral and monomorphization-friendly.
