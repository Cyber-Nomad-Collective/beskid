---
title: Package-prefixed symbol identity
description: SymbolQualifier and SymbolRegistry as stable cross-unit definition
  identity alongside dense ItemId.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-SEM-0016
adrStatus: Accepted
adrDate: 2026-06-05
lastReviewed: 2026-06-05
---

## Context

`ItemId(usize)` is a dense, phase-local index into `Resolution.items`. It works for span tables and type maps inside one merged resolution, but cross-unit tooling (LSP workspace references, link-plan discovery, registry docs) needs a **stable definition key** that survives per-unit re-resolve and prefetch/entry merge.

Qualified names were previously recomputed post-hoc in doc emission (`qualified_names.rs`) without a single authoritative registry. Duplicate export names could last-win silently in helper scans.

## Decision

Introduce **package-prefixed canonical symbol identity** parallel to `ItemId`:

| Type | Role |
| --- | --- |
| **`SymbolQualifier`** | `{ package, shape }` — package is `CompilePlan.project_name` for the entry/host unit or the dependency `project_name` for prefetched units; builtins use fixed package `beskid` |
| **`SymbolShape`** | Encodes module items, members, methods, and builtins into one `::`-separated string |
| **`SymbolId`** | Interned key into **`SymbolRegistry`** |
| **`Resolution.by_symbol`** | Maps `SymbolId` → authoritative `ItemId` after collect |

**Hot paths keep `ItemId`.** Type maps, scoped span tables, and `LocalId` stay unchanged. Symbol identity is authoritative for:

- cross-unit **definition identity** (IDE references, link-plan callee discovery),
- **`api.json` `symbolKey`** when the row is registry-backed,
- **`@ref` / type-ref lookup** by full package-prefixed path.

Collection assigns `ItemInfo.symbol` for exportable rows; duplicate `SymbolQualifier` values **must** surface as structured resolve errors instead of silent last-wins in name scans.

Canonical lookup helpers live in `resolve/symbol_lookup.rs` (`symbol_for_item`, `item_id_for_symbol`, `canonical_item_id`, `qualified_name`).

## Encoding (normative examples)

| Shape | Example key |
| --- | --- |
| Module export | `corelib::Std::Console::Capabilities::ShouldEmitAnsi` |
| Member | `corelib::Std::Console::Capabilities::colorDisabled` |
| Method | `corelib::Capabilities::ShouldEmitAnsi` (receiver string + method name) |
| Builtin | `beskid::range` |

`qualifiedName` on `api.json` rows **may** retain legacy module-relative strings for display; **`symbolKey`** carries the registry string when present ([D-TOOL-CLI-0003](/platform-spec/tooling/cli/api-json-contract/adr/0003-symbol-key-field/)).

## Consequences

- `ModuleIndex` prefetch clones one shared registry into entry and per-unit resolve paths.
- IDE `references_at_offset_workspace` matches references by **`SymbolId`** when both sides have registry symbols, not raw `ItemId` equality across unit re-resolve.
- Codegen `FunctionDefIndex` and link-plan visitation use `by_symbol` as the primary callee index; span scans are fallback only.
- Tests and golden `api.json` fixtures gain `symbolKey` on exportable symbols when re-emitted with a current CLI.

## Verification anchors

- `compiler/crates/beskid_analysis/src/resolve/symbol.rs`
- `compiler/crates/beskid_analysis/src/resolve/symbol_lookup.rs`
- `compiler/crates/beskid_analysis/src/resolve/collect.rs`
- `compiler/crates/beskid_analysis/src/projects/assembly/module_index.rs`
- `compiler/crates/beskid_analysis/src/services/document.rs` (symbol-aware references)
- `compiler/crates/beskid_codegen/src/linking/def_index.rs`
