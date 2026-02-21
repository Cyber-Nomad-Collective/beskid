---
description: HIR (High-level IR)
---

# HIR (High-level IR)

## Purpose
HIR is the semantic IR produced from the AST. It resolves names, attaches types, and removes surface-level syntax sugar so the backend sees a stable structure.

## Responsibilities
- **Name resolution**: identifiers -> symbol IDs.
- **Type checking**: all expressions have explicit types.
- **Desugaring**: expand `for`, `match`, implicit conversions, etc.
- **Scope encoding**: explicit local bindings per block.

## Suggested invariants
- Every identifier is resolved to a symbol ID.
- Every expression has a known type (or a resolved inference variable).
- All implicit conversions are explicit nodes.
- No syntax-only constructs remain (e.g., `for` is transformed).

## Output shape (example)
- `Program { items: [Item] }`
- `Item = Fn | Type | Const | Trait | Impl`
- `Fn { name, params, ret, body }`
- `Stmt = Let | Expr | Return | While | Break | Continue`
- `Expr = Literal | Var | Call | Binary | If | Match | Block | Cast`

## References
- Rust HIR overview: https://rustc-dev-guide.rust-lang.org/hir.html
- Compiler pipeline reference: https://rustc-dev-guide.rust-lang.org/overview.html
