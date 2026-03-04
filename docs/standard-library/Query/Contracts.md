# Query.Contracts

## Purpose
Define core query contracts used by pipelines and `for in` lowering.

## Core contract
```beskid
pub contract QuerySource<T> {
    Option<T> Next();
}
```

## Notes
- `for item in expr` consumes query-capable values through `Next()`.
- Contract remains backend-neutral and monomorphization-friendly.
