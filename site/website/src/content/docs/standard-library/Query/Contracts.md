---
title: "Query.Contracts"
---


## Purpose
Define core iterator contracts used by Query pipelines and `for in` lowering.

## Core contract
```beskid
pub enum Option {
    Some(i64 value),
    None,
}

pub contract Iterator {
    Option Next();
}
```

## Notes
- `for item in expr` consumes iterator-capable values through `Next()`.
- Contract remains backend-neutral and monomorphization-friendly.
