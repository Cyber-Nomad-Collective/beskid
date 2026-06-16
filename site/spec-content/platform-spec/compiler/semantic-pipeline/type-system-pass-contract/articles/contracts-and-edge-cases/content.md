---
title: Type-system pass contract - Contracts and edge cases
description: States the normative guarantees and what happens at boundaries or
  failure edges.
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

## Normative guarantees

| Guarantee | Contract |
| --- | --- |
| Single authoritative pass | Exactly one full type check per prepare spine run, observed as `lower.type_check` |
| Node-keyed expression types | Every typed expression **must** have `node_types[HirNodeId]` after a successful check |
| No span-keyed expr types | `expr_types`, `scoped_expr_types`, and `expr_type_at` **must not** exist on `TypeResult` |
| Id assignment before check | `index_program` **must** run before any sub-pass reads `node.id` |
| Surfaces before bodies | Surface merge **must** complete before entry body checking |
| Lowering prep after check | `call_kinds` and `cast_intents` **must** be produced only from solved `node_types` |
| Cached dependency surfaces | Prefetch units **must** use `unit_type_surface_tracked`, not disk re-parse |
| Policy is explicit | `DependencyTypingPolicy` **must** be passed through prepare; no implicit always-`FullClosure` in IDE |

## `HirNodeId` edge cases

- **Invalid id before index:** `HirNodeId::INVALID` on a node during normalize is expected; consumers **must not** read `node_types` until after `index_program`.
- **Normalize rewrites:** If normalization clones or replaces `Spanned` nodes, ids **must** be preserved or `index_program` **must** re-run. Duplicate ids in one session are a compiler bug.
- **Cross-unit stability:** `HirNodeId` values from unit A are meaningless in unit B. Cross-unit typing uses `UnitTypeSurface` + `ItemId`, not expression ids.

## `EntryOnly` vs `FullClosure` edge cases

| Scenario | Expected behavior |
| --- | --- |
| Entry edits only | `EntryOnly` re-checks entry body; dependency surfaces served from cache |
| Dependency signature change | Surface cache miss → rebuild surface; importers invalidated via reverse-deps |
| Dependency body error under `EntryOnly` | Error may not surface until `FullClosure` prepare (build/test) |
| Executable prepare | **Must** use `FullClosure` so dependency body errors block run/build |
| Stale typed bundle + fresh entry types | `EntryOnly` gate may refresh entry `TypeResult` without re-checking entire closure |

## Inference edge cases

- **Ambiguous `let`:** Multiple satisfiable types → **E1202** at binding span; no default pick.
- **Conflicting constraints:** Solver returns `TypeMismatch` when two equalities disagree.
- **Generic call ambiguity:** No unique substitution → **E1202** or **E1203** / **E1204** per existing arity rules.
- **Numeric unify:** Only the shared `unify_types` promotion applies; no silent widening to unrelated primitives.

## Lowering prep edge cases

- **Missing `node_type`:** Lowering prep **must** treat as a compiler bug (check pass should have failed first).
- **Cast intent span:** `CastIntent.span` is for diagnostics display only; codegen **must** key on `node_id`.
- **Scoped call kinds:** Per-file call kind maps keyed by span are **deleted**; use `lowering.call_kinds[HirNodeId]`.

## Failure modes

| Failure | Surface to consumer |
| --- | --- |
| `TypeError` vector non-empty | `LowerResolveTypeError::Type` → semantic diagnostics with stable **E12xx** codes |
| Surface build failure | Same lower error channel; no partial `TypeResult` with span-keyed fallbacks |
| Salsa cache poisoned | Evict unit token; next query rebuilds surface from HIR + resolution |

## Anti-patterns (forbidden)

- Span-keyed expression type lookup in codegen or LSP
- `value_at_span` fuzzy fallback for type or resolution lookup
- Second full `type_program` under `semantic.type_check`
- Linear scan of `TypeTable` for primitive or array interning
- Structural `infer_expr_type` fallback when `node_types` is missing
