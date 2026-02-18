# 04. Enums and Match

## Algebraic Enums (Rust-like)
```
enum Shape {
    Circle(radius: f64),
    Rect(width: f64, height: f64),
    Point,
}
```

Enums group related variants under a single type. Variants may carry data or be unit-like.

## Match
```
fn area(s: Shape) -> f64 {
    match s {
        Shape::Circle(r) => 3.14159 * r * r,
        Shape::Rect(w, h) => w * h,
        Shape::Point => 0.0,
    }
}
```

`match` is exhaustive: every possible variant must be covered.

## Enum values
Enum variants are constructed using `::` and an argument list:
```
let s = Shape::Circle(2.0);
```

Unqualified constructor names (e.g. `Circle(2.0)`) are not allowed.

The `::` separator is reserved for enum variants only; namespaces and member access use `.`.

Example (unit variant):
```
let p = Shape::Point;
```

## Snippet
```
fn demo() -> f64 {
    let s = Shape::Rect(2.0, 4.0);
    match s {
        Shape::Rect(w, h) => w * h,
        Shape::Circle(r) => 3.14159 * r * r,
        Shape::Point => 0.0,
    }
}
```

## Rules
- Match must be exhaustive.
- `_` is allowed as a catch-all.
- No fallthrough.

Example with `_`:
```
match s {
    Shape::Circle(r) => r,
    _ => 0.0,
}
```

## Decisions
- `match` is an expression and can return a value.
- Guards use the `when` keyword.
- Each arm allows at most one `when` guard.
- Single-variant enums keep a tag (no newtype optimization in v0.1).

### Guard snippet
```
match s {
    Shape::Rect(w, h) when w > 0 => w * h,
    Shape::Rect(_, _) => 0.0,
    Shape::Circle(r) => 3.14159 * r * r,
    Shape::Point => 0.0,
}
```

