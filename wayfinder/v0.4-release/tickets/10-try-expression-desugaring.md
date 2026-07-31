## Question

Implement TryExpression desugaring to `match` control-flow during HIR normalization (CYB-174).

The ISLE coverage audit confirmed TryExpression does NOT need ISLE rules — it needs a desugaring pass that rewrites `try { ... }` into `match` control-flow before codegen. The HIR already preserves TryExpression, but the ISLE boundary rejects it as `UnsupportedTypedOperation`.

## Constraints

- Desugaring happens during HIR normalization in `beskid_analysis`, not in the ISLE layer
- Must handle all three try/catch/finally arms
- Must produce diagnosable error spans for malformed try expressions

## References

- `compiler/crates/beskid_analysis/` — normalization/desugaring pipeline
- `compiler/crates/beskid_isle/src/lib.rs` — currently classifies as `UnsupportedTypedOperation`
- CYB-173 (LambdaExpression ISLE) — the only other ISLE gap
