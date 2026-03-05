---
title: "Core.Results"
---


## Purpose
Define the canonical `Result<TValue, TError>` shape and usage policy.

## Baseline shape
```beskid
pub enum Result<TValue, TError> {
    Ok(TValue value),
    Error(TError error),
}
```

## Usage policy
- Use `Result<TValue, TError>` when failure is expected.
- Do not hide recoverable failure via panic-only APIs.
- Keep `TError` domain-specific.
