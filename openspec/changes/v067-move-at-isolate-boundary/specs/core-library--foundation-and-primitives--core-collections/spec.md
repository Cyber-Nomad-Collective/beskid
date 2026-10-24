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

Every collection method that changes the collection (`List.Push`, `List.Pop`, `List.Set`, `List.Remove`, `Stack.Push`, `Stack.Pop`, `Queue.Enqueue`, `Queue.Dequeue`, `Set.Add`, `Set.Remove`, `Map.Insert`, `Map.Remove`, `PriorityQueue.Push`, `PriorityQueue.Pop`, `I64Map.Insert`, `I64Map.Remove`, `StringMap.Insert`, `StringMap.Remove`, and `HashTable.Insert`) SHALL change the receiver in place. It SHALL be declared with a `mut this` receiver and SHALL return `unit` or a value that is not the collection, so `items.Push("milk");` needs no rebinding and no `move`. No collection method SHALL be declared `move this`. Read-only methods (`Count`, `IsEmpty`, `Get`, `TryGet`, `First`, `Last`, `IndexOf`, `Contains`, `Peek`, iteration) SHALL keep a borrowed receiver. Assigning a `List<T>` to a binding, or passing it to a parameter, SHALL give the new binding its own storage; an implementation MAY delay the copy until the first write. Growth of one `List<T>` SHALL NOT write into storage that another `List<T>` sees, and a write through one `List<T>` SHALL NOT be visible through another. `Storage.AppendAt<T>` SHALL keep its in-place growth. `Array.Append<T>`, `Array.Set<T>` and the other `Array` functions SHALL take a borrowed array and SHALL NOT be declared `move`. Corelib, the Book and the surface tests SHALL be migrated in the same change; no compatibility overloads SHALL remain.

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

#### Scenario: Passing a list gives the callee its own storage
- **GIVEN** `unit Grow(List<i64> l) { l.Push(9); }` and `List<i64> a = List.Empty<i64>(); Grow(a);`
- **WHEN** the code runs
- **THEN** `a.Count()` is 0

#### Scenario: Growth does not write into shared storage
- **GIVEN** a list `a` with capacity for one more element and `b` assigned from `a`
- **WHEN** `b.Push(1)` runs and then `a.Push(2)` runs
- **THEN** `b` holds `1` and `a` holds `2`
