<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Core.Collections Specification

## Purpose

Array-backed collection types, inline methods, and iterator protocol.

## Requirements

### Requirement: Core.Collections conformance status
This capability SHALL remain non-conformant and MUST NOT be cited as an implemented Beskid guarantee until a validated OpenSpec change adds explicit behavioral requirements.

**Stable ID:** `BSP-REQ-2723D390E694`

#### Scenario: Capability has descriptive material only
- **GIVEN** the migrated sources contain no uppercase BCP-14 obligation or accepted ADR decision
- **WHEN** an implementation reports Beskid conformance
- **THEN** it MUST NOT claim conformance based on this capability

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
