# Control Flow

## If/Else
```
if cond {
    ...
} else {
    ...
}
```

`if` requires a boolean condition and does not permit implicit truthiness.

Example:
```
if count > 0 {
    println("positive");
} else {
    println("zero");
}
```

## While
```
while cond {
    ...
}
```

Example:
```
i32 mut i = 0;
while i < 3 {
    println(i);
    i = i + 1;
}
```

## For (v0.1)
General form:
```
for item in expression {
    ...
}
```

### Iterator contract
- `expression` must evaluate to an iterator-capable value.
- Iterator-capable means a resolvable `Next()` method returning `Option<T>`.
- Loop variable type is inferred from `Option<T>::Some(T)` item type.

### Range compatibility fast-path
`range(a, b)` remains supported and keeps its existing behavior:
```
for i in range(0, 10) {
    ...
}
```

`range(a, b)` iterates from `a` (inclusive) to `b` (exclusive).

### Lowering model
- Range expressions may lower through a dedicated numeric fast-path.
- General iterator form lowers to repeated `Next()` calls and loop termination on `None`.

Example:
```
i32 mut sum = 0;
for i in range(0, 4) {
    sum = sum + i;
}
```

## Break/Continue/Return
`break`, `continue`, `return` behave as expected.

Example:
```
for i in range(0, 10) {
    if i == 3 { continue; }
    if i == 7 { break; }
}

i32 zero() {
    return 0;
}
```
