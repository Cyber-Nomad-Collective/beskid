---
description: HIR specification and analysis integration
---

# HIR specification and analysis integration

## Purpose
HIR is the semantic IR used to bridge the parsed AST with execution. It is the **source of truth** for semantic analysis and for CLIF lowering.

## Connection to the current analysis stack
Current state:
- `pecan_analysis::analysis` provides diagnostics and a rule engine skeleton.
- The rule engine should operate on **HIR**, not raw AST, to guarantee resolved names and typed nodes.

Integration plan:
1. AST -> HIR lowering lives in `pecan_analysis::hir`.
2. `pecan_analysis::analysis` rules accept `&HIRProgram` (or `&HIRModule`).
3. Diagnostics emitted from analysis reference HIR spans mapped from AST source locations.

## HIR responsibilities
- **Name resolution**: identifiers map to symbol IDs.
- **Type checking**: expressions have concrete types or resolved inference vars.
- **Desugaring**: remove surface constructs (e.g., `for` -> `while`).
- **Scope normalization**: explicit locals per block.

## Symbol and module model
- **SymbolTable**: per-module table mapping names to `SymbolId` with kind + visibility.
- **ModuleGraph**: adjacency map from module -> imported modules (from `mod`/`use`).
- **Resolution**: `use` aliases stored in a scope table; every resolved path becomes a `SymbolId`.

## Desugaring checklist (v0.1)
- `for` -> `while` + iterator calls.
- `match` keeps structured arms, but patterns are normalized (no nested OR patterns in HIR).
- Implicit numeric widening -> explicit `Cast` nodes.

## HIR invariants
- Every identifier is resolved (no raw strings for symbols).
- Every expression has a type.
- All implicit conversions are explicit nodes.
- Control-flow is explicit (if/while/match preserved, but structured).

## Typing phases
1. **Collect declarations** (types, functions, constants).
2. **Resolve names** (module paths + local scopes).
3. **Infer types** (constraints + defaults for literals).
4. **Insert casts** (explicit conversions).

## Suggested data model (outline)
- `HIRProgram { modules: Vec<HIRModule> }`
- `HIRModule { items: Vec<HIRItem> }`
- `HIRItem = Fn | Type | Const | Trait | Impl`
- `HIRFn { sig, body: HIRBlock }`
- `HIRStmt = Let | Expr | Return | While | Break | Continue`
- `HIRExpr = Literal | Var | Call | Binary | Unary | If | Match | Block | Cast`

## Spans & diagnostics
- HIR nodes retain `SpanId` referencing original source spans.
- Diagnostics should be emitted against HIR spans for stable mapping.

## Required interfaces
- `lower_ast_to_hir(ast: &AstProgram) -> HIRProgram`
- `type_check(hir: &mut HIRProgram) -> Result<(), Diagnostics>`
- `analyze(hir: &HIRProgram, rules: &[Rule]) -> AnalysisResult`
