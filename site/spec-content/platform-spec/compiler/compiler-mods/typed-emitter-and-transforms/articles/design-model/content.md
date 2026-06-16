---
title: Typed emitter and transforms - Design model
description: Construction of syntax nodes and declarative transforms without raw
  text printing.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-01
---

This article documents the **design model** for **Typed emitter and transforms**.

## Language alignment
**Emit** applies only **typed** edits; language-meta forbids raw-text patching as the normative contract.

## Persistent entities
- **Compilation instance** — implicit handle to the compilation under construction (**[Compiler Mod SDK](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/)** / `Beskid.Compiler.Compilation`).
- **Syntax snapshot** — immutable tree with stable node identities suitable for incremental keys.
- **Capability tokens** — host-granted permissions for I/O, diagnostics, and emit operations during mod execution.

## Boundaries
- Mod SDK facades never bypass the host bridge for effects.
- Generation logic in the reference compiler remains Rust-internal; Beskid sees only the generated `Beskid.Compiler.*` projection.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/syntax/items/` — patterns for well-formed item emission.
- `compiler/crates/beskid_codegen/` — downstream expectations after merge.

## Merge model (surface syntax first)

Typed emit **must** construct or mutate **`Program`**-level syntax nodes (or a documented multi-file aggregate feeding the same parser contract), not ad hoc HIR patches. Contributions **must** pass the same well-formedness checks as user-authored items before merge.

**Ordering** — Multiple contributors touching the same **declaration identity** produce a deterministic merge failure surfaced as structured diagnostics; the host **must not** leave a partially merged tree.

**Handoff to lowering** — After typed emit commits at **`syntax.generation`** and the host emits **`lower.ready`**, the merged syntax **must** be the sole input to `lower_normalize_resolve_type_spanned` / codegen lowering paths documented in **[Stage ordering and lowering](/platform-spec/compiler/build-pipeline/stage-ordering/)**; lowering **must not** begin until emit validation succeeds or emit is skipped for that generation round.
