---
description: Type system and inference rules
---

# Type system and inference rules

## Goals
- Deterministic typing for CLIF lowering.
- Minimal implicit behavior; prefer explicit casts.

## Type inference strategy
- Constraint-based inference (HM-lite) for locals and non-generic expressions.
- Generics resolved during type checking using declared bounds.

## Literal typing (decision)
- Integer literals default to `i32`.
- Float literals default to `f64`.
- Boolean literals map to `bool`.
- String literals map to `{ptr, len}` at runtime, `string` in HIR.

## Numeric coercions
- Implicit widening allowed only for:
  - `i32` -> `i64`
  - `f32` -> `f64`
- All other conversions require explicit `cast`.
- Mixed int/float expressions require explicit cast.

## Type checking phases
1. Collect declarations.
2. Resolve names (module + local scopes).
3. Solve type constraints.
4. Insert explicit `Cast` nodes.

## Error reporting
- Unknown type: `TypeNotFound`.
- Incompatible types: `TypeMismatch`.
- Ambiguous inference: `TypeInferenceAmbiguous`.
