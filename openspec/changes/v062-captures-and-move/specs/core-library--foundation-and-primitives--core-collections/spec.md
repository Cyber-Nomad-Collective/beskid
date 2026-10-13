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

Every method that returns the updated collection (`List.Push`, `List.Pop`, `List.Set`, `List.Remove`, `Stack.Push`, `Stack.Pop`, `Queue.Enqueue`, `Queue.Dequeue`, `Set.Add`, `Set.Remove`, `Map.Insert`, `Map.Remove`, `PriorityQueue.Push`, `PriorityQueue.Pop`, `I64Map.Insert`, `I64Map.Remove`, `StringMap.Insert`, `StringMap.Remove`, and the free function `HashTable.Insert` through a `move` parameter) SHALL take an owning receiver `move this` (or a `move` parameter for the free functions), so the receiver is consumed by the call and two live values never share storage. Read-only methods (`Count`, `IsEmpty`, `Get`, `TryGet`, `First`, `Last`, `IndexOf`, `Contains`, `Peek`, iteration) SHALL keep a borrowed receiver. `Storage.AppendAt<T>` SHALL keep its in-place growth, which is sound once only one live value reaches the storage. `Array.Append<T>`, `Array.Set<T>` and the other `Array` functions SHALL take a borrowed array and SHALL NOT be declared `move`. Corelib, the Book and the surface tests SHALL be migrated in the same change; no compatibility overloads SHALL remain.

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

#### Scenario: Push consumes the receiver
- **GIVEN** `unit Main() { List<i64> l = List.Empty<i64>(); List<i64> l2 = l.Push(1); i64 n = l.Count(); }`
- **WHEN** the item is checked
- **THEN** the compiler SHALL report **E1234** at `l` in `l.Count()` with the label "moved here" on `l.Push(1)`

#### Scenario: Read-only method borrows
- **GIVEN** `i64 Main() { List<i64> l = List.Empty<i64>().Push(1); i64 a = l.Count(); i64 b = l.Count(); return a + b; }`
- **WHEN** the item is checked
- **THEN** no diagnostic is reported

#### Scenario: Storage is never shared by two live lists
- **GIVEN** the corelib `List<T>` after this change
- **WHEN** a test pushes to a list, keeps the result, and tries to push to the original
- **THEN** the second push does not compile (**E1234**), so no test can observe two lists over one `T[]`
