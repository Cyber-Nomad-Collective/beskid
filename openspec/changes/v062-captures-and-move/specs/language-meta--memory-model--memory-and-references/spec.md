## MODIFIED Requirements

### Requirement: Locals mut and assignment
Assignment to immutable bindings MUST error (**E1214**). `mut` MUST appear as a prefix modifier before the type or after `let` to allow reassignment (`mut T name = expr`, `let mut name = expr`, or `mut T name` parameters). Legacy suffix form `T mut name` MUST be rejected by the parser. Parameters are passed by value in v0.1; `ref` and `out` parameter modifiers are not part of v0.1.

`move` SHALL be a parameter modifier in the same position as `mut` (`move T name`), and a method receiver MAY be declared `move this` or `mut this` as its first parameter. `move` and `mut` SHALL NOT both appear on one parameter; the parser SHALL reject `move mut T name` and `mut move T name`. A parameter declared `move` SHALL have a Moved-class type; `move` on a parameter of any other class SHALL be reported as **E1239** at the modifier, naming the class. `move this` SHALL be accepted only in a method of an `[Isolated]` type or of a type whose class is Moved; otherwise **E1239**. No `[Owned]` attribute exists.

#### Scenario: Assignment to immutable local
- **GIVEN** a non-`mut` local binding
- **WHEN** code assigns to that binding
- **THEN** the compiler emits **E1214**

#### Scenario: Owning parameter and receiver
- **GIVEN** `[Isolated] pub type Archive { List<u8[]> blocks, pub Archive Add(move this, move u8[] block) { this.blocks = this.blocks.Push(move block); return this; } }`
- **WHEN** the type is parsed and checked
- **THEN** both `move` modifiers are accepted and no diagnostic is reported

#### Scenario: move on a Shared parameter
- **GIVEN** `i64 Size(move string name) { return name.Length(); }`
- **WHEN** the declaration is checked
- **THEN** the compiler SHALL report **E1239** at `move` naming class Shared

## ADDED Requirements

### Requirement: The move expression
`move` SHALL be a reserved keyword and `MoveExpression = MoveKeyword ~ PostfixExpression` SHALL be a `UnaryExpression` alternative beside `SpawnUnary` and `PrefixUnary`. The operand SHALL be a path naming an owning Moved-class name, or a field place admitted by the requirement "Destructive read of a field". `move x` SHALL be an owned expression of `x`'s type and SHALL consume `x` at the point of evaluation. `move` applied to a name whose class is Shared, Copied or Never, to a borrowed name, to a `mut` local of non-Moved class, or to a call result or literal SHALL be reported as **E1239** at the expression, naming the class or the reason "borrowed".

#### Scenario: Move a local into a parameter
- **GIVEN** `unit Store(move u8[] block) { }` and `unit Main() { u8[] data = Array.Empty<u8>(); Store(move data); }`
- **WHEN** the item is checked
- **THEN** the call is accepted and `data` is a Moved place after it

#### Scenario: Move of a Shared local
- **GIVEN** `unit Main() { string name = "a"; string other = move name; }`
- **WHEN** the item is checked
- **THEN** the compiler SHALL report **E1239** at `move name` naming class Shared

#### Scenario: Move of a borrowed parameter
- **GIVEN** `unit Keep(u8[] data, Archive a) { a.Add(move data); }`
- **WHEN** the item is checked
- **THEN** the compiler SHALL report **E1239** at `move data` with the reason "borrowed" and the help "declare the parameter `move u8[] data`"

### Requirement: Owning and borrowed names
For every value of Moved class the compiler SHALL classify each name that denotes it as owning or borrowed:

- Owning: a parameter declared `move`; a receiver declared `move this`; a `let` or typed local initialized by an owned expression (a call result, a struct literal, an array literal, `move x`); a `let` initialized by an owning name (`let y = x`, which consumes `x`); a field of a record (the record owns the value).
- Borrowed: a parameter of Moved type without `move`; `this` without `move this`; a local initialized by a place read (`let s = list.storage`, `let e = blocks[i]`); a lambda capture without `move`.

A borrowed name MAY be read, mutated, indexed, passed to a parameter without `move`, and used as a method receiver without `move this`. A borrowed name SHALL NOT be stored into a field or element, returned, captured with `move`, passed to a `move` parameter, used as a `move this` receiver, or `move`d; each SHALL be reported as **E1241** at the use, pointing at the borrowed declaration with the label "borrowed here". A function SHALL return an owned expression or an owning name; a method of an `[Isolated]` type SHALL NOT return `this` or a Moved field through a receiver that is not `move this` (**E1241**). Values of Shared, Copied and Never class SHALL have no owning or borrowed classification.

#### Scenario: Borrowed parameter read and mutated
- **GIVEN** `i64 Checksum(u8[] data) { mut i64 sum = 0; for (u8 b in data) { sum = sum + b; } return sum; }` and `unit Fill(u8[] data) { Array.Set<u8>(data, 0, 1); }`
- **WHEN** both items are checked
- **THEN** no diagnostic is reported

#### Scenario: Borrowed parameter stored
- **GIVEN** `unit Keep(u8[] data, Archive a) { a.blocks = a.blocks.Push(move data); }`
- **WHEN** the item is checked
- **THEN** the compiler SHALL report **E1241** at `move data` with the related label "borrowed here" on `u8[] data`

#### Scenario: Borrowed receiver returned
- **GIVEN** `[Isolated] pub type Stage { u8[] buffer, pub Stage Same() { return this; } }`
- **WHEN** the method is checked
- **THEN** the compiler SHALL report **E1241** at `return this` with the help "declare the receiver `move this`"

#### Scenario: Fluent chain of owned results
- **GIVEN** `List<i64> Build() { return List.Empty<i64>().Push(1).Push(2); }` where `Push` is declared on `move this`
- **WHEN** the function is checked
- **THEN** no diagnostic is reported because each call result is an owned expression

### Requirement: Consuming uses and use after move
The following uses SHALL consume an owning Moved-class name, after which the name is a Moved place until it is reassigned: `move x`; passing `x` to a parameter declared `move`; using `x` as a `move this` receiver; storing `x` into a field or array element; returning `x`; `let y = x` or `T y = x`; capturing `move x`. A read of a Moved place SHALL be reported as **E1234** at the read, naming the binding and pointing at the consuming use with the label "moved here". Storing an owning name into a field or element, passing it to a `move` parameter or returning it without writing `move` SHALL be reported as **E1242** at the use with the help "write `move <name>`", except for `let y = x` and `return x` as the last use of a local, which SHALL consume silently. `Fiber<T>` SHALL follow the same rules with `Join`, `Detach` and passing or returning the handle as consuming uses and `Cancel` as the one non-consuming method; the former Fiber-only `UseAfterMove` rendering SHALL be **E1234**.

#### Scenario: Read after move
- **GIVEN** `unit Main(move u8[] buffer, Archive archive) { Archive a2 = archive.Add(move buffer); i64 n = Array.Len<u8>(buffer); }`
- **WHEN** the item is checked
- **THEN** the compiler SHALL report **E1234** at `buffer` in `Array.Len<u8>(buffer)` with the label "moved here" on `move buffer`

#### Scenario: Store without move
- **GIVEN** `[Isolated] pub type Archive { List<u8[]> blocks, pub Archive Add(move this, move u8[] block) { this.blocks = this.blocks.Push(block); return this; } }`
- **WHEN** the method is checked
- **THEN** the compiler SHALL report **E1242** at `block` with the help "write `this.blocks.Push(move block)`"

#### Scenario: Let alias transfers ownership
- **GIVEN** `unit Main() { u8[] a = Array.Empty<u8>(); u8[] b = a; Array.Append<u8>(a, 1); }`
- **WHEN** the item is checked
- **THEN** the compiler SHALL report **E1234** at `a` in the `Append` call, and no **E1242** is reported for `u8[] b = a`

#### Scenario: Return as last use is silent
- **GIVEN** `u8[] Make() { u8[] data = Array.Empty<u8>(); Array.Append<u8>(data, 1); return data; }`
- **WHEN** the function is checked
- **THEN** no diagnostic is reported

#### Scenario: Fiber handle keeps its discipline under the new code
- **GIVEN** `i64 Main() { Fiber<i64> f = spawn Work(); i64 a = f.Join()?; i64 b = f.Join()?; return a + b; }`
- **WHEN** the item is checked
- **THEN** the compiler SHALL report **E1234** at the second `f`, and `f.Cancel()` before the first `Join` would not consume `f`

### Requirement: Branch and loop rules for consumption
Consumption SHALL be tracked per binding along `if`/`else` arms: a consumption in one arm SHALL NOT make a use in the other arm **E1234**, and a use after the `if` statement SHALL be **E1234** when any arm consumed the binding. A consumption inside a `while` or `for` body of a binding declared before the loop SHALL be reported as **E1240** at the consuming use unless the body assigns the binding, on every path, after the consumption and before the end of the body; an assignment to a Moved place SHALL make the name owning again (revival). A consumption of a binding declared inside the loop body SHALL be ordinary. `match` arms SHALL be treated like `if` arms. The analysis SHALL be one generation-bound fact per callable (`affine_ownership`), replacing the Fiber-only `spawn_handle_diagnostics`, and SHALL reuse its branch-path and loop detection unchanged.

#### Scenario: Consume in one arm, use in the other
- **GIVEN** `unit Main(move u8[] data, bool keep) { if keep { Archive.Store(move data); } else { Log.Info(Array.Len<u8>(data)); } }`
- **WHEN** the item is checked
- **THEN** no diagnostic is reported

#### Scenario: Use after a conditional consume
- **GIVEN** `unit Main(move u8[] data, bool keep) { if keep { Archive.Store(move data); } i64 n = Array.Len<u8>(data); }`
- **WHEN** the item is checked
- **THEN** the compiler SHALL report **E1234** at `data` in the `Len` call

#### Scenario: Consume in a loop without reassignment
- **GIVEN** `unit Main(move u8[] data, i64 rounds) { mut i64 i = 0; while i < rounds { Archive.Store(move data); i = i + 1; } }`
- **WHEN** the item is checked
- **THEN** the compiler SHALL report **E1240** at `move data`

#### Scenario: Consume in a loop with revival
- **GIVEN** `unit Main(i64 rounds) { mut u8[] data = Array.Empty<u8>(); mut i64 i = 0; while i < rounds { Archive.Store(move data); data = Array.Empty<u8>(); i = i + 1; } }`
- **WHEN** the item is checked
- **THEN** no diagnostic is reported

### Requirement: Destructive read of a field
`move x.f` SHALL be accepted when `x` is an owning name or `this`, the receiver type owns the field, and the field's type has a canonical empty value: `Option<T>` (left as `Option::None`), `T[]` (left as the empty array) and `List<T>` (left as the empty list). The expression SHALL yield an owned value of the field's type and SHALL store the canonical empty value into the field in the same evaluation step, so the field is never observed holding a consumed value. `move x.f` on a field of any other type SHALL be reported as **E1243** at the expression with the help "use `exchange(x.f, move v)`". The builtin `exchange(place, move value)` SHALL store `value` into `place` and return the previous value as an owned expression; `place` SHALL be an assignable field or element path of Moved class, `value` SHALL be an owned expression of the same type, and a `place` of non-Moved class SHALL be reported as **E1239**. `exchange` SHALL be the only form that reads and writes a place in one expression; assignment SHALL keep its current value.

#### Scenario: Take an optional buffer
- **GIVEN** `[Isolated] pub type Stage { Option<u8[]> pending, pub Option<u8[]> Take(move this) { return move this.pending; } }`
- **WHEN** the method is checked and run
- **THEN** no diagnostic is reported and after `Take` the record's `pending` is `Option::None`

#### Scenario: Destructive read of a record field
- **GIVEN** `[Isolated] pub type Pair { Index left, Index right, pub Index TakeLeft(move this) { return move this.left; } }` where `Index` is an `[Isolated]` type
- **WHEN** the method is checked
- **THEN** the compiler SHALL report **E1243** at `move this.left` with the help naming `exchange`

#### Scenario: Exchange returns the old value
- **GIVEN** `[Isolated] pub type Stage { u8[] buffer, pub u8[] Swap(mut this, move u8[] next) { return exchange(this.buffer, move next); } }`
- **WHEN** the method is checked and run with a buffer `[1]` and `next` `[2]`
- **THEN** no diagnostic is reported, the result is `[1]` and `this.buffer` is `[2]`

#### Scenario: Exchange on a Shared place
- **GIVEN** `pub type Named { string name, pub string Rename(mut this, string next) { return exchange(this.name, next); } }`
- **WHEN** the method is checked
- **THEN** the compiler SHALL report **E1239** at `this.name` naming class Shared

### Requirement: ORCA preconditions
The two static guarantees that later releases rely on to share and hand over values by pointer SHALL hold from this release:

1. Deep, persistent immutability (`val`): a value of Shared class is never written after construction, by the requirements "Immutable types" and "String immutability invariant".
2. External uniqueness (`iso`): after a consuming use of an owning Moved-class name, no name, field or element reachable from the consuming runtime instance refers to the moved graph, by the requirements "Owning and borrowed names" and "Consuming uses and use after move". Internal aliases and cycles inside a Moved graph are permitted.

These are the invariants I2 and I1 of ORCA (Clebsch et al., OOPSLA 2017, https://doi.org/10.1145/3133896). In this release every value still lives in one heap; the guarantees are stated so that passing Shared values by pointer and handing Moved graphs over by pointer can be introduced without changing any static rule.

#### Scenario: No path to a moved graph
- **GIVEN** `[Isolated] pub type Index { List<string> terms }` and `unit Main(move Index index, Registry r) { r.Register(move index); }` where `Register(move Index index)` stores its parameter in a field
- **WHEN** the item is checked
- **THEN** it is accepted, and inserting `Log.Info(index.terms.Count())` after the call is reported as **E1234**

#### Scenario: Field alias before a move is impossible
- **GIVEN** `[Isolated] pub type Holder { u8[] cache, pub unit Both(move this, move u8[] data) { this.cache = data; Archive.Store(move data); } }`
- **WHEN** the method is checked
- **THEN** the compiler SHALL report **E1242** at `this.cache = data`, and with `move data` written there the later `move data` is **E1234**
