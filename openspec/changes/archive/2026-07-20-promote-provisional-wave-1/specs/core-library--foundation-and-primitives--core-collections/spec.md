## ADDED Requirements

### Requirement: Array-backed collection storage
`List`, `Map`, `Set`, `Queue`, `Stack`, and `Array` SHALL use array-backed storage with `Collections.Array` `Get<T>` / `Set<T>` / `Len` builtins. `List<T>` and `Stack<T>` MUST store `T[] storage` and `i64 count`; `Queue<T>` MUST store `T[] storage`, `i64 head`, and `i64 count`; `Set<T>` MUST store `T[] storage` and `i64 count` with linear scan; `Map<K,V>` MUST store `MapEntry<K,V>[] entries` and `i64 count`; `Array` MUST expose a `T[]` handle with `Len` / `Get` / `Set` / `Append` / `Iterate`.

#### Scenario: List uses array-backed fields
- **GIVEN** a `List<T>` value constructed by corelib
- **WHEN** an implementation inspects its storage model
- **THEN** the list is backed by `T[] storage` and `i64 count` accessed through `Collections.Array` builtins

### Requirement: Inline public collection methods
Public collection methods SHALL live inline on each `pub type` (hub-plus-type-directory layout). Optional `{Type}Fluent` wrappers MUST delegate to the same semantics and MUST NOT introduce new storage or error models.

#### Scenario: Fluent wrapper does not change storage
- **GIVEN** an underlying collection type with inline methods and an optional fluent wrapper
- **WHEN** a caller invokes an equivalent operation through the fluent wrapper
- **THEN** the wrapper delegates to the same semantics without adding storage or a distinct error model

### Requirement: Array iterator and Query state
`Array.Iterate<T>` SHALL yield index advancement over `T[]`. `Query.QueryState<T>` MUST hold `source`, `index`, `length`, and an optional cached `first` for Query operators.

#### Scenario: Iterate advances by index
- **GIVEN** a non-empty `T[]` array
- **WHEN** a caller enumerates via `Array.Iterate<T>`
- **THEN** iteration advances by index over the array elements

## REMOVED Requirements

### Requirement: Core.Collections conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
