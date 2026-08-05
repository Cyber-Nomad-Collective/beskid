## Question

Replace all `__math_*` builtin calls in `Core.Math.Math.bd` with `clif { ... }` blocks, eliminating the dependency on compiler-injected builtins for math functions.

## Scope

Replace each math function body with a `clif` block that calls the corresponding C library function directly:

| Beskid function | Current body | New body |
|----------------|-------------|----------|
| `Floor(f64) -> f64` | `return __math_floor(value);` | `clif { call @floor(%0) }` |
| `Ceil(f64) -> f64` | `return __math_ceil(value);` | `clif { call @ceil(%0) }` |
| `Sqrt(f64) -> f64` | `return __math_sqrt(value);` (after guard) | `clif { call @sqrt(%0) }` |
| `Log(f64) -> f64` | `return __math_log(value);` (after guard) | `clif { call @log(%0) }` |
| `Log2(f64) -> f64` | `return __math_log2(value);` (after guard) | `clif { call @log2(%0) }` |
| `Log10(f64) -> f64` | `return __math_log10(value);` (after guard) | `clif { call @log10(%0) }` |
| `AbsF64(f64) -> f64` | `return __math_abs(value);` | `clif { call @fabs(%0) }` |
| `Pow(f64, f64) -> f64` | `return __math_pow(base, exp);` | `clif { call @pow(%0, %1) }` |

Functions with input guards (Sqrt, Log, etc.) keep their `if` checks — only the `return __math_*` call is replaced.

## Constraints

- The `Floor` → `__math_floor` → `clif { call @floor }` transition must preserve the public API
- Functions like `Round` that call `Floor`/`Ceil` (not builtins directly) are unaffected
- Must also remove the `__math_*` entries from `builtins.inc.rs` (since they're no longer needed)

## Files

- `compiler/corelib/packages/foundation/src/Core/Math/Math.bd` — replace `__math_*` calls with `clif` blocks
- `compiler/crates/beskid_analysis/src/generated/builtins.inc.rs` — remove `__math_*` entries

## References

- `beskid/compiler/corelib/packages/foundation/src/Core/Math/Math.bd` — current math source
- `beskid/compiler/crates/beskid_analysis/src/generated/builtins.inc.rs:635-680` — math builtin entries to remove
