# 07. Error Handling

## Result
```
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

`Result` represents recoverable failures that callers must handle explicitly.

## `?` Operator
`?` propagates an error to the caller if the value is `Err`.

This is equivalent to early return on `Err`.

## Decisions
- Recoverable errors use `Result<T, E>`.
- Unrecoverable errors use `panic`.
- `?` is the standard propagation operator for `Result`.
- `?` is not defined for `Option<T>` in v0.1.

## Panic
`panic` aborts execution when the program is in an invalid state.

Example:
```
fn index(values: i32[], i: i32) -> i32 {
    if i < 0 || i >= values.len() { panic("index out of range"); }
    return values[i];
}
```

Example:
```
fn parse_port(s: string) -> Result<i32, string> {
    let p = int.parse(s)?;
    if p < 1 || p > 65535 {
        return Err("port out of range");
    }
    return Ok(p);
}
```

## Example
```
fn maybe_port(s: string) -> Option<i32> {
    // explicit matching; `?` is only for Result in v0.1
    match int.parse(s) {
        Ok(v) => Some(v),
        Err(_) => None,
    }
}
```
