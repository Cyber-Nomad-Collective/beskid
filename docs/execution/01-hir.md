---
description: HIR (High-level IR)
---

# HIR (High-level IR)

## Purpose
HIR is the semantic IR produced from the AST. It is the contract between frontend analysis and backend codegen in the Cranelift-first stack: `AST -> HIR -> CLIF`.

HIR must be stable, typed, and span-preserving so that semantic diagnostics and lowering both operate on the same representation.
HIR and AST should be implemented through a phase-indexed shared-core model so structural node families are declared once and specialized per phase.

## Responsibilities
- **Name resolution**: identifiers -> symbol IDs.
- **Type checking**: all expressions have explicit types.
- **Desugaring**: expand `for`, `match`, implicit conversions, etc.
- **Scope encoding**: explicit local bindings per block.
- **Phase-indexed reuse**: share common structural definitions between AST and HIR, then add HIR-only semantic fields and normalization.

## Suggested invariants
- Every HIR node is wrapped in `Spanned<T>`.
- Every identifier is resolved to a symbol ID.
- Every expression has a known type (or a resolved inference variable).
- All implicit conversions are explicit nodes.
- No syntax-only constructs remain (e.g., `for` is transformed).
- Aggregate definitions preserve field/variant ordering used for layout and GC pointer maps.

## Output shape (example)
- `Spanned<HIRProgram> { modules: [Spanned<HIRModule>] }`
- `HIRItem = FunctionDefinition | TypeDefinition | ConstantDefinition | TraitDefinition | ImplementationDefinition`
- `HIRFunctionDefinition { signature, body: Spanned<HIRBlock> }`
- `HIRStatement = LetStatement | ExpressionStatement | ReturnStatement | WhileStatement | BreakStatement | ContinueStatement`
- `HIRExpression = LiteralExpression | VariableExpression | CallExpression | BinaryExpression | UnaryExpression | IfExpression | MatchExpression | BlockExpression | CastExpression`

## Integration points
- `beskid_analysis::hir`: AST lowering, resolution, typing, cast insertion.
- `beskid_analysis::analysis`: semantic rules run on HIR, not raw AST.
- `beskid_codegen`: lowers HIR to CLIF using span-attached nodes.

## Detailed authoring guide
- HIR writing template and section checklist: `docs/execution/HIR/README.md`
- Normative HIR spec: `docs/execution/spec/hir.md`

## References
- Rust HIR overview: https://rustc-dev-guide.rust-lang.org/hir.html
- Compiler pipeline reference: https://rustc-dev-guide.rust-lang.org/overview.html
