---
title: Core.Optional
description: Canonical optional-value type for corelib APIs and query iterators.
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
`Core.Optional` defines the sole normative optional-value surface for corelib: `Option<T>` with `Some` and `None` variants, plus helpers (`HasValue`, `Map`, `UnwrapOr`). API boundaries that represent presence or absence **must** use `Core.Optional.Option<T>` or an explicit `enum` with a dedicated absent variant—not deprecated query shims or language sugar.
</SpecSection>

<SpecSection title="Scope" id="scope">
- **In scope:** `Option<T>` enum, presence helpers, and migration of collection, concurrency, environment, and query APIs to import `Core.Optional` directly.
- **Out of scope:** Nullable reference types, `?T` syntax, and error-bearing absence (`Result` remains the failure channel).
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/corelib/packages/foundation/src/Core/Optional.bd`
- `compiler/corelib/packages/foundation/src/Core/Optional/Option.bd`
- Corelib tests: `compiler/corelib/beskid_corelib/tests/corelib_tests/src/core/OptionalTests.bd`
</SpecSection>

<SpecSection title="Contract statement" id="contract-statement">
| Surface | Rule |
| --- | --- |
| Canonical type | `Core.Optional.Option<T>` |
| Variants | `Some(T value)` and `None` only in v1 |
| `Result` interaction | `Result` signals failure; `Option` signals absence without error detail—do not conflate at public API boundaries |
| Deprecation | Legacy `Query.Contracts` shim **must** be removed after consumers migrate to `Core.Optional` |
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-CORE-OPT-0003`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Design model](./articles/design-model/)
<!-- /spec:generate:article-index -->
