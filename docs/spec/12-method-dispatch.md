# 12. Method Dispatch & Events

## Model (v0.1)
- Static dispatch for concrete types.
- Dynamic dispatch only via `contract` values.
- Zero-cost static unrolling for `event` multicasts.

Static dispatch resolves calls at compile time. Dynamic dispatch uses a vtable when a value is typed as a contract.

## Method form
Methods are defined within an `impl` block for a specific type:
```
impl T {
    ReturnType method(...) { ... }
}
```

Inside an `impl T` block, the receiver is implicit as `this`.

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

## Zero-Cost Events and Delegates
Beskid provides C#-style `event` and `delegate` (lambda) semantics, but guarantees zero-cost execution (no heap allocations or vtable dispatches). This is achieved by lowering events directly into the HIR (High-level IR) as small inline arrays.

### Syntax
The `event` keyword is a field modifier. It allows a type to declare a multicast subscription point. To guarantee no heap allocations, the developer can explicitly declare the inline capacity using `event[N]`.

```beskid
type Window {
    // Declares an event with an inline capacity of 4 subscribers.
    pub event[4] OnResize: (i32, i32) -> unit,
}

impl Window {
    pub unit Init() {
        // Subscribers use the += operator
        this.OnResize += (w, h) => println("Resized");
    }

    unit Trigger() {
        // Only the owner can invoke the event
        this.OnResize(1920, 1080);
    }
}
```

### HIR Lowering and Compilation Stack
Events do not exist as standard library types (`Std.Event<T>`). Instead, the `beskid_analysis::hir` lowering phase completely expands them into raw structural primitives.

1. **Fat Pointers:** A lambda `(T) -> U` is lowered into a 16-byte value type (Fat Pointer) containing `(*mut Environment, *const Function)`. Captures are stack-allocated.
2. **Inline Arrays:** The AST node `event[4] OnResize: (i32) -> unit` is lowered into two HIR fields injected directly into the `Window` struct:
   - `__OnResize_count: u8`
   - `__OnResize_handlers: [FatPointer; 4]`
3. **Loop Unrolling:** When the frontend lowers the invocation `this.OnResize(w, h)` into HIR, it does not emit a dynamic `foreach` loop. It emits an explicit block of sequential conditionals:
   ```rust
   // HIR representation of event invocation
   if this.__OnResize_count > 0 { invoke(this.__OnResize_handlers[0], w, h); }
   if this.__OnResize_count > 1 { invoke(this.__OnResize_handlers[1], w, h); }
   // ... up to N
   ```

Because this is lowered directly into the HIR, the Cranelift backend receives perfectly flat, static branch code, resulting in execution times identical to raw C function pointers.

## Decisions
- Method overloading is allowed.
- Method lookup must respect `use` aliases during resolution.
- Methods with `ref` receivers do not satisfy contract method sets in v0.1.
- Contract satisfaction is nominal in v0.1 (explicit declaration required; no duck typing).
- Dotted path lookup uses the resolved alias target, then normal resolution rules.

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
