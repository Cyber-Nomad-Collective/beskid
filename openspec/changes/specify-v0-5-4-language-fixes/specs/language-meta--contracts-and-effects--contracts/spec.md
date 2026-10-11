## ADDED Requirements

### Requirement: Bound selection for generic receiver methods
In a generic function, a call `value.M(...)` on a value of type parameter `T`
SHALL resolve `M` through the one `where T: Contract` bound whose contract
declares `M`, when `T` has one or more bounds. A method that no bound
declares, or that more than one bound declares, SHALL be rejected. Without a
bound, `T` SHALL expose no contract methods.

**Stable ID:** `BSP-REQ-CONTRACT-BOUND-METHOD-SELECTION`

#### Scenario: Two bounds, each method from its own contract
- **GIVEN** `contract Sized { i64 Size(); }`, `contract Scaled { i64 Scale(i64 factor); }`,
  and `i64 Both<T>(T value) where T: Sized, T: Scaled { return value.Size() + value.Scale(10); }`
- **WHEN** the program is checked
- **THEN** `Size` resolves through `Sized`, `Scale` through `Scaled`, and no
  error is reported

#### Scenario: Method outside every bound
- **GIVEN** `i64 Other<T>(T value) where T: Sized { return value.Extra(); }`
- **WHEN** the program is checked
- **THEN** the compiler reports an error for `Extra`

#### Scenario: Unbounded type parameter
- **GIVEN** `i64 Free<T>(T value) { return value.Size(); }`
- **WHEN** the program is checked
- **THEN** the compiler reports an error for `Size`

### Requirement: Static dispatch per bounded specialization
Each specialization of a generic function that calls a bound contract method
on a `T` value SHALL call the concrete type's implementation of that method
directly, with `T` inferred from the argument or given explicitly. No runtime
virtual dispatch SHALL be used.

**Stable ID:** `BSP-REQ-CONTRACT-BOUND-STATIC-DISPATCH`

#### Scenario: One specialization per receiver type
- **GIVEN** `type Box : Sized` whose `Size()` returns its field `n`, `type Bag : Sized`
  whose `Size()` returns `100`, and
  `i64 SizeOf<T>(T value) where T: Sized { return value.Size(); }`
- **WHEN** `SizeOf<Box>(Box { n: 2 }) + SizeOf(Bag { m: 1 })` is compiled and run
- **THEN** two specializations of `SizeOf` are emitted, each calling its own
  type's `Size`, and the result is `102`
