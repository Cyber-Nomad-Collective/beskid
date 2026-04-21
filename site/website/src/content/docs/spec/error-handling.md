---
title: "Error Handling"
---


## Result
```beskid
enum Result<T, E> {
    Ok(T),
    Error(E),
}
```

`Result` represents recoverable failures that callers must handle explicitly.

## `?` Operator
`?` propagates an error to the caller if the value is `Error`.

This is equivalent to early return on `Error`.

## Decisions
- Recoverable errors use `Result<T, E>`.
- Unrecoverable errors use `panic`.
- `?` is the standard propagation operator for `Result`.
- `?` is not defined for `Option<T>` in v0.1.

## Panic
`panic` aborts execution when the program is in an invalid state.

Example:
```beskid
i32 index(i32[] values, i32 i) {
    if i < 0 || i >= values.len() { panic("index out of range"); }
    return values[i];
}
```

Example:
```beskid
Result<i32, string> parse_port(string s) {
    let p = int.parse(s)?;
    if p < 1 || p > 65535 {
        return Error("port out of range");
    }
    return Ok(p);
}
```

## Example
```beskid
Option<i32> maybe_port(string s) {
    // explicit matching; `?` is only for Result in v0.1
    match int.parse(s) {
        Ok(v) => Some(v),
        Error(_) => None,
    }
}
```

Canonical stdlib API contract for `Result` is documented in `docs/standard-library/Core/Results.md`.
