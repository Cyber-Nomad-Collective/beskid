## MODIFIED Requirements

### Requirement: Inline public collection methods
Every public collection module and type SHALL use the
`Core.Collections.*` namespace. The `Collections.*` namespace MUST NOT be
declared, re-exported, aliased, resolved, or retained as a compatibility path.
Public receiver methods MUST be declared inside their owning `pub type` block;
module-level free functions MAY remain only for constructors and namespace
helpers that do not receive an owned collection value. A fluent wrapper, when
present, MUST delegate to the same owning method and MUST NOT introduce
storage, growth, error, or compatibility semantics.

Every collection method that changes the collection (`List.Push`, `List.Pop`, `List.Set`, `List.Insert`, `List.Remove`, `List.RemoveAt`, `List.Clear`, `Stack.Push`, `Stack.Pop`, `Queue.Enqueue`, `Queue.Dequeue`, `Set.Add`, `Set.Remove`, `Map.Insert`, `Map.Remove`, `Map.Clear`, `PriorityQueue.Push`, `PriorityQueue.Pop`, `I64Map.Insert`, `I64Map.Remove`, `StringMap.Insert`, `StringMap.Remove`, `HashTable.Insert`, `HashTable.Remove`) SHALL change the receiver in place. It SHALL be declared with a `mut this` receiver (or a `mut` parameter for the free functions), and it SHALL NOT return the collection, so `items.Push("milk");` needs no rebinding and no `move`. No collection method SHALL be declared `move this`. A `mut this` method MAY be called on a binding that is not `mut`. The results SHALL be: `Push`, `Enqueue`, `Clear` and `Map.Insert` return `unit`; `Pop` and `Dequeue` return `Option<T>`; `List.Remove`, `Set.Add` (false when the element is present), `Set.Remove`, `Map.Remove` and the `Remove` forms of `I64Map`, `StringMap` and `HashTable` return `bool`; `List.Set` and `List.Insert` return `Result<unit, CollectionError>`; `List.RemoveAt` returns `Result<T, CollectionError>` with the removed element. Read-only methods (`Count`, `IsEmpty`, `Get`, `TryGet`, `First`, `Last`, `IndexOf`, `Contains`, `Peek`, iteration) and derivation methods (`Reverse`, `Slice`, `Concat`, `ToArray`, `Union`) SHALL keep a borrowed receiver and SHALL keep their results.

A type marked `[CopyOnAssign]` (an attribute of `Core.Attributes` for type definitions) SHALL declare a method `T Copy()` with a borrowed receiver and no parameters that returns the type. Only `List<T>` among the collections SHALL be `[CopyOnAssign]`. Stack, Queue, Set, Map and the other collections SHALL keep reference semantics: a second binding sees mutations. A read of a place of a `[CopyOnAssign]` type (a local, a parameter, `this`, a field or an array element) SHALL give the new holder its own value, as if `Copy` were called, when the read is: the value of a `let`; the value of an assignment; an argument for a parameter that is not `mut`; a field, element or payload of a construction; a returned value, unless the place is a `let` local or a parameter that is not `mut`. A read SHALL NOT copy when it is: a method receiver; an argument for a `mut` parameter, because a `mut` parameter shares the value with the caller and changes it in place; the operand of `move`; the place of `exchange`; an operator operand, a condition or a match scrutinee. Copies SHALL be copy-on-write. Reads that give a new holder "its own value" SHALL share the storage with the source until the first mutation. Passing, assigning, returning or storing a `List<T>` that is never mutated afterwards SHALL NOT copy its elements. The first mutation through a binding whose storage is shared SHALL copy the storage for that binding before it writes, so no write through one `List<T>` is visible through another, except through a `mut` parameter, which shares with the caller. Growth of one `List<T>` SHALL NOT write into storage that another `List<T>` sees. The same rule SHALL cover a `for` loop variable that holds a `List<T>`, a lambda capture of a `List<T>`, and a value taken out of a `Result` with `?`. `Storage.AppendAt<T>` SHALL keep its in-place growth. `Array.Append<T>`, `Array.Set<T>` and the other `Array` functions SHALL take a borrowed array and SHALL NOT be declared `move`. Corelib, the Book and the surface tests SHALL be migrated in the same change; no compatibility overloads SHALL remain.

#### Scenario: Legacy collection namespace is rejected
- **GIVEN** source that imports `Collections.List` after the 0.4 migration
- **WHEN** name resolution runs
- **THEN** resolution fails and does not redirect the import to
  `Core.Collections.List`

#### Scenario: Receiver behavior has one owner
- **GIVEN** a public operation that receives `Core.Collections.List<T>` as its
  collection receiver
- **WHEN** the Corelib API shape is inspected
- **THEN** its implementation exists once inside the owning `List<T>` type and
  no extension, free-function duplicate, or fluent-wrapper implementation owns
  different behavior

#### Scenario: Push changes the list in place
- **GIVEN** `unit Main() { List<string> items = List.Empty<string>(); items.Push("milk"); i64 n = items.Count(); }`
- **WHEN** the item is checked and run
- **THEN** no diagnostic is reported and `n` is 1

#### Scenario: Assignment copies
- **GIVEN** `List<i64> a = List.Empty<i64>(); a.Push(1); List<i64> b = a; b.Push(2);`
- **WHEN** the code runs
- **THEN** `a.Count()` is 1 and `b.Count()` is 2

#### Scenario: Passing a list gives the callee its own value
- **GIVEN** `unit Grow(List<i64> l) { l.Push(9); }` and `List<i64> a = List.Empty<i64>(); Grow(a);`
- **WHEN** the code runs
- **THEN** `a.Count()` is 0

#### Scenario: A mut parameter shares with the caller
- **GIVEN** `unit Grow(mut List<i64> l) { l.Push(9); }` and `List<i64> a = List.Empty<i64>(); Grow(a);`
- **WHEN** the code runs
- **THEN** `a.Count()` is 1

#### Scenario: Other collections share
- **GIVEN** `Stack<i64> a = Stack.Empty<i64>(); Stack<i64> b = a; b.Push(1);`
- **WHEN** the code runs
- **THEN** `a.Count()` is 1

#### Scenario: Mutator results
- **GIVEN** an empty `List<i64> l`
- **WHEN** `l.Pop()` and `l.Remove(3)` run
- **THEN** `Pop` returns `Option::None` and `Remove` returns `false`

#### Scenario: No copy without a mutation
- **GIVEN** a `List<i64>` with a million elements that is assigned to another binding and passed to a function that only reads it
- **WHEN** the code runs
- **THEN** no element is copied

#### Scenario: Copy at the first mutation
- **GIVEN** `List<i64> a = Make(); List<i64> b = a; b.Push(1);`
- **WHEN** `b.Push(1)` runs
- **THEN** the storage of `b` is copied before the write, and `a` is unchanged

#### Scenario: Lambda capture and for variable
- **GIVEN** a lambda that captures a `List<i64>` and mutates its capture, and a `for` loop over a `List<List<i64>>` that mutates the loop variable
- **WHEN** the code runs
- **THEN** the original lists are unchanged

#### Scenario: Value taken out with a question mark
- **GIVEN** `List<i64> inner = ResultOfList()?; inner.Push(1);` where the `Result` is still held by another binding
- **WHEN** the code runs
- **THEN** the list inside the `Result` is unchanged

#### Scenario: Growth does not write into shared storage
- **GIVEN** a list `a` with capacity for one more element and `b` assigned from `a`
- **WHEN** `b.Push(1)` runs and then `a.Push(2)` runs
- **THEN** `b` holds `1` and `a` holds `2`

## ADDED Requirements

### Requirement: Lent and detached lists
An argument of a plain parameter of a direct call SHALL be a lent view of the list (`Borrow`): the view SHALL NOT count as a holder, the callee SHALL copy the storage before it writes, and the callee SHALL copy whatever it keeps or returns. The runtime SHALL NOT decrement a share count, because a decrement is unsound when a share record is reachable from two isolates. Arguments of `move` parameters, of `spawn` targets, of compiler-lowered collection operations and of unknown callees SHALL be copied (`Copy`). A list that is detached from its sharers (`Detached`) and has a sole owner SHALL be written in place. `Get` on a `List<T>` SHALL return a copy of the element, so a write through the result SHALL NOT reach the list.

#### Scenario: Callee writes a lent list
- **GIVEN** `unit Grow(List<i64> l) { l.Push(9); }` and `List<i64> a = Make(); Grow(a);`
- **WHEN** the code runs
- **THEN** `a` is unchanged and the callee wrote into its own copy

#### Scenario: Sole owner writes in place
- **GIVEN** a list with no other holder
- **WHEN** `l.Push(1)` runs
- **THEN** the storage is not copied
