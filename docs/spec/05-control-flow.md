# 05. Control Flow

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
let mut i = 0;
while i < 3 {
    println(i);
    i = i + 1;
}
```

## For (v0.1)
Range-only:
```
for i in range(0, 10) {
    ...
}
```

`range(a, b)` iterates from `a` (inclusive) to `b` (exclusive).

Example:
```
let mut sum = 0;
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
