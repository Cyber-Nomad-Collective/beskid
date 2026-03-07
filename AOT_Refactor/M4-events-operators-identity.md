# M4 — Events + Operators + Identity Equality

## Goal
Complete event model and operator semantics (`+=`, `-=`, `===`) with clear separation between syntax and semantic behavior.

## Current grounded status
- Assignment operators are parsed in syntax (`=`, `+=`, `-=`):
  - `syntax/expressions/assign_expression.rs`
- HIR assign node currently lacks operator field:
  - `hir/expression.rs`
- Grammar supports `===` but syntax/HIR operator enums do not:
  - `beskid.pest`
  - `syntax/expressions/binary_expression.rs`
  - `hir/expression.rs`
- No event field representation exists:
  - `syntax/types/field.rs`
  - `hir/types.rs`

## Task list

### 1) Assignment operator semantics
- Add assignment op to HIR assign expression and lower it from syntax.
- Type rules for compound assignment:
  - lvalue checks
  - mutability checks
  - domain constraints (numeric/string/event-specific)
- Integrate with existing immutable assignment diagnostics.

### 2) Identity equality (`===`)
- Add `IdentityEq`/equivalent operator variant in syntax + HIR enums.
- Typing: define and enforce allowed identity-comparable domain.
- Lowering/codegen: map to identity/pointer-handle comparison path.

### 3) Event model (field kind + semantics)
- Add event field AST/HIR kind with signature and capacity metadata.
- Semantic rules:
  - capacity > 0
  - handler signature compatibility
  - owner-only invocation
- Lowering shape:
  - count + bounded handler storage representation
  - subscribe/unsubscribe on `+=`/`-=` when LHS is event member

## Acceptance criteria
- `+=/-=` behavior is deterministic and type-safe.
- `===` is semantically distinct from `==`.
- Event declarations and operations have precise diagnostics and lowering behavior.

## Test targets
- Parsing/syntax tests for `===`, event fields, and compound assignments.
- Type tests for valid/invalid operator domains.
- Codegen/runtime tests for event subscription lifecycle and identity comparisons.
