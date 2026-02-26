---
description: HIR documentation template and authoring checklist
---

# HIR docs template (AST -> HIR -> CLIF)

Use this template for any HIR-focused document under `docs/execution/HIR/`.
Assume the phase-indexed shared-core direction: AST and HIR share canonical structural node families, while HIR adds semantic metadata and normalization.

## 1) Purpose and scope
- State which HIR concern this doc covers.
- Explicitly place it in the pipeline: `AST -> HIR -> CLIF`.
- Clarify if the doc is normative (spec-like) or explanatory (implementation guide).

## 2) Stage boundary and inputs/outputs
- **Input shape**: always specify spanned input, e.g. `Spanned<AstProgram>` or `Spanned<HIRProgram>`.
- **Output shape**: always specify spanned output, e.g. `Spanned<HIRProgram>`.
- State preconditions and postconditions.

## 3) Invariants (must hold)
- Every node is `Spanned<T>`.
- All names are resolved to IDs (`SymbolId`/module IDs), no unresolved free identifiers.
- Every expression has a type (or a well-defined inference variable before finalization).
- Implicit conversions are represented as explicit `Cast` nodes.
- No syntax-only sugar remains after lowering (or clearly list exceptions).

## Naming convention (required)
- Use full semantic node names in docs: `FunctionDefinition`, `Statement`, `Expression`.
- Do not use shortcut aliases such as `Fn`, `Stmt`, or `Expr` for HIR model documentation.
- Keep type names consistent between overview docs and specification docs.

## 4) Lowering / transformation algorithm
Describe the pass sequence explicitly:
1. Declaration collection
2. Name resolution
3. Type inference/checking
4. Cast insertion
5. Final normalization for codegen

For each pass:
- Inputs and outputs
- Data structures touched (`SymbolTable`, `ModuleGraph`, typing context)
- Failure diagnostics and span usage

## 5) Data model section
Document only stable node forms used downstream:
- `Spanned<HIRProgram>`
- `Spanned<HIRModule>`
- `Spanned<HIRItem>`
- `Spanned<HIRStatement>`
- `Spanned<HIRExpression>`

Avoid speculative node kinds that are not part of current implementation/spec.

## 6) Integration contracts
- `beskid_analysis::analysis` consumes HIR, not AST.
- `beskid_codegen` lowers HIR to CLIF and relies on HIR invariants.
- Runtime/codegen assumptions must be listed as explicit contracts, not prose hints.

## 7) Diagnostics and spans
- Every diagnostic is emitted against HIR spans.
- Describe how spans are preserved/propagated through each pass.
- Include at least one example diagnostic mapping (`source -> HIR node -> error`).

## 8) Validation checklist (required section)
- [ ] Span preservation tests
- [ ] Name resolution tests
- [ ] Typing + cast insertion tests
- [ ] Desugaring legality tests
- [ ] Codegen-readiness tests (HIR satisfies CLIF-lowering preconditions)

## 9) Cross-links (required section)
- `docs/execution/01-hir.md` (overview)
- `docs/execution/spec/hir.md` (normative rules)
- `docs/execution/02-clif-lowering.md` (downstream consumer)
- `docs/execution/Plan.md` (phase alignment)

## Suggested file split under `docs/execution/HIR/`
- `README.md` (this template + writing rules)
- `model.md` (node/data model)
- `passes.md` (AST->HIR pass pipeline)
- `invariants.md` (legality + validation)
- `diagnostics.md` (span and error mapping)

## Review gate before merge
A HIR doc is ready only if:
1. It uses the span-first contract everywhere (`Spanned<T>`).
2. It is consistent with `docs/execution/spec/hir.md`.
3. It states concrete producer/consumer boundaries.
4. It has a validation checklist with testable outcomes.
