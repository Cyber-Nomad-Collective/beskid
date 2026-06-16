---
title: Resolver contract - Verification and traceability
description: Tests and code anchors proving SymbolRegistry and cross-unit
  reference behavior.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-05
---

## Verification checklist

- [ ] `SymbolRegistry` populated during prefetch + entry collect for exportable symbols
- [ ] `by_symbol` maps each `SymbolId` to the authoritative `ItemId`
- [ ] `qualified_name(res, item)` matches `symbol_to_string` for registry-backed rows
- [ ] IDE workspace references match across units when `SymbolId` matches but `ItemId` differs
- [ ] `api.json` emits `symbolKey` only for registry-backed rows (current CLI)
- [ ] pckg rejects duplicate or malformed `symbolKey` on pack validation

## Test anchors

| Area | Location |
| --- | --- |
| Resolver / collect | `compiler/crates/beskid_tests/src/analysis/resolve.rs` |
| Symbol-aware IDE refs | `compiler/crates/beskid_analysis/src/services/document.rs` (`reference_target_tests`) |
| Assembly-backed LSP fixture | `compiler/crates/beskid_analysis/src/services/document_tests.rs` (`corelib_mvp_*`) |
| `@ref` by symbol key | `compiler/crates/beskid_analysis/src/doc/refs.rs` |
| Type-ref index | `compiler/crates/beskid_analysis/src/doc/qualified_names.rs` |
| Entry resolution query | `compiler/crates/beskid_queries/tests/incremental.rs` (`entry_resolution_with_db_*`) |
| Link-plan symbol index | `compiler/crates/beskid_codegen/src/linking/def_index.rs` |

## Code paths

- `compiler/crates/beskid_analysis/src/resolve/symbol.rs`
- `compiler/crates/beskid_analysis/src/resolve/symbol_lookup.rs`
- `compiler/crates/beskid_analysis/src/resolve/collect.rs`
- `compiler/crates/beskid_analysis/src/projects/assembly/module_index.rs`
- `compiler/crates/beskid_analysis/src/services/document.rs`

When behavior changes, update this article and the normative ADR [D-COMP-SEM-0016](/platform-spec/compiler/semantic-pipeline/resolver-contract/adr/0005-package-prefixed-symbol-identity/) before relying on crate comments alone.
