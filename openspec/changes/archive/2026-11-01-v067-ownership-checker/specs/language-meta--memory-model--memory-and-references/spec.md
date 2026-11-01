## ADDED Requirements

### Requirement: Scope-borrowed values do not escape
A value of a corelib `[ScopeBorrowed]` type SHALL stay in the scope that uses it. The compiler SHALL report **E1241** when such a value is: returned, by `return` or as the expression body of a lambda; the value of an assignment to a field or an element; a field initializer of a struct literal whose type is not itself `[ScopeBorrowed]`, an element of an array literal, or a payload of an enum constructor; an argument of a `spawn` target call; or captured by an escaping lambda. A lambda SHALL escape when it is returned, is the value of an assignment to a field or an element, is an element of an array literal or an enum constructor payload, initializes a struct literal field that has no `[Captures]` bound, or is the operand of `spawn`. A lambda that is called in place, bound to a local, passed as a call argument, or that initializes a `[Captures]`-bounded struct literal field SHALL NOT be an escaping lambda. A local initialized from a `[ScopeBorrowed]` value SHALL be such a value. The message SHALL name the type, and the help SHALL say to use the value inside the scope that created it. Construction of a `[ScopeBorrowed]` value from a borrowed value SHALL stay permitted. `[ScopeBorrowed]` outside a `Core.*` module SHALL remain **E1510** and SHALL grant nothing.

#### Scenario: Store into a field
- **GIVEN** a function that assigns a `SeqSource<T>` value to a field of a record
- **WHEN** the function is checked
- **THEN** the compiler SHALL report **E1241** at the assignment

#### Scenario: Return of a view
- **GIVEN** a function that returns the `SeqSource<T>` it received
- **WHEN** the function is checked
- **THEN** the compiler SHALL report **E1241** at the `return` expression

#### Scenario: Capture by a spawned closure
- **GIVEN** a `spawn` operand closure that captures a `SeqSource<T>`
- **WHEN** the function is checked
- **THEN** the compiler SHALL report **E1241** at the capture

#### Scenario: Use inside the scope
- **GIVEN** `.Parallel().Map((x) => x * x).Reduce(0_i64, SumI64 {})` in one expression
- **WHEN** the function is checked
- **THEN** no diagnostic is reported
