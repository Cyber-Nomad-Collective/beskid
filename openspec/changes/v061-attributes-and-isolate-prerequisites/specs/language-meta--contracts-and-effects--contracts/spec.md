## MODIFIED Requirements

### Requirement: Conformance satisfaction and diagnostics
Implementing types MUST supply every required member with a compatible
signature (**E1601**, **E1602**, **E1606**). Invalid conformance targets MUST
error (**E1607**). All `Standard` types advertising conformance MUST pass
contract satisfaction in the reference compiler. Signature compatibility MUST
compare parameter types and return type via the type-checker's
`FunctionSignature` (`TypeId`-based) equality, superseding arity-only
comparison; a return-type mismatch (including a `This`-typed contract return
vs a concrete impl return) MUST emit **E1602**. An `impl T : Contract { ... }`
block MUST populate the conformance table identically to `type T : Contract`
and MUST be permitted only in the module that defines `T` (closed extension
with private-member access, not subject to **E1511**).

A contract declared with `[CompilerDerived]` SHALL NOT be listed in any conformance list (`type X : C`, `impl X : C`); such a listing SHALL be reported as **E1607**. Conformance to a `[CompilerDerived]` contract SHALL be proven only by the compiler through the requirement "Transfer class query", and a bound on it SHALL be reported as **E1610** when the proof fails, with the help text naming the first offending field or the reason returned by the query.

**Stable ID:** `BSP-REQ-CA9C4460BD37`

#### Scenario: Missing required member
- **GIVEN** a type that lists a contract in its conformance list but omits a
  required member
- **WHEN** contract satisfaction checking runs
- **THEN** the compiler emits **E1601**, **E1602**, or **E1606**

#### Scenario: Return-type mismatch is flagged
- **GIVEN** a contract `C { string Name(); }` and an impl
  `impl T : C { i64 Name() { ... } }`
- **WHEN** contract satisfaction checking runs
- **THEN** the compiler emits **E1602** because the `FunctionSignature`
  return types differ

#### Scenario: Impl-block conformance creates the same edge as type conformance
- **GIVEN** `impl StyleChain : AnsiStyleStep { ... }` in the module that
  defines `StyleChain`
- **WHEN** the resolver processes the impl block
- **THEN** a conformance edge `(StyleChain, AnsiStyleStep)` is created
  identically to `type StyleChain : AnsiStyleStep { ... }` and the stage6
  satisfaction check fires

#### Scenario: Impl conformance is closed to the defining module
- **GIVEN** an `impl T : Contract { ... }` block in a module that does not
  define `T`
- **WHEN** the resolver processes the impl block
- **THEN** the compiler rejects it; the closed-form private access of `impl`
  is not relaxed

#### Scenario: Declared conformance to a derived marker is rejected
- **GIVEN** `use Core.Parallel;` and `pub type Token : Shared { i64 id }`
- **WHEN** contract satisfaction checking runs
- **THEN** the compiler SHALL report **E1607** at `Shared` noting that the contract is compiler-derived

#### Scenario: Derived bound fails with the offending field
- **GIVEN** `pub type Cache { Map<string, i64> entries }` without a marker and `unit Keep<T>(T value) where T: Transferable { }` and the call `Keep<Cache>(cache)`
- **WHEN** the where-bound is proven at the call
- **THEN** the compiler SHALL report **E1610** naming `Cache` and the reason "no marker attribute"

## ADDED Requirements

### Requirement: Compiler-derived marker contracts
Corelib SHALL declare, in `Core.Parallel`, four contracts with no members: `Transferable`, `Shared`, `Moved` and `Copied`, each carrying `[CompilerDerived]`. `[CompilerDerived]` SHALL be accepted only on a `ContractDefinition` that declares no members; a member in such a contract SHALL be reported as **E1003** at the member. The compiler SHALL recognize these four contracts by their corelib declaration and SHALL prove a bound `where T: M` on any of them from the transfer class of the substituted type: `Transferable` is satisfied by Shared, Moved and Copied; `Shared`, `Moved` and `Copied` are each satisfied only by their own class. Any other `[CompilerDerived]` contract SHALL be reported as **E1607** at the attribute.

#### Scenario: Primitive satisfies Transferable
- **GIVEN** `i64 Twice<T>(T value) where T: Transferable { return 2; }` and `Twice<i64>(21)`
- **WHEN** the where-bound is proven
- **THEN** the proof succeeds without any declared conformance of `i64`

#### Scenario: Array satisfies Moved and not Shared
- **GIVEN** `unit Own<T>(T value) where T: Moved { }`, `unit View<T>(T value) where T: Shared { }` and the calls `Own<u8[]>(bytes)` and `View<u8[]>(bytes)`
- **WHEN** both bounds are proven
- **THEN** `Own<u8[]>` succeeds and `View<u8[]>` is reported as **E1610** with the reason "class Moved, bound requires Shared"

#### Scenario: Member in a derived contract
- **GIVEN** `[CompilerDerived] pub contract Shared { i64 Size(); }`
- **WHEN** the contract is checked
- **THEN** the compiler SHALL report **E1003** at `Size`

### Requirement: Transfer class query
The compiler SHALL compute, for every type identity, exactly one transfer class from the set Shared, Moved, Copied, Never(reason), through one query (`transfer_class`) in the query layer, with these rules applied in order:

1. `i8`, `i16`, `i32`, `i64`, `u8`, `u16`, `u32`, `u64`, `f32`, `f64`, `bool`, `char`, `word`, `unit` and `string` are Shared.
2. `pointer`, `never` and every function type are Never.
3. `T[]` is Moved when `T` is Shared, Moved or Copied, and Never otherwise.
4. A nominal type carrying `[NeverTransferable]` is Never.
5. A nominal type with a field of class Never is Never, naming that field.
6. A nominal type carrying `[Immutable]` is Shared when every field is Shared or is an `[ImmutableStorage]` field of type `T[]` with `T` Shared.
7. A nominal type carrying `[Isolated]` is Moved when every field is Shared or Moved.
8. A nominal type carrying `[Copyable]` is Copied when every field is Shared or Copied.
9. An enum is Shared when every variant field is Shared; Moved when every variant field is Shared or Moved and at least one is Moved; Copied when every variant field is Shared or Copied and at least one is Copied; Never otherwise.
10. Any other nominal type is Never with the reason "no marker attribute".

A type parameter SHALL take the class of its bound inside the generic definition: `Shared`, `Moved` or `Copied` give that class; `Transferable` gives the class "some Transferable", which satisfies only the `Transferable` bound; no bound gives Never. A generic nominal type's class SHALL be computed after substituting its arguments, so `List<i64>` is Moved and `List<Fiber<i64>>` is Never. Exactly one marker among `[Immutable]`, `[Isolated]`, `[Copyable]` SHALL appear on one type; a second SHALL be reported as **E1510** at the second marker with the note that markers are exclusive. The class SHALL be a generation-bound fact available to the LSP hover of the type.

#### Scenario: Immutable record is Shared
- **GIVEN** `[Immutable] pub type Job { string id, i64 size }`
- **WHEN** the class of `Job` is computed
- **THEN** it is Shared

#### Scenario: Isolated record over a collection is Moved
- **GIVEN** `[Isolated] pub type Index { List<string> terms, i64[] offsets }`
- **WHEN** the class of `Index` is computed
- **THEN** it is Moved

#### Scenario: Copyable record with an array field is Never
- **GIVEN** `[Copyable] pub type Frame { i64 width, u8[] pixels }`
- **WHEN** the class of `Frame` is computed
- **THEN** it is Never naming `pixels` and the declaration is reported as **E1247** at `pixels`

#### Scenario: Option of an array is Moved
- **GIVEN** the corelib `Option<T>` and the type `Option<u8[]>`
- **WHEN** the class is computed
- **THEN** it is Moved, and `Option<i64>` is Shared

#### Scenario: Generic parameter class from its bound
- **GIVEN** `pub type Box<T> { T item }` with `[Isolated]` and the use `Box<string>` and `Box<Mutex>`
- **WHEN** both classes are computed
- **THEN** `Box<string>` is Moved and `Box<Mutex>` is Never naming `item`

### Requirement: Immutable types
A type carrying `[Immutable]` SHALL be transitively immutable. At the declaration, every field SHALL be of a Shared type, or SHALL carry `[ImmutableStorage]` and have the type `T[]` with `T` Shared; any other field SHALL be reported as **E1244** at the field, naming its type and class. In every unit, an assignment (`=`, `+=`, `-=`) whose target is a member access or subscript whose receiver's proven type is an `[Immutable]` nominal type SHALL be reported as **E1245** at the assignment, including assignments through `this` inside the type's own methods and event subscription on its fields; the struct literal that constructs the value SHALL be the only way to set its fields. An `[ImmutableStorage]` field SHALL additionally not be returned, stored into another place, captured by a lambda or passed to a parameter declared `mut`; each SHALL be reported as **E1245** at the use. `[ImmutableStorage]` SHALL be accepted only inside corelib (`Core.*` packages); elsewhere it SHALL be reported as **E1510**.

#### Scenario: Field of a mutable type
- **GIVEN** `[Immutable] pub type Snapshot { i64 taken, List<string> names }`
- **WHEN** the declaration is checked
- **THEN** the compiler SHALL report **E1244** at `names` naming `List<string>` and class Moved

#### Scenario: Assignment through this
- **GIVEN** `[Immutable] pub type Job { string id, i64 size, pub unit Grow() { this.size = this.size + 1; } }`
- **WHEN** the legality gate judges the unit
- **THEN** the compiler SHALL report **E1245** at `this.size = ...`

#### Scenario: Assignment through a local
- **GIVEN** `[Immutable] pub type Job { string id, i64 size }` and `unit Rename(Job job) { job.id = "renamed"; }`
- **WHEN** the legality gate judges the unit
- **THEN** the compiler SHALL report **E1245** at the assignment

#### Scenario: Construction by literal is allowed
- **GIVEN** the same `Job` and `Job Make() { return Job { id: "a", size: 1 }; }`
- **WHEN** the unit is checked
- **THEN** no **E1245** is reported

#### Scenario: Immutable storage field in corelib
- **GIVEN** a corelib unit with `[Immutable] pub type ReadOnlyArray<T> { [ImmutableStorage] T[] items, pub i64 Count() { return Array.Len<T>(this.items); } }`
- **WHEN** the declaration is checked
- **THEN** no **E1244** is reported and `ReadOnlyArray<i64>` is Shared

#### Scenario: Immutable storage passed to a mut parameter
- **GIVEN** the same `ReadOnlyArray<T>` with a method `pub unit Add(T value) { Array.Append<T>(this.items, value); }` where `Array.Append<T>(mut T[] values, T value)`
- **WHEN** the legality gate judges the unit
- **THEN** the compiler SHALL report **E1245** at `this.items`

### Requirement: Isolated and Copyable types
A type carrying `[Isolated]` SHALL have only fields whose class is Shared or Moved; a type carrying `[Copyable]` SHALL have only fields whose class is Shared or Copied. A field that violates this SHALL be reported as **E1247** at the field, naming the field, its class and the classes the marker admits. `[Copyable]` SHALL NOT depend on `[Serialize]`: the two attributes are independent and either may appear without the other. The marker SHALL impose no other rule in this release; the owning, borrowing and consuming rules for Moved values are specified with the `move` expression.

#### Scenario: Isolated with a Copied field
- **GIVEN** `[Copyable] pub type Pixel { u8 r, u8 g, u8 b }` and `[Isolated] pub type Image { Pixel[] rows, Pixel background }`
- **WHEN** the declaration is checked
- **THEN** the compiler SHALL report **E1247** at `background` naming class Copied and the admitted classes Shared and Moved, and `rows` is accepted because `Pixel[]` is Moved

#### Scenario: Copyable without Serialize
- **GIVEN** `[Copyable] pub type Pixel { u8 r, u8 g, u8 b }` in a project that does not reference the serialization Mod
- **WHEN** the class of `Pixel` is computed
- **THEN** it is Copied

### Requirement: Never-transferable handle types
Corelib SHALL declare `[NeverTransferable]` on `Concurrency.Fiber<T>`, `Concurrency.Channel<T>`, `Concurrency.Hub<T>`, `Concurrency.Mutex`, `Concurrency.MutexGuard`, `Concurrency.WaitGroup`, `Network.TcpStream`, `Network.TcpListener`, `Network.UdpSocket` and on every Glue owner type. `[Copyable]`, `[Isolated]` or `[Immutable]` on a type that carries `[NeverTransferable]`, or on a type with a field of type `pointer`, of a function type or of a Never class, SHALL be reported as **E1246** at the marker, naming the field or the `[NeverTransferable]` attribute. A type whose identity is an `i64` or `pointer` handle into a scheduler-local or host-local table SHALL carry `[NeverTransferable]`; a type whose identity is a process-wide id SHALL instead be declared `[Immutable]` with Shared fields and SHALL derive Shared through the transfer class query, with no special class for identities.

#### Scenario: Copyable on Channel
- **GIVEN** a corelib edit adding `[Copyable]` to `pub type Channel<T>`
- **WHEN** the declaration is checked
- **THEN** the compiler SHALL report **E1246** at `[Copyable]` naming `[NeverTransferable]`

#### Scenario: Immutable record with a pointer field
- **GIVEN** `[Immutable] pub type Raw { pointer data, i64 length }`
- **WHEN** the declaration is checked
- **THEN** the compiler SHALL report **E1246** at `[Immutable]` naming `data`

#### Scenario: Fiber is Never despite Shared fields
- **GIVEN** the corelib `Fiber<T> { i64 handle }` carrying `[NeverTransferable]`
- **WHEN** the class of `Fiber<i64>` is computed
- **THEN** it is Never with the reason `[NeverTransferable]`

#### Scenario: Process-wide identity handle derives Shared
- **GIVEN** `[Immutable] pub type WorkerId { u64 process_id, u64 sequence }`
- **WHEN** the class is computed
- **THEN** it is Shared without any identity-specific rule
