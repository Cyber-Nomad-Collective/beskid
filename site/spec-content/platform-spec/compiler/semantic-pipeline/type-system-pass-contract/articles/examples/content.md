---
title: Type-system pass contract - Examples
description: Gives concrete newcomer-friendly scenarios mapped to real compiler paths.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-16
---

## What this covers

Worked examples that map the three-pass `lower.type_check` contract to real entry points and lookup APIs.

## Example 1 — CLI build uses `FullClosure`

`beskid run` and `beskid build` assemble the import closure, then type-check every dependency body before the entry unit.

```text
assemble_program → lower_normalize_resolve_type_spanned_with_assembly
  → typed_hir_from_lowered(..., DependencyTypingPolicy::FullClosure)
    → lower.type_check: index → surface → check → lowering prep → TypeResult
```

A type error in a dependency module blocks the executable spine the same as an entry error.

## Example 2 — IDE gate uses `EntryOnly`

When only the entry file changed and dependency surfaces are still valid in the Salsa cache, the fast path may skip re-walking dependency bodies:

```text
type_entry_gate(entry_hir, assembly)
  → typed_hir_from_lowered(..., DependencyTypingPolicy::EntryOnly)
```

Dependency units still contribute merged signatures from `unit_type_surface_tracked`; only the entry body is fully checked.

## Example 3 — Reading an expression type in codegen

After a successful check pass, codegen **must** consult `node.id`, not the source span:

```rust
// Preferred: HirNodeId on the Spanned expression node
let ty = type_result.node_type(call.id)?;

// Equivalent sugar
let ty = type_result.expr_type(call)?;
```

Call dispatch and casts use the same id:

```rust
type_result.lowering.call_kind_at(call.id);
type_result.lowering.cast_intents_for_node(call.id);
```

## Example 4 — Ambiguous `let` triggers E1202

Source:

```beskid
let sum = 1 + 2; // no contextual type — numeric metavariable stays ambiguous
```

The check pass introduces an `IsNumeric` constraint; `solve_constraints` leaves the metavariable unbound and emits **E1202** (`MissingTypeAnnotation`) at the binding site. The compiler does not default to `i32` or `i64`.

## Example 5 — Incremental surface invalidation

Given `main.bd` importing `lib.bd`:

1. Edit `lib.bd` → Salsa invalidates `lib` parse/resolution/surface tokens.
2. Reverse-deps BFS evicts `main`'s cached surface because `main` imports `lib`.
3. Next prepare rebuilds `lib` surface, reloads `main` surface from cache or rebuild, then runs check only for dirty bodies per policy.

Prefetch paths from `ModuleIndex::prefetched_paths` follow the same `unit_type_surface_tracked` query — no disk re-parse shortcut.

## Anchored code paths

| Scenario | Start here |
| --- | --- |
| Full closure typing | `compiler/crates/beskid_analysis/src/services/lower.rs` |
| Entry-only gate | `compiler/crates/beskid_analysis/src/services/unit_ops.rs` |
| Salsa surface cache | `compiler/crates/beskid_queries/src/unit.rs` |
| Constraint solver units | `compiler/crates/beskid_analysis/src/types/inference/tests.rs` |
| Codegen node lookup | `compiler/crates/beskid_codegen/src/lowering/locals.rs` |
