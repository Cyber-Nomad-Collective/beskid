---
description: Type system examples
---

# Type system examples

## Literal defaults
- `let x = 1;` -> `i64`
- `let y = 1.0;` -> `f64`

## Widening
- `let x: i64 = 1;` (implicit `i32` -> `i64` allowed)
- `let y: f64 = 1.0f32;` (implicit `f32` -> `f64` allowed)

## Explicit cast required
- `let x: i32 = 1;` -> error without `cast(i32, 1)`
- `let y: f64 = 1;` -> error without `cast(f64, 1)`

## Mixed arithmetic
- `1 + 2.0` -> error unless one side casted.
