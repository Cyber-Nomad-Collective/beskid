## REMOVED Requirements

### Requirement: Owning and borrowed names
**Reason**: The owner ruled on 2026-10-24 that move semantics apply only at an isolate crossing. Names are not classified as owning or borrowed in ordinary code.
**Migration**: Replaced by "Move applies at isolate crossings". Remove `move` from ordinary code.

### Requirement: Consuming uses and use after move
**Reason**: Use after move is not diagnosed outside an isolate crossing.
**Migration**: Replaced by "Move applies at isolate crossings".

### Requirement: Branch and loop rules for consumption
**Reason**: Consumption is tracked only for crossing operands.
**Migration**: Replaced by "Consumption at a crossing".

### Requirement: Destructive read of a field
**Reason**: A destructive read is needed only to take a field out as a crossing operand.
**Migration**: Replaced by "Taking a field out at a crossing".

### Requirement: ORCA preconditions
**Reason**: External uniqueness is established at the crossing, not for all names.
**Migration**: Replaced by "ORCA preconditions at crossings".

## ADDED Requirements

### Requirement: Move applies at isolate crossings
A crossing operand SHALL be one of: the value argument of the corelib `Port<T>.Send` or of the runtime builtin `__port_send`; a binding declared outside a closure that is the argument of a `[Captures]`-bounded parameter, or initializes a `[Captures]`-bounded field, or is the body of `__isolate_spawn`, and that the closure reads with `move`. The `[Captures]`-bounded parameters of `Scope.Spawn`, of `Parallel.Scope` tasks and of the `.Parallel()` steps SHALL make those captures crossings through this definition. A fiber `spawn` SHALL NOT be a crossing. `move x` SHALL consume `x` only as a crossing operand. `move` written anywhere else SHALL be **E1239** with the help "remove `move`; it applies only when a value crosses to another isolate". `move` applied to a Shared, Copied or Never value, and the `move` modifier on a parameter of such a type, SHALL be **E1239** with the help "remove `move`: Shared and Copied values pass without it". A crossing operand of Moved class that is written without `move` SHALL be **E1242** with the help "write `move <name>`". Outside a crossing the compiler SHALL NOT classify names as owning or borrowed and SHALL NOT report use after move. Assignment, `let y = x`, field and element stores, returns and ordinary calls SHALL NOT consume a value. A read of a binding after the crossing that consumed it, on a path the crossing reaches, SHALL be **E1234** with the label "moved here" at the crossing. A place read of Moved class that is handed to a crossing without `move` (`xs[i]`, `x.f`) SHALL be **E1241** with the help to copy the value first or to take it out. Fiber handle linearity (a double `Join` is **E1234**) SHALL stay unchanged.

#### Scenario: Ordinary alias is accepted
- **GIVEN** `unit Main() { u8[] a = Array.Empty<u8>(); u8[] b = a; Array.Append<u8>(a, 1); Array.Append<u8>(b, 2); }`
- **WHEN** the item is checked
- **THEN** no diagnostic is reported

#### Scenario: Move outside a crossing
- **GIVEN** `unit Main() { u8[] a = Array.Empty<u8>(); Archive.Store(move a); }` where `Store` is an ordinary function
- **WHEN** the item is checked
- **THEN** the compiler SHALL report **E1239** at `move a` with the help "remove `move`; it applies only when a value crosses to another isolate"

#### Scenario: Use after a port send
- **GIVEN** `unit Main(Port<u8[]> out) { u8[] block = Array.Zeroed<u8>(16_i64); out.Send(move block); i64 n = Array.Len<u8>(block); }`
- **WHEN** the item is checked
- **THEN** the compiler SHALL report **E1234** at `block` in `Array.Len<u8>(block)` with the label "moved here" on `move block`

#### Scenario: Spawn capture is consumed
- **GIVEN** `s.Spawn(() => Checksum(move buffer));` followed by a read of `buffer` in the parent
- **WHEN** the item is checked
- **THEN** the compiler SHALL report **E1234** at the read

#### Scenario: Crossing without move
- **GIVEN** `out.Send(block)` where `block` is a `u8[]` local and `out` is a `Port<u8[]>`
- **WHEN** the item is checked
- **THEN** the compiler SHALL report **E1242** with the help "write `move block`"

### Requirement: Consumption at a crossing
Consumption SHALL be tracked per binding only for crossing operands. A consumption in one arm of an `if` statement SHALL NOT make a use in the other arm **E1234**. A use after the `if` statement SHALL be **E1234** when an arm consumed the binding and that arm can complete normally. A consumption followed on its own path by `return`, `break` or `continue` SHALL NOT reach a use after that exit. A crossing in a loop body that consumes a binding declared outside the loop, without reassigning it before the next iteration, SHALL be **E1240** at the `move`. Reassigning a consumed binding SHALL make it usable again.

#### Scenario: Send in one arm, use in the other
- **GIVEN** `unit Main(Port<u8[]> out, move u8[] data, bool keep) { if keep { out.Send(move data); } else { Log.Info(Array.Len<u8>(data)); } }`
- **WHEN** the item is checked
- **THEN** no diagnostic is reported

#### Scenario: Use after a conditional send
- **GIVEN** `unit Main(Port<u8[]> out, move u8[] data, bool keep) { if keep { out.Send(move data); } i64 n = Array.Len<u8>(data); }`
- **WHEN** the item is checked
- **THEN** the compiler SHALL report **E1234** at `data` in the `Len` call

#### Scenario: Send in a loop
- **GIVEN** `unit Main(Port<u8[]> out, move u8[] data, i64 rounds) { mut i64 i = 0; while i < rounds { out.Send(move data); i = i + 1; } }`
- **WHEN** the item is checked
- **THEN** the compiler SHALL report **E1240** at `move data`

#### Scenario: Send in a loop with revival
- **GIVEN** `unit Main(Port<u8[]> out, i64 rounds) { mut u8[] data = Array.Empty<u8>(); mut i64 i = 0; while i < rounds { out.Send(move data); data = Array.Empty<u8>(); i = i + 1; } }`
- **WHEN** the item is checked
- **THEN** no diagnostic is reported

### Requirement: Taking a field out at a crossing
`move x.f` SHALL be accepted only as a crossing operand. The field's type SHALL have a canonical empty value: `Option<T>` (left as `Option::None`), `T[]` (left as the empty array) or `List<T>` (left as the empty list). The expression SHALL yield the field value and SHALL store the canonical empty value into the field in the same evaluation step. `move x.f` on a field of any other type SHALL be **E1243** with the help "use `exchange(x.f, v)`". The builtin `exchange(place, value)` SHALL store `value` into `place` and return the previous value; it SHALL NOT require `move`.

#### Scenario: Send a field
- **GIVEN** `unit Flush(Port<u8[]> out, Stage s) { out.Send(move s.buffer); }` where `buffer` is a `u8[]` field
- **WHEN** the item is checked and run
- **THEN** the port receives the buffer and `s.buffer` is the empty array

#### Scenario: Exchange without move
- **GIVEN** `u8[] Swap(Stage s, u8[] next) { return exchange(s.buffer, next); }`
- **WHEN** the item is checked and run with a buffer `[1]` and `next` `[2]`
- **THEN** no diagnostic is reported, the result is `[1]` and `s.buffer` is `[2]`

### Requirement: ORCA preconditions at crossings
Two static guarantees SHALL hold for hand-over by pointer. First, deep persistent immutability: a value of Shared class is never written after construction. Second, external uniqueness at the crossing: a crossing operand `move x` SHALL be **E1241**, with the help to copy the value first, unless `x` is a `move` parameter or a local initialized from an owned expression (a call result, a literal, a struct, array or enum literal, or an element or member of one), and no expression in the callable makes `x` the value of a `let`, of an assignment or of a literal element, or reads `x` inside a closure that is not `[Captures]`-bounded, and the latest assignment to `x` on the crossing's path (if any) assigned an owned expression. Passing `x` as an argument of an ordinary call SHALL NOT give it another name. Internal aliases and cycles inside the handed-over graph are permitted. Aliases inside one isolate that never cross are permitted.

#### Scenario: Aliased value at a crossing
- **GIVEN** `unit Main(Port<u8[]> out) { u8[] a = Array.Empty<u8>(); u8[] b = a; out.Send(move a); }`
- **WHEN** the item is checked
- **THEN** the compiler SHALL report **E1241** at `move a` with the help to copy the value first

#### Scenario: Unique local
- **GIVEN** `unit Main(Port<u8[]> out) { u8[] a = Array.Zeroed<u8>(8_i64); out.Send(move a); }`
- **WHEN** the item is checked
- **THEN** no diagnostic is reported and the value is handed over by pointer
