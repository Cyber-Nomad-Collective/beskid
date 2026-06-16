---
title: Tier metadata travels via `api.json`, not a parallel manifest
description: The corelib API-shape tier classification is serialized as a `tier`
  field on every `ApiDocItem` row; tooling must not consult a parallel JSON /
  TOML file for tiers.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-API-SHAPE-0003
adrStatus: Accepted
adrDate: 2026-05-23
lastReviewed: 2026-05-23
---

## Context

Tier classification needs to flow from corelib sources to consumers (pckg dashboard, IDE tooling, conformance fixtures). Two paths were considered: (a) emit a sibling `tiers.json` next to `api.json`, or (b) attach the tier directly to each item row in `api.json`. Path (a) creates a second source of truth and risks drift when items rename or move; path (b) keeps the contract in one place but requires a `api.json` schema bump.

## Decision

| Rule | Detail |
| --- | --- |
| Field placement | `tier: Option<String>` on `ApiDocItem` in `compiler/crates/beskid_analysis/src/doc/api_snapshot.rs` |
| Serialization | camelCase `tier`; lowercase value; omitted when unresolved |
| Schema version | `API_JSON_SCHEMA_VERSION` stays at `4`; the `tier` field is additive and consumers that ignore unknown fields are unaffected |
| Anti-pattern | Tooling **must not** consult a parallel manifest file (`tiers.json`, `Tier.toml`, …) for tier classification |

## Consequences

- One source of truth: every tooling consumer reads from `api.json` and gets tier alongside signature, doc markdown, and module path.
- Future schema changes (e.g., adding `tierReason` or `since`) can layer onto the same row without splitting the contract.
- Authors discover tier drift the moment `beskid doc` runs locally; there is no second file to forget to update.

## Verification anchors

- `compiler/crates/beskid_analysis/src/doc/api_snapshot.rs::ApiDocItem`
- `compiler/crates/beskid_analysis/src/doc/api_tier.rs`
- `compiler/crates/beskid_cli/src/commands/doc.rs::execute`
- `compiler/crates/beskid_tests/src/projects/corelib/layout.rs::api_doc_root_advertises_v4_schema_for_tier_metadata`
