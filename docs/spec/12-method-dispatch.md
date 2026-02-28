# 12. Method Dispatch

## Model (v0.1)
- Static dispatch for concrete types.
- Dynamic dispatch only via `contract` values.

Static dispatch resolves calls at compile time. Dynamic dispatch uses a vtable when a value is typed as a contract.

## Method form
Methods are defined within an `impl` block for a specific type:
```
impl T {
    ReturnType method(self: T, ...) { ... }
}
```

Example:
```
type Point { i32 x, i32 y }

impl Point {
    i32 len(self: Point) { return self.x + self.y; }
}
```

## Contracts
If a value is typed as a `contract`, method calls use dynamic dispatch (vtable).

Example:
```
contract Draw { unit draw(self); }

unit render(d: Draw) {
    d.draw(); // dynamic dispatch
}
```

## Decisions
- Method overloading is allowed.
- Method lookup must respect `use` aliases during resolution.
- Methods with `ref` receivers do not satisfy contract method sets in v0.1.
- Dotted path lookup uses the resolved alias target, then normal resolution rules.

## Examples
```
contract Len { i32 len(self); }

type S { ... }
impl S {
    i32 len(self: ref S) { ... }
}
// S does not satisfy Len (ref receiver)

use math.Vec2 as V;
let v = V(1, 2);
v.len(); // resolved through alias target
```
