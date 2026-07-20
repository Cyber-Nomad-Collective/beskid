## ADDED Requirements

### Requirement: Let and generic inference sites
`let name = expr` MUST infer the variable type from `expr` when unambiguous. `let T name = expr` MUST check `expr` against `T` with no inference of `T` from the initializer alone. Generic arguments at call sites MAY be inferred from parameter types when a unique solution exists (**E1203** when missing). Lambda parameter types MAY be inferred from expected function type; untyped lambda parameters require contextual type (**E1202** when missing).

#### Scenario: Inferred let from unambiguous initializer
- **GIVEN** `let x = 1` where `1` has a unique integer literal type in context
- **WHEN** inference runs
- **THEN** `x` receives that inferred type without an explicit annotation

### Requirement: Ambiguity and no widening
Inference MUST NOT widen beyond the declared or inferred constraint (no implicit numeric promotion across unrelated primitives in v0.1). Ambiguous inference MUST error with **E1202** rather than pick an arbitrary type. Enum constructors and struct literals MUST have sufficient context to resolve the target type or require explicit qualification. Function return types on top-level functions SHOULD be explicit; when omitted, inference MAY use body yield rules.

#### Scenario: Ambiguous inference errors
- **GIVEN** an expression site where multiple types satisfy the constraints equally
- **WHEN** inference runs
- **THEN** the compiler emits **E1202** and does not pick an arbitrary type

### Requirement: Inference diagnostics and conformance
Mismatch after inference MUST diagnose **E1206**. Inference affects compile-time only. Reference compiler tests for `let` inference and generic call inference MUST pass for L2 claims.

#### Scenario: Inferred type mismatches annotation context
- **GIVEN** an inferred expression that does not match a required contextual type
- **WHEN** checking completes after inference
- **THEN** the compiler emits **E1206**

## REMOVED Requirements

### Requirement: Type inference conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
