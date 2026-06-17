---
title: Core.Collections
description: Array-backed collection types, inline methods, and iterator protocol.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-10
---

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
