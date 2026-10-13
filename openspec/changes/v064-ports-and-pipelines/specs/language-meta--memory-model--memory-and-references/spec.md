## MODIFIED Requirements

### Requirement: Locals mut and assignment
Assignment to immutable bindings MUST error (**E1214**). `mut` MUST appear as a prefix modifier before the type or after `let` to allow reassignment (`mut T name = expr`, `let mut name = expr`, or `mut T name` parameters). Legacy suffix form `T mut name` MUST be rejected by the parser. Parameters are passed by value in v0.1; `ref` and `out` parameter modifiers are not part of v0.1.

`move` SHALL be a parameter modifier in the same position as `mut` (`move T name`), and a method receiver MAY be declared `move this` or `mut this` as its first parameter. `move` and `mut` SHALL NOT both appear on one parameter; the parser SHALL reject `move mut T name` and `mut move T name`. A parameter declared `move` SHALL have a Moved-class type; `move` on a parameter of any other class SHALL be reported as **E1239** at the modifier, naming the class. `move this` SHALL be accepted only in a method of an `[Isolated]` type or of a type whose class is Moved; otherwise **E1239**. No `[Owned]` attribute exists.

From 0.6.4 a parameter declared `move` MAY also have as its type a type parameter bounded by `Transferable` (class "some Transferable"), directly or through the owner bound of a method. Inside the generic definition such a parameter SHALL be an owning name. At each call the instantiation SHALL decide: when the type argument is Moved, the argument SHALL be an owned expression or `move x` and SHALL consume `x` (**E1242** for an owning name without `move`, **E1241** for a borrowed name); when the type argument is Shared or Copied, the argument SHALL be passed without `move`, as to a parameter without the modifier (**E1239** on `move`, naming the class). A type parameter with any other bound, or with none, SHALL keep the rule above (**E1239** at the modifier).

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

#### Scenario: Owning parameter over a Transferable type parameter
- **GIVEN** `Port<T>.Send(move T value)` (owner bound `where T: Transferable`), `Port<u8[]> blocks`, `Port<string> names`, `u8[] block` and `string name`
- **WHEN** `blocks.Send(move block)`, `blocks.Send(block)`, `names.Send(name)` and `names.Send(move name)` are checked
- **THEN** the first is accepted and consumes `block`, the second is reported as **E1242** with the help "write `move block`", the third is accepted and `name` stays usable, and the fourth is reported as **E1239** naming class Shared

## ADDED Requirements

### Requirement: Port and isolate builtins consume their payload
The runtime builtins that move a value across a runtime instance boundary SHALL be consuming uses in the affine analysis: passing a name as the `value` argument of `__port_send`, or as the result of a task body, SHALL consume an owning Moved-class name and SHALL be reported as **E1242** when the name is still owned by a live name and no `move` was written, exactly as passing to a `move` parameter. Inside a generic definition whose type parameter is bounded by `Transferable` (class "some Transferable"), passing an owning name of that type to `__port_send` SHALL likewise consume it, because the instantiation may be Moved; the corelib SHALL therefore declare such parameters `move` and write `move` at these sites. A public corelib surface MAY declare a `move` parameter over a type parameter bounded by `Transferable` (requirement "Locals mut and assignment"); `Port<T>.Send(move T value)` is such a surface, and its callers write `move` exactly when the instantiation is Moved. The builtins themselves SHALL NOT be callable from user code (**E1101**).

#### Scenario: Corelib send over a Transferable parameter
- **GIVEN** the corelib pipeline worker `unit Forward<T>(Port<T> out, move T item) where T: Transferable { __port_send(out.id, move item); }`
- **WHEN** the item is checked
- **THEN** it is accepted and `item` is a Moved place after the call

#### Scenario: Corelib send without move is rejected
- **GIVEN** the same worker written `__port_send(out.id, item);`
- **WHEN** the item is checked
- **THEN** the compiler reports **E1242** at `item` with the help "write `move item`"

#### Scenario: User code cannot call the builtin
- **GIVEN** a user project that calls `__port_send(1_i64, value)`
- **WHEN** it is checked
- **THEN** the compiler reports **E1101**
