# 12. Method Dispatch

## Model (v0.1)
- Static dispatch for concrete types.
- Dynamic dispatch only via `contract` values.

Static dispatch resolves calls at compile time. Dynamic dispatch uses a vtable when a value is typed as a contract.

## Method form
Methods are functions with a receiver:
```
fn T.method(self: T, ...)
```

Example:
```
type Point { x: i32, y: i32 }
fn Point.len(self: Point) -> i32 { return self.x + self.y; }
```

## Contracts
If a value is typed as a `contract`, method calls use dynamic dispatch (vtable).

Example:
```
contract Draw { fn draw(self) -> unit; }

fn render(d: Draw) -> unit {
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
contract Len { fn len(self) -> i32; }

type S { ... }
impl S {
    fn len(self: ref S) -> i32 { ... }
}
// S does not satisfy Len (ref receiver)

use math.Vec2 as V;
let v = V(1, 2);
v.len(); // resolved through alias target
```
