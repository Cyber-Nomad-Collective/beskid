<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Core.Collections Specification

## Purpose

Array-backed collection types, inline methods, and iterator protocol.
## Requirements
### Requirement: Array-backed collection storage
`Core.Collections.List`, `Map`, `Set`, `Queue`, `Stack`, and `Array` SHALL use
real managed `T[]` storage. `List<T>` and `Stack<T>` MUST own `T[] storage` and
`i64 count`; `Queue<T>` MUST own `T[] storage`, `i64 head`, and `i64 count`;
`Set<T>` MUST own `T[] storage` and `i64 count` with linear scan; `Map<K,V>`
MUST own `MapEntry<K,V>[] entries` and `i64 count`. A successful mutation MUST
preserve every previously retained value and the documented count/order
semantics. Required storage MUST NOT be disabled by a runtime feature, replaced
by a count-only placeholder, or represented by a null backing pointer when
capacity is non-zero.

#### Scenario: List retains values across growth
- **GIVEN** a `Core.Collections.List<T>` at full capacity with retained values
- **WHEN** a caller appends one value and the list grows
- **THEN** the list contains every prior value in order followed by the new
  value, its count increases by one, and its backing storage is non-null

#### Scenario: Collection storage cannot be feature-disabled
- **GIVEN** a supported ABI-v5 runtime kit and any Corelib collection type
- **WHEN** its storage behavior is exercised
- **THEN** the same real backing-storage semantics apply without an
  `arrays_backing` or equivalent semantic feature switch

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

### Requirement: Array iterator and Query state
`Core.Collections.Array.Iterate<T>` SHALL advance by checked index over the
array's logical length. Every element read MUST use the same direct ISLE
bounds-checked array access semantics as ordinary indexing. `QueryState<T>`
MUST hold `source`, `index`, `length`, and an optional cached `first` for Query
operators and MUST NOT maintain a second copy of collection storage.

#### Scenario: Iterate advances through all initialized elements
- **GIVEN** a non-empty `T[]` whose logical length is `n`
- **WHEN** a caller enumerates it through `Core.Collections.Array.Iterate<T>`
- **THEN** exactly the initialized elements at indexes `0` through `n - 1` are
  yielded in order through bounds-checked direct access

#### Scenario: Iterator cannot read capacity slack
- **GIVEN** an array whose capacity exceeds its logical length
- **WHEN** iteration reaches the logical length
- **THEN** iteration ends without reading an uninitialized capacity slot

### Requirement: Manifest-owned typed dynamic array growth
`runtime_manifest.bsol` SHALL declare exactly one
`beskid_rt_v5_array_grow_rooted(pointer array, usize minimum_capacity, pointer
root_handle_out) -> pointer` export. The canonical runtime MUST derive the
source array's immutable element descriptor, validate ownership, stride,
alignment, pointer map, length, capacity, and every size/address computation,
and return an array with the same descriptor, logical length, initialized
values, and a capacity at least `minimum_capacity`. The source and result MUST
remain rooted during allocation and copy, and a successful result MUST remain
rooted until the caller completes its owner-field store and required barrier.
No alternate collection-specific grow implementation SHALL exist.

Bit 0 of the hidden element-descriptor word (immediately before the public
array header) is the array's sharing mark. Generated code SHALL set the mark
where a second handle to the array is made, and a growth of a marked array
SHALL request more than the current capacity, so the runtime copies. Every
runtime read of the element descriptor MUST clear the mark. An array that the
runtime allocates or copies MUST be unmarked. When the runtime copies, the new
capacity SHALL be the larger of `minimum_capacity`, twice the length, and 4.

`Array.RemoveLast` SHALL read the sharing mark of an owned array. A marked
array, a `mut` or `move` parameter slot that still holds the caller's handle,
and an argument that is not an owner SHALL be copied through this export
(`minimum_capacity` one more than the capacity) before the last slot of the
copy is cleared and its length decreased; the copy is written back to the
owner. An unmarked owned array SHALL be shortened in place with no runtime
call. Because `RemoveLast` can allocate, it is not a non-allocating operation
for a serialization publication or rollback body.

#### Scenario: Pointer-bearing storage grows under collection pressure
- **GIVEN** a rooted array of pointer-bearing elements with a valid descriptor
  and initialized values
- **WHEN** typed growth allocates and a collection occurs during the copy
- **THEN** every initialized referent remains reachable, the new array retains
  the identical stride/alignment/pointer map, and the returned construction
  root remains live until finish

#### Scenario: Invalid or overflowing growth fails closed
- **GIVEN** an unowned array, malformed descriptor, impossible minimum
  capacity, or overflowing byte calculation
- **WHEN** typed growth validates the request
- **THEN** it returns failure with a zero root token, leaves the source array
  unchanged, publishes no partial result, and leaks no root

#### Scenario: A marked array grows into an unmarked copy
- **GIVEN** an array with length 1, capacity 4 and the sharing mark set
- **WHEN** generated code grows it by one element
- **THEN** the runtime returns a new unmarked array with length 2 and capacity
  5, and the source array keeps length 1, capacity 4 and its elements

#### Scenario: A marked array shrinks into an unmarked copy
- **GIVEN** a local array with length 3, capacity 4 and the sharing mark set
- **WHEN** generated code runs `Array.RemoveLast` on it
- **THEN** the local holds a new unmarked array with length 2 and the first two
  elements, and the source array keeps length 3 and its elements

### Requirement: Direct bounds-checked array element access
Array length, get, and set operations SHALL lower through typed ISLE rules that
read the manifest-frozen `BeskidArray` layout, reject an index outside the
logical length, reject address multiplication/addition overflow, and perform
the typed load or store directly. Pointer-bearing stores MUST publish the edge
through the canonical array write barrier before any allocation or safepoint;
scalar stores MUST NOT call a pointer barrier. `array_get` and `array_set` MUST
NOT exist as runtime exports, manifest entries, dispatch tags, host calls, or
fallbacks.

#### Scenario: Out-of-bounds get traps before memory access
- **GIVEN** a `T[]` of logical length `n` and an index not in `0..n`
- **WHEN** direct ISLE get lowering executes
- **THEN** it raises the manifest-declared bounds trap before loading an
  element and emits no `array_get` import

#### Scenario: Pointer set stores and bars one edge
- **GIVEN** a valid pointer-bearing array element assignment
- **WHEN** direct ISLE set lowering executes
- **THEN** it checks bounds and address arithmetic, stores the value, invokes
  the canonical array write barrier for the owning array before a safepoint,
  and emits no `array_set` import

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

### Requirement: Array.Append ownership
`Array.Append<T>` on an array that the caller owns SHALL grow the array in place. An owned array SHALL be a `let` local, a `mut` parameter or a field. Growth of a `mut` parameter SHALL change only the callee's copy of the handle and SHALL NOT change the caller's array (see the memory model requirement "Dead growth of a mutable array parameter"). `Array.Append<T>` on an array that the caller does not own, such as a parameter that is not `mut`, a loop or pattern variable, a lambda parameter, a call result or an element, SHALL copy the array and SHALL return the new array; the argument SHALL NOT change. Lowering SHALL NOT fail for an array without a proven owner; it SHALL copy.

#### Scenario: Owned local grows in place
- **GIVEN** `mut i64[] xs = Array.Empty<i64>(); Array.Append<i64>(xs, 1);`
- **WHEN** the code runs
- **THEN** `xs` has one element

#### Scenario: Non-owned array is copied
- **GIVEN** `i64[] Grown(i64[] xs) { return Array.Append<i64>(xs, 1); }` called with an array `a` of length 2
- **WHEN** the code runs
- **THEN** the result has length 3 and `a` still has length 2

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Core.Collections

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/foundation-and-primitives/core-collections/`  
**Source:** `site/spec-content/platform-spec/core-library/foundation-and-primitives/core-collections/content.md`  
**SHA-256:** `7166e107a29b15bffa4b0d18d57167d751159e4187339f1672856cc63cf2b86f`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`Collections` (`List`, `Map`, `Set`, `Queue`, `Stack`, `Array`) use **array-backed storage** with `Collections.Array` `Get<T>` / `Set<T>` / `Len` builtins. Public methods live **inline** on each `pub type` per [D-CORE-API-0002](/platform-spec/core-library/stability-and-api-shape/corelib-api-shape/adr/0005-owning-type-inline-methods/). Optional fluent wrappers are generated per [Core.Fluent](/platform-spec/core-library/foundation-and-primitives/core-fluent/).
</SpecSection>

<SpecSection title="Storage model (v1)" id="storage-model">
| Type | Backing fields |
| --- | --- |
| `List<T>` | `T[] storage`, `i64 count` |
| `Stack<T>` | `T[] storage`, `i64 count` |
| `Queue<T>` | `T[] storage`, `i64 head`, `i64 count` |
| `Set<T>` | `T[] storage`, `i64 count` (linear scan; `@tier(unstable)` until hash builtin) |
| `Map<K,V>` | `MapEntry<K,V>[] entries`, `i64 count` |
| `Array` | `T[]` handle + `Len` / `Get` / `Set` / `Append` / `Iterate` |
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Design model](./articles/design-model/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/foundation-and-primitives/core-collections/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/core-library/foundation-and-primitives/core-collections/articles/design-model/content.md`  
**SHA-256:** `5c8ee7b5960ebcd85519ccfbbc20e6220da9e5e95dca5609ed4f71114fb72a95`

<details>
<summary>Migrated source text</summary>

``````markdown
## Module layout

```
Collections/
  Collections.bd       # hub re-exports
  Array/Array.bd       # Len, Get, Set, Append, Iterate
  List/List.bd
  Map/Map.bd, Map/MapEntry.bd
  Set/Set.bd
  Queue/Queue.bd
  Stack/Stack.bd
```

Each collection type file uses hub-plus-type-directory layout; methods are **inline** on `pub type`.

## Iterator protocol

`Array.Iterate<T>` yields index advancement over `T[]`. `Query.QueryState<T>` holds `source`, `index`, `length`, and optional cached `first`—see Query operators (`Where`, `Select`, `Take`, `Skip`, `First`, `ToList`, `Any`, `All`, `OrderBy`, `CollectArray`, `Count`).

## Fluent relationship

Underlying types expose inline methods. Optional `{Type}Fluent` wrappers delegate to the same semantics; they do not introduce new storage or error models.

## Grow policy

`Array.Append` uses copy-on-grow until a runtime grow builtin exists; list capacity growth is `@tier(unstable)` where documented.

## Implementation anchors

- `compiler/corelib/packages/foundation/src/Collections/`
- `compiler/corelib/beskid_corelib/tests/corelib_tests/src/collections/`
``````

</details>
