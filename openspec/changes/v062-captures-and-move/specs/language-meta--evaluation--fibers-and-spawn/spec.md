## ADDED Requirements

### Requirement: Fiber handles use the general affine analysis
`Fiber<T>` ownership SHALL be judged by the same `affine_ownership` fact that judges Moved-class values, with `Fiber<T>` bindings seeded as owning names exactly as today (parameters and locals of `Fiber` type, `spawn` initializers, calls returning `Fiber<T>`). `Join`, `Detach`, passing the handle to a parameter and returning it SHALL consume; `Cancel` SHALL NOT. A lambda handed directly to `spawn` SHALL be the one closure that may consume a captured `Fiber` or Moved value without `move` being written, because it runs once; every other lambda keeps the ordinary capture rules. Use after consumption SHALL be **E1234**; the discarded-handle judgement of a `spawn` expression statement SHALL be unchanged. The surface tests that exercised the Fiber-only analysis SHALL pass unchanged except for the code of the use-after-move rendering.

#### Scenario: Double join
- **GIVEN** `i64 Main() { Fiber<i64> f = spawn Work(); i64 a = f.Join()?; return a + f.Join()?; }`
- **WHEN** the item is checked
- **THEN** the compiler SHALL report **E1234** at the second `f` with the label "moved here" on the first `Join`

#### Scenario: Cancel does not consume
- **GIVEN** `i64 Main() { Fiber<i64> f = spawn Work(); f.Cancel(); return f.Join()?; }`
- **WHEN** the item is checked
- **THEN** no diagnostic is reported

#### Scenario: Spawn operand consumes a captured handle once
- **GIVEN** `unit Main() { Fiber<i64> inner = spawn Work(); Fiber<unit> outer = spawn (() => { inner.Join(); }); inner.Cancel(); }`
- **WHEN** the item is checked
- **THEN** the compiler SHALL report **E1234** at `inner.Cancel()` because the spawn operand consumed `inner`
