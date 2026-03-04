# 12. Method Dispatch

## Model (v0.1)
- Static dispatch for concrete types.
- Dynamic dispatch only via `contract` values.
- Strict impl-only method declaration form (legacy receiver-qualified declarations are invalid).

Static dispatch resolves calls at compile time. Dynamic dispatch uses a vtable when a value is typed as a contract.

## Method form
Methods are defined within an `impl` block for a specific type:
```
impl T {
    ReturnType method(...) { ... }
}
```

Inside an `impl T` block, the receiver is implicit as `this`.

### Strict impl-only rule
- Method declarations must appear only inside `impl T { ... }`.
- Explicit receiver parameters (`self`, `this: T`, etc.) are invalid in v0.1.
- Legacy receiver-qualified method declaration syntax is rejected.

### Typed call classification contract
Every successful call expression must resolve to exactly one semantic call kind:
1. `MethodDispatch` (receiver + resolved method item)
2. `ItemCall` (resolved function/item/builtin)
3. `CallableValueCall` (function-typed expression value)

Lowering must dispatch from this semantic classification and must not infer method-vs-item behavior from parser shape.

Example:
```
type Point { i32 x, i32 y }

impl Point {
    i32 len() { return this.x + this.y; }
}
```

## Contracts
If a value is typed as a `contract`, method calls use dynamic dispatch (vtable).
In v0.1, this is valid only when the concrete type explicitly declares conformance via
`type Type : ContractA, ContractB { ... }`.

Example:
```
contract Draw { unit draw(); }

type Circle : Draw { i32 r }

impl Circle {
    unit draw() { ... }
}

unit render(d: Draw) {
    d.draw(); // dynamic dispatch
}
```

## Related feature ownership
- Event declaration/subscription/invocation semantics are defined in `docs/spec/16-events.md`.
- Lambda and closure semantics are defined in `docs/spec/17-lambdas-and-closures.md`.
- Lowering/runtime details belong to `docs/execution/`.

## Decisions
- Method overloading is allowed.
- Method lookup must respect `use` aliases during resolution.
- Methods with `ref` receivers do not satisfy contract method sets in v0.1.
- Contract satisfaction is nominal in v0.1 (explicit declaration required; no duck typing).
- Dotted path lookup uses the resolved alias target, then normal resolution rules.
- Codegen method dispatch must have a single lowering path per resolved method call kind.

## Examples
```
contract Len { i32 len(); }

type S : Len { ... }
impl S {
    i32 len() { ... }
}
```
use math.Vec2 as V;
let v = V(1, 2);
v.len(); // resolved through alias target
