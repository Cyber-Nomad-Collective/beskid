---
title: "HIR specification and analysis integration"
description: HIR specification and analysis integration
---


## Purpose
HIR is the semantic IR used to bridge the parsed AST with execution. It is the **source of truth** for semantic analysis and for CLIF lowering.

Execution contract: `AST -> HIR -> CLIF`.
The structure should use a phase-indexed shared-core model so AST and HIR share canonical node families while HIR adds semantic metadata and normalization.

## Connection to the current analysis stack
Current state:
- `beskid_analysis::analysis` provides diagnostics and a rule engine skeleton.
- The rule engine should operate on **HIR**, not raw AST, to guarantee resolved names and typed nodes.

Integration plan:
1. AST -> HIR lowering lives in `beskid_analysis::hir`.
2. `beskid_analysis::analysis` rules accept `&Spanned<HIRProgram>` (or `&Spanned<HIRModule>`).
3. Diagnostics emitted from analysis reference HIR spans mapped from AST source locations.

## HIR responsibilities
- **Name resolution**: identifiers map to symbol IDs.
- **Type checking**: expressions have concrete types or resolved inference vars.
- **Desugaring**: normalize surface constructs (e.g., `for` range fast-path or iterator `Next()` loop form).
- **Scope normalization**: explicit locals per block.
- **Phase-indexed reuse**: shared structural definitions between AST and HIR with HIR-specific semantic fields.
- **Call classification**: each typed call expression is classified for lowering as method dispatch, item call, or callable-value call.

## Symbol and module model
- **SymbolTable**: per-module table mapping names to `SymbolId` with kind + visibility.
- **ModuleGraph**: adjacency map from module -> imported modules (from `mod`/`use`).
- **Resolution**: `use` aliases stored in a scope table; every resolved path becomes a `SymbolId`.

## Desugaring checklist (v0.1)
- `for range(...)` -> numeric while-loop fast-path.
- `for expr` (iterator-capable) -> `Next()`-driven loop termination on `Option::None`.
- `match` keeps structured arms, but patterns are normalized (no nested OR patterns in HIR).
- Implicit numeric widening -> explicit `Cast` nodes.

## HIR invariants
- Every HIR node is wrapped in `Spanned<T>`.
- Every identifier is resolved (no raw strings for symbols).
- Every expression has a type.
- All implicit conversions are explicit nodes.
- Control-flow is explicit (if/while/match preserved, but structured).
- Every successful call expression has exactly one lowering call kind (`MethodDispatch`, `ItemCall`, `CallableValueCall`).

## Typing phases
1. **Collect declarations** (types, functions, constants).
2. **Resolve names** (module paths + local scopes).
3. **Infer types** (constraints + defaults for literals).
4. **Insert casts** (explicit conversions).

## Suggested data model (outline)
- `Spanned<HIRProgram> { modules: Vec<Spanned<HIRModule>> }`
- `HIRModule { items: Vec<Spanned<HIRItem>> }`
- `HIRItem = FunctionDefinition | TypeDefinition | ConstantDefinition | TraitDefinition | ImplementationDefinition`
- `HIRFunctionDefinition { signature, body: Spanned<HIRBlock> }`
- `HIRStatement = LetStatement | ExpressionStatement | ReturnStatement | WhileStatement | BreakStatement | ContinueStatement`
- `HIRExpression = LiteralExpression | VariableExpression | CallExpression | BinaryExpression | UnaryExpression | IfExpression | MatchExpression | BlockExpression | CastExpression`

## Spans & diagnostics
- HIR nodes retain source spans by construction through `Spanned<T>`.
- Diagnostics should be emitted against HIR spans for stable mapping.

## Required interfaces
- `lower_ast_to_hir(ast: &AstProgram) -> Spanned<HIRProgram>`
- `type_check(hir: &mut Spanned<HIRProgram>) -> Result<(), Diagnostics>`
- `analyze(hir: &Spanned<HIRProgram>, rules: &[Rule]) -> AnalysisResult`

## Authoring and review checklist

Use the following checklist for any HIR-focused execution docs.

### Stage boundary and IO contract
- Always specify spanned inputs/outputs (for example, `Spanned<AstProgram>` -> `Spanned<HIRProgram>`).
- State preconditions and postconditions explicitly.

### Invariants (required)
- Every node is `Spanned<T>`.
- All names are resolved to IDs (`SymbolId`/module IDs); no unresolved free identifiers.
- Every expression has a type (or a well-defined inference variable before finalization).
- Implicit conversions are explicit `Cast` nodes.
- No syntax-only sugar remains after lowering, unless explicitly documented.

### Naming convention (required)
- Use full semantic node names in docs: `FunctionDefinition`, `Statement`, `Expression`.
- Do not use shorthand aliases such as `Fn`, `Stmt`, or `Expr`.
- Keep node/type names consistent across overview and specification docs.

### Pass sequence documentation
When describing transformations, list the pass order explicitly:
1. Declaration collection
2. Name resolution
3. Type inference/checking
4. Cast insertion
5. Final normalization for codegen

For each pass, document: inputs/outputs, touched structures (`SymbolTable`, `ModuleGraph`, typing context), and diagnostic/span behavior.

### Validation checklist (required)
- [ ] Span preservation tests
- [ ] Name resolution tests
- [ ] Typing + cast insertion tests
- [ ] Desugaring legality tests
- [ ] Codegen-readiness tests (HIR satisfies CLIF-lowering preconditions)
