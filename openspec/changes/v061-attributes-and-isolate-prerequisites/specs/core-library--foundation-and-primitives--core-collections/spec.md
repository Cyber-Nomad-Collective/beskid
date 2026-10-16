## ADDED Requirements

### Requirement: Collections are Isolated types
`List<T>`, `Stack<T>`, `Queue<T>`, `Set<T>`, `Map<K, V>`, `PriorityQueue<T>`, `I64Map<V>` and `StringMap<V>` SHALL carry `[Isolated]`, so that each has transfer class Moved when its element types are Transferable and Never otherwise. `HashTable<K, V>` SHALL carry `[Isolated]` as well. No collection SHALL carry `[Immutable]`, `[Copyable]` or `[NeverTransferable]`. The attribute SHALL impose no behavioral change in this release.

#### Scenario: List of strings is Moved
- **GIVEN** the corelib `List<T>` and the type `List<string>`
- **WHEN** its transfer class is computed
- **THEN** it is Moved

#### Scenario: Map with a handle value is Never
- **GIVEN** the type `Map<string, Channel<i64>>`
- **WHEN** its transfer class is computed
- **THEN** it is Never naming the `entries` field

#### Scenario: Collection satisfies a Moved bound
- **GIVEN** `unit Take<T>(T value) where T: Moved { }` and `Take<Queue<i64>>(queue)`
- **WHEN** the bound is proven
- **THEN** the proof succeeds
