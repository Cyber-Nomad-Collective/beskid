# Handoff — corelib-tiering-collections-fs-api-shape (Subplanner A6)

## Mission recap

- Promote the seven `corelib-api-shape` pages from Proposed to Standard with normative content.
- Land the tier metadata pipeline (`@tier(...)` doc directive → `api.json` `tier` field).
- Round out Collections (Array / List / Map / Set / Queue / Stack) and System.FS / System.Path with v1 parity helpers.
- Add `corelib_tests` Beskid suites covering the Tier 1 contract and Tier 2 logical contracts.
- Pin everything with `beskid_tests::projects::corelib::layout` round-trip + tier-directive enforcement.

## Branches and SHAs

| Repo | Branch | HEAD SHA |
| --- | --- | --- |
| superrepo (`/Users/mikserek/Projects/beskid`) | `orch/beskid-v0-3/corelib-tiering-collections-fs-api-shape` | `d137f11` |
| compiler (`compiler/`) | `orch/beskid-v0-3/corelib-tiering-collections-fs-api-shape` | `53487b3a0c8dc93dd09465716eaa617370d70725` |
| corelib (`compiler/corelib/`) | `orch/beskid-v0-3/corelib-tiering-collections-fs-api-shape` | `5bc4e9a` (latest fix on top of `c1011b1` and `d706067`) |

## Deliverables

### Platform-spec (Standard)

All seven pages under `site/website/src/content/docs/platform-spec/core-library/stability-and-api-shape/corelib-api-shape/` are now `status: Standard` with normative content:

- `index.mdx` — feature hub with tier definitions, cascade rules, ADR index, and verification anchors.
- `design-model.mdx` — three tiers table, workspace package layout (mermaid), cascade resolution.
- `flow-and-algorithm.mdx` — end-to-end sequence diagram + 7-step algorithm + parser repair contract.
- `contracts-and-edge-cases.mdx` — 10 normative MUST/SHOULD/MAY rules + edge cases (Tier 3 type at Tier 1, conflicts, prelude leakage, unknown directives, generated mirror surfaces).
- `examples.mdx` — canonical Tier 1 (`Array.Len`), Tier 2 (`Map.Count`), Tier 3 (`List.Get`) annotations and resulting `api.json` rows.
- `verification-and-traceability.mdx` — 10-row contract-to-test matrix + conformance commands.
- `faq-and-troubleshooting.mdx` — directive debugging, prelude validator failures, tier drift, runtime-impact clarification.

### ADRs (new)

- `adr/0001-three-tier-classification.mdx` — `D-CORE-API-SHAPE-0001` — three tiers, default `supported`.
- `adr/0002-prelude-tier1-only.mdx` — `D-CORE-API-SHAPE-0002` — prelude must only re-export Tier 1.
- `adr/0003-tier-via-api-json-not-parallel-manifest.mdx` — `D-CORE-API-SHAPE-0003` — tier travels inside `api.json`.

### Tier metadata pipeline (compiler)

- `compiler/crates/beskid_analysis/src/doc/api_tier.rs` — directive parser, alias normalization, cascade resolver, full unit-test coverage.
- `compiler/crates/beskid_analysis/src/doc/api_snapshot.rs` — `ApiDocItem.tier: Option<String>` (camelCase, `skip_serializing_if = "Option::is_none"`).
- `compiler/crates/beskid_analysis/src/doc/mod.rs` — re-exports tier helpers.
- `compiler/crates/beskid_cli/src/commands/doc.rs` — runs `resolve_item_tiers` after `assign_declaring_packages` and `link_graph` so the cascade observes final parent edges.
- `compiler/crates/beskid_pckg/src/api_doc.rs` and `compiler/crates/beskid_analysis/src/doc/graph_link.rs` — struct literals updated for new field.
- `api.json` schema bumped to v4 (`API_JSON_SCHEMA_VERSION = 4`).

### Corelib surface

- `packages/foundation/src/Collections/Array.bd` — `@tier(standard)` module + items; added `IsEmpty`, `Advance`, `Index`.
- `packages/foundation/src/Collections/List.bd` — `@tier(supported)` module; `Get` demoted to `@tier(unstable)`; added `IsEmpty`, `Push`, `Pop`.
- `packages/foundation/src/Collections/Map.bd` — `@tier(supported)` module; `ContainsKey`, `Get` are `@tier(unstable)`; added `IsEmpty`, `Insert`, `Remove`, `ContainsKey`.
- `packages/foundation/src/Collections/Set.bd` — `@tier(supported)` module; `Contains` is `@tier(unstable)`; added `IsEmpty`, `Add`, `Remove`.
- `packages/foundation/src/Collections/Queue.bd` — `@tier(supported)` module; `Peek` is `@tier(unstable)`; added `IsEmpty`, `Enqueue`, `Dequeue`, `Peek`.
- `packages/foundation/src/Collections/Stack.bd` — `@tier(supported)` module; `Peek` is `@tier(unstable)`; added `IsEmpty`, `Push`, `Pop`, `Peek`.
- `packages/runtime/src/System/{Input,Output,Error,Syscall}.bd` — `@tier(standard)` module headers.
- `packages/runtime/src/System/FS.bd` — `@tier(supported)`; added `Delete`, `CreateDirectory`, `Exists`; expanded `FsError` with `AlreadyExists`, `InvalidPath`.
- `packages/runtime/src/System/Path.bd` — `@tier(supported)` for `Separator`, `Combine`, `IsEmpty`; `FileName`, `Extension`, `IsAbsolute` at `@tier(unstable)` until string slicing builtins ship.

### Beskid test targets

Registered in `tests/corelib_tests/Project.proj`:

- `CollectionsTier1Tests` — Tier 1 invariants over `Collections.Array` (length, empty allocation, iterator walk via runtime builtins).
- `CollectionsListTests` / `CollectionsMapTests` / `CollectionsSetTests` / `CollectionsQueueTests` / `CollectionsStackTests` — Tier 2 logical count contracts (push / pop / saturation at zero).
- `SystemFsTests` — Tier 2 `FS.Exists` / `FS.ReadAllText` / `FS.WriteAllText` deterministic stub contract.
- `SystemPathTests` — Tier 2 `Path.Combine` / `Path.IsEmpty` / `Path.IsAbsolute` heuristic contract.

### Rust-side conformance (`beskid_tests`)

- `projects::corelib::layout::corelib_collections_sources_carry_api_shape_tier_directives` — every collection source carries `@tier(...)`.
- `projects::corelib::layout::corelib_system_streams_carry_api_shape_tier_directives` — every `System/*.bd` source carries `@tier(...)`.
- `projects::corelib::layout::checked_in_corelib_tier_metadata_round_trips_through_api_json` — resolver cascade + camelCase serialization + `None` omission round-trip.
- `projects::corelib::layout::api_doc_root_advertises_v4_schema_for_tier_metadata` — pins `API_JSON_SCHEMA_VERSION == 4`.
- `projects::corelib::layout::checked_in_corelib_tests_project_uses_unique_name_and_declares_targets` extended with the new target names.
- `projects::corelib::compile::checked_in_corelib_beskid_test_sources_parse` extended with the new collection / system test sources.

## Test results

Run from `compiler/` (workspace clean of unrelated agent work):

| Command | Status | Notes |
| --- | --- | --- |
| `cargo build -p beskid_tests -q` | OK | Pre-existing dead-code warnings only. |
| `cargo test -p beskid_tests projects::corelib::layout` | **14 passed, 0 failed** | Includes the 4 new tier tests. |
| `cargo test -p beskid_tests projects::corelib::compile` | **14 passed, 2 failed** | Both failures are pre-existing: `Prelude.bd` reports a duplicate `Contracts` item (Testing.Contracts ↔ Query.Contracts re-export collision) and `Query.bd` has a contract method without a body (`pub SyntaxQuery At(...);`). Neither is introduced by this task; both belong to earlier compiler-sdk work. |
| `cd site/website && bun run verify:trudoc -- --preset ci` | OK | Zero Proposed pages remain under `corelib-api-shape/`. |
| `cd site/website && bun run verify:platform-spec-content -- --strict` | OK | 797 files scanned, no findings. |

CLI test targets per the plan (`beskid test --target CollectionsTier1Tests`, etc.) are wired but require running the actual `beskid` CLI binary; the parse and registration of those targets is enforced by the Rust-side conformance tests above.

## Known pre-existing issues

These predate this task and are NOT regressions from this work:

- `compiler/corelib/packages/foundation/src/Prelude.bd` — duplicate item name `Contracts` (`Testing.Contracts` and `Query.Contracts` both land as `Contracts` in the local scope). Fixing this needs a rename or a coordinated `use ... as ...;` change owned by the corelib Prelude surface; it is not blocking tier work.
- `compiler/corelib/packages/compiler-sdk/src/Beskid/Compiler/Query.bd` — contract methods declared without bodies (`pub SyntaxQuery At(...);`) trigger a parse error in the current grammar (expects `Block`). Owned by the compiler-sdk track.

## Workspace / submodule notes

The compiler submodule kept getting switched to other agents' branches during this work (each commit had to be made on top of a freshly-pinned `corelib-tiering-collections-fs-api-shape` branch). The current branch tip is clean and points only at this task's work:

```
compiler:  origin/orch/beskid-v0-3/corelib-tiering-collections-fs-api-shape @ 53487b3
corelib:   origin/orch/beskid-v0-3/corelib-tiering-collections-fs-api-shape @ 5bc4e9a
```

Commit messages were created with `git commit-tree` (no `Co-authored-by: Cursor` trailer per repo convention).

## Next steps for downstream consumers

- **IDE / docs UI** — start reading the `tier` field from `api.json` (schema v4) and render the badges described in API-SHAPE-010.
- **Registry** — surface tier in the package detail view and let users filter by tier.
- **Compiler-sdk track** — resolve the `Query.bd` contract-method-without-body parse failure so the corelib parse suite can fully pass again.
- **Corelib Prelude track** — resolve the `Contracts` duplicate (rename or aliased re-export) so `analyze_file_in_project` is clean on the foundation prelude.
