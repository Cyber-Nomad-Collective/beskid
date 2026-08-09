## MODIFIED Requirements

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

## ADDED Requirements

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
