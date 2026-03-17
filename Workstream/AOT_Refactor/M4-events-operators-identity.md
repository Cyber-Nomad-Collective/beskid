# M4 — Events + Operators + Identity Equality

## Goal
Complete event model and operator semantics (`+=`, `-=`, `===`) with clear separation between syntax and semantic behavior.

## Scope decisions (normative)
- Assignment domains:
  - numeric: `+=`, `-=`
  - string: `+=` only
  - events: `+=`/`-=` only when LHS is an event member (subscribe/unsubscribe)
- Identity equality (`===`) is restricted to identity-comparable handle/reference-like domains.
- `===` must remain semantically distinct from structural `==`.
- Event declaration canonical syntax:
  - `event Name(T1 a, T2 b)`
  - `event{N} Name(T1 a, T2 b)` where `N` is a compile-time positive capacity.
- Event declaration without `{N}` uses default capacity.
- Event invocation is owner-only (only the declaring type may invoke/raise its event).
- Event unsubscribe (`-=`) removes the first matching handler entry.
- Event capacity overflow is runtime-checked; compile-time checks may be added when provable.

## Current grounded status
- Assignment operators are parsed in syntax (`=`, `+=`, `-=`):
  - `syntax/expressions/assign_expression.rs`
- HIR assign node carries assignment operator and is typed/lowered:
  - `hir/expression.rs`
  - `types/context/expressions.rs`
  - `codegen/lowering/expressions/assign_expression.rs`
- Grammar supports `===` but syntax/HIR operator enums do not:
  - `beskid.pest`
  - `syntax/expressions/binary_expression.rs`
  - `hir/expression.rs`
- Identity equality typing and lowering paths are implemented and tested.
- Event field representation exists at kind-level (`value` vs `event`), but signature/capacity metadata and lifecycle semantics remain to be implemented.

## Task list

### Rollout order (gated)
1. Assignment operators (`+=`, `-=`)
2. Identity equality (`===`)
3. Event model
4. Cross-feature integration hardening

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
- Ensure explicit rejection for non-identity domains with targeted diagnostics.

### 3) Event model (field kind + semantics)
- Add event field AST/HIR kind with signature and capacity metadata.
- Semantic rules:
  - capacity > 0
  - handler signature compatibility
  - owner-only invocation
- Lowering shape:
  - count + bounded handler storage representation
  - subscribe/unsubscribe on `+=`/`-=` when LHS is event member
  - unsubscribe removes first matching handler
  - overflow emits runtime error/failure path when capacity is exceeded

### 4) Cross-feature hardening
- Verify deterministic behavior when operators and events interact in one flow.
- Ensure diagnostics and spans remain precise across desugaring/lowering boundaries.
- Validate parity expectations for all supported backends.

## Acceptance criteria
- `+=/-=` behavior is deterministic and type-safe.
- `===` is semantically distinct from `==`.
- Event declarations and operations have precise diagnostics and lowering behavior.
- Operator domain rules are enforced exactly as scoped (numeric/string/event-specific).
- Event lifecycle semantics are deterministic (owner-only invoke, first-match unsubscribe, bounded capacity).

## Test targets
- Parsing/syntax tests for `===`, event fields, and compound assignments.
- Type tests for valid/invalid operator domains.
- Codegen/runtime tests for event subscription lifecycle and identity comparisons.
- Integration tests covering mixed scenarios (`+=`, `-=`, `===`, and event operations in one program).
