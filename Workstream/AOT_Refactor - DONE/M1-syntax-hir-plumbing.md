# M1 — Syntax + HIR Plumbing (Shape Only)

## Goal
Implement all missing structural representations without completing full semantics yet.

## Scope items
- Postfix try expression shape.
- For-loop iterable shape migration.
- Type conformance declaration shape.
- Event field shape.
- Identity equality operator shape.
- Arrow function type parser support.
- Assignment operator propagation to HIR.

## Task list (file-grounded)

### 1) Postfix `?` syntax/HIR shape
- Extend syntax expression model to include `Try` variant:
  - `crates/beskid_analysis/src/syntax/expressions/expression.rs`
- Integrate parser in postfix loop (`parse_postfix_expression`) for `TryOperator`.
- Either integrate or replace `try_expression.rs` with canonical shape.
- Add HIR `TryExpression` node and phase mapping:
  - `crates/beskid_analysis/src/hir/expression.rs`
  - `crates/beskid_analysis/src/hir/lowering/expressions.rs`

### 2) `for item in expression` structural migration
- Grammar update from range-only to iterable expression:
  - `crates/beskid_analysis/src/beskid.pest`
- AST migrate `ForStatement.range` -> `ForStatement.iterable`:
  - `crates/beskid_analysis/src/syntax/statements/for_statement.rs`
- HIR mirror migration:
  - `crates/beskid_analysis/src/hir/statement.rs`
- Pass traversal compile updates:
  - `resolve/resolver.rs`, `types/context/statements.rs`, `hir/legality.rs`, `hir/normalize/statements/for_statement.rs`

### 3) Type conformance list on `type`
- Grammar add optional conformance clause in `TypeDefinition`.
- AST/HIR fields:
  - `syntax/items/type_definition.rs`
  - `hir/item.rs` (`HirTypeDefinition`)
- Lowering mapping:
  - `hir/lowering/items.rs` (and supporting lowerers)

### 4) Event field shape
- Grammar rules for event field declaration forms.
- Canonical declaration forms:
  - `event Name(T1 a, T2 b)`
  - `event{N} Name(T1 a, T2 b)` (optional compile-time positive capacity)
- Introduce field-kind model (value vs event):
  - `syntax/types/field.rs`
  - `hir/types.rs` (`HirField` replacement/enum)
  - `hir/lowering/types.rs`

### 5) Operators and type shape updates
- Identity equality `===` operator in syntax/HIR enums:
  - `syntax/expressions/binary_expression.rs`
  - `hir/expression.rs`
  - `hir/lowering/types.rs` (binary-op mapping)
- Assignment op in HIR assign expression:
  - `syntax/expressions/assign_expression.rs` (already has enum)
  - `hir/expression.rs` (`HirAssignExpression` add `op`)
  - `hir/lowering/expressions.rs`

### 6) Arrow function type parser support
- Add grammar for arrow function type form:
  - `beskid.pest`
- Parse arrow shape into existing canonical `Type::Function` representation:
  - `syntax/types/type.rs`

## Acceptance criteria
- New AST/HIR fields compile and are traversed.
- Parser tests cover all new syntactic forms.
- HIR lowering tests verify new shapes exist in lowered output.
- No semantics beyond basic shape correctness required in M1.

## Test targets
- `crates/beskid_tests/src/parsing/expressions.rs`
- `crates/beskid_tests/src/parsing/control_flow.rs`
- `crates/beskid_tests/src/syntax/items.rs`
- `crates/beskid_tests/src/analysis/lowering.rs`
