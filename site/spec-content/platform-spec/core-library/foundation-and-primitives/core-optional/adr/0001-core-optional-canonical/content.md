---
title: Core.Optional.Option canonical
description: Core.Optional replaces Query.Contracts for optional values.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-OPT-0003
adrStatus: Accepted
adrDate: 2026-06-10
lastReviewed: 2026-06-10
---

## Context

`Query.Contracts` historically hosted `Option<T>` because query iterators were the primary consumer. Optional presence is now a cross-cutting primitive used by collections, concurrency, environment probes, and language-meta type rules.

## Decision

| Rule | Detail |
| --- | --- |
| Canonical module | `Core.Optional.Option<T>` under `Core/Optional/` |
| Deprecation | `Query.Contracts` **must** be deprecated; it **may** re-export `Core.Optional` for one release only |
| API boundaries | Public corelib signatures **must** spell `Core.Optional.Option<T>` (or unqualified `Option<T>` after `use Core.Optional`) |
| Language spec | Glossary and [Types](/platform-spec/language-meta/type-system/types/) **must** reference `Core.Optional`, not `Query.Contracts` |

## Consequences

- Iterator `First()` and map `TryGet` return `Core.Optional.Option<T>`.
- Book and platform-spec examples migrate off `use Query.Contracts` for `Option`.
- `Query.Contracts.bd` is removed after the shim window.

## Verification anchors

- `compiler/corelib/packages/foundation/src/Core/Optional/`
- `OptionalTests.bd` under `beskid_corelib/tests/corelib_tests/`
