---
title: Export attribute
description: Normative Export metadata for pub functions exposed to foreign hosts (v0.3).
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-20
---

## Placement

**`Export`** applies to **`pub` function definitions** only in v0.3 Standard. Contract methods, types, and modules **must not** use **`Export`** until a future profile promotes contract vtables.

## Attribute fields

| Field | Required | Meaning |
| --- | --- | --- |
| **`Abi`** | yes | **`"C"`** for v0.3 Standard |
| **`Symbol`** | no | Exported linker symbol; default is the Beskid function name (unmangled) |

Example:

```beskid
[Export(Abi:"C", Symbol:"beskid_plugin_init")]
pub i64 plugin_init(i64 host_api_version) {
    return 0;
}
```

## Permitted signatures

Export functions **must** use the same type set as **`Extern`** import methods in v0.3.0 ([interop view types](/platform-spec/language-meta/interop/c-abi-profile/interop-view-types/)).

## Linkage

Exported symbols **must** be emitted with global linkage visible to the platform linker. The build driver **must** include Beskid-generated objects and the runtime static archive per backend docs.

## Panics

Panics in exported functions **must** be treated as **non-returning traps** across the boundary ([error and unwind](/platform-spec/language-meta/interop/interop-contracts/error-and-unwind-semantics/)).
