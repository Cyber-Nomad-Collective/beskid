---
title: Owning-type inline methods
description: Corelib-owned types declare methods inside pub type blocks; extend
  type is forbidden.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-API-0002
adrStatus: Accepted
adrDate: 2026-06-10
lastReviewed: 2026-06-10
---

## Context

Corelib types such as `Collections.List` and `Concurrency.Mutex` historically exposed free functions and `extend type` blocks for methods defined outside the owning type file. That scatters the public API, complicates `api.json` tier stamping, and conflicts with the hub-plus-type-directory layout used by [Core.Time](/platform-spec/core-library/stability-and-api-shape/core-time/).

## Decision

| Rule | Detail |
| --- | --- |
| Owning methods | Methods on corelib-owned `pub type` **must** be declared inside the type's `pub type { }` block in the owning module file |
| `extend type` | `extend type` **must not** add members to types defined in corelib packages (`foundation`, `concurrency`, `console`, `runtime`) |
| Free functions | Module-level free functions **may** remain for constructors and namespace helpers that do not take a receiver |
| Foreign types | `extend type` for types defined outside corelib (user code, mods) remains governed by [extend type](/platform-spec/language-meta/program-structure/extend-type/) |

## Consequences

- Existing `extend type` usage (for example on `Mutex`) migrates to inline methods before the refactor closes.
- [Core.Collections](/platform-spec/core-library/foundation-and-primitives/core-collections/) and concurrency hubs document per-type inline method sets.
- Tier directives on methods inherit from the owning type module unless overridden per item.

## Verification anchors

- `compiler/corelib/packages/**` — no `extend type` targeting corelib-owned types after migration
- `compiler/crates/beskid_tests/src/projects/corelib/layout.rs` structure gates
