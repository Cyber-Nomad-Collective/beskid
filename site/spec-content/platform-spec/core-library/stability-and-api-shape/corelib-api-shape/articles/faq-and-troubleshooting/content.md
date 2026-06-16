---
title: FAQ and troubleshooting
description: Common questions about `@tier(...)` directives, prelude exposure,
  and how to debug tier drift between sources and `api.json`.
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

## Why is my `@tier(...)` directive not showing up in `api.json`?

Three common causes:

1. The directive is on a non-public item. The resolver only stamps `tier` on items whose `visibility` is `public`. Promote the item visibility or annotate the wrapping `pub` item.
2. The directive sits in a detached doc block before a blank line. The parser binds `///` runs to the next declaration; a blank line breaks the binding and the directive is dropped silently. Move the directive into the doc comment that touches the item.
3. `beskid doc` was run on a different package than the one publishing `api.json`. The resolver runs after `assign_declaring_packages`, so items in a path-only dependency stay `tier: None` even when their source carries a directive. Run `beskid doc` inside the owning package.

## I promoted a module to Tier 1 but the prelude validator still fails

The prelude validator inspects the `pub mod ...;` list and the effective tier of every re-exported module. If one nested module is still Tier 2 / Tier 3, the publish job fails. Either promote the nested module or stop re-exporting the parent through the prelude — explicit `use ...;` imports are the correct way to access non-Tier-1 surface.

## How do I debug tier drift between sources and `api.json`?

1. Run `beskid doc --package <name> --output api.json` and grep for `"tier"` to see what landed.
2. Compare the count of `@tier(` lines in the package sources with the count of `"tier"` keys in `api.json`. A gap means the cascade did not match — usually a non-public item or a detached doc block.
3. Run `cargo test -p beskid_tests projects::corelib::layout::checked_in_corelib_tier_metadata_round_trips_through_api_json` to confirm the resolver's behavior in isolation.

## What if I disagree with the workspace default of `supported`?

Open an ADR under `corelib-api-shape/adr/` proposing the new default. Until accepted, `supported` is the de jure workspace default per [D-CORE-API-SHAPE-0001](/platform-spec/core-library/stability-and-api-shape/corelib-api-shape/adr/0001-three-tier-classification/) and the resolver leaves untagged items as `tier: None` so consumers apply that default uniformly.

## Why does the prelude only re-export Tier 1 modules?

[D-CORE-API-SHAPE-0002](/platform-spec/core-library/stability-and-api-shape/corelib-api-shape/adr/0002-prelude-tier1-only/) explains the decision. Short version: the prelude is the path of least resistance for new authors; offering them an item that may change shape between minors would silently degrade the upgrade experience.

## Where do I report Tier 1 / Tier 2 contract breaches?

Open an issue against the owning crate and attach:

- The `qualifiedName`, optional **`symbolKey`**, and current `tier` from `api.json`.
- The PR or commit that introduced the breach.
- The corresponding test from the verification matrix that should have caught it but did not — that is the regression-proofing target.

## Does the `tier` field affect runtime behavior?

No. The classification is metadata only. Tier 3 items compile and execute identically to Tier 1 items; the tier signals stability promises to humans and tooling, not the compiler's lowering or codegen.
