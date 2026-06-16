---
title: Examples
description: Canonical Tier 1 / Tier 2 / Tier 3 annotations on
  `Collections.Array.Len`, `Collections.Map.Count`, and `Collections.List.Get`,
  plus the resulting `api.json` rows.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-23
---

## Example 1: Tier 1 — `Collections.Array.Len`

Source (`compiler/corelib/packages/foundation/src/Collections/Array.bd`):

```beskid
/// Returns array length (element count).
/// @tier(standard)
/// @par(T) Element type of the slice (length is independent of `T` in v1).
/// @arg(values) Slice-like array handle.
/// @returns Element count from the runtime header.
pub i64 Len<T>(T[] values) {
    return __array_len(values);
}
```

Resulting `api.json` row (truncated):

```json
{
  "qualifiedName": "Collections::Array::Len",
  "kind": "function",
  "visibility": "public",
  "tier": "standard",
  "signature": "fn Len<T>(values: T[]) -> i64"
}
```

## Example 2: Tier 2 — `Collections.Map.Count`

Source (`compiler/corelib/packages/foundation/src/Collections/Map.bd`):

```beskid
/// Counter for the logical map size.
/// @tier(supported)
/// @arg(map) Map handle (storage still wired through Tier 3 helpers).
/// @returns Number of key-value pairs.
pub i64 Count<K, V>(Map<K, V> map) {
    return map.count;
}
```

Resulting `api.json` row:

```json
{
  "qualifiedName": "Collections::Map::Count",
  "kind": "function",
  "visibility": "public",
  "tier": "supported",
  "signature": "fn Count<K, V>(map: Map<K, V>) -> i64"
}
```

## Example 3: Tier 3 — `Collections.List.Get`

Source (`compiler/corelib/packages/foundation/src/Collections/List.bd`):

```beskid
/// Returns the element at `index`. Tier 3 until List storage is wired into the runtime.
/// @tier(unstable)
/// @par(T) Element type stored in the list.
/// @arg(list) List handle.
/// @arg(index) Zero-based index.
/// @returns Element at `index`; behaviour for out-of-range indices is undefined in v1.
pub T Get<T>(List<T> list, i64 index) {
    return list.head;
}
```

Resulting `api.json` row:

```json
{
  "qualifiedName": "Collections::List::Get",
  "kind": "function",
  "visibility": "public",
  "tier": "unstable"
}
```

## Example 4: Cascade inheritance

When a module declares a tier on its first item, the resolver applies that tier to every member that omits its own directive. `Collections.Map`'s module-level `@tier(supported)` covers `Count`, `IsEmpty`, `Insert`, and `Remove`; only `ContainsKey` and `Get` carry an explicit `@tier(unstable)` override.

## Example 5: Omission round-trip

Items that flow through the cascade without a match (rare in corelib because every module annotates itself) emit no `tier` field at all:

```json
{
  "qualifiedName": "ThirdParty::Pkg::Helper",
  "kind": "function",
  "visibility": "public"
}
```

Consumers MUST treat this as `supported` so external packages that have not yet adopted tiering interop cleanly with the corelib pipeline.
