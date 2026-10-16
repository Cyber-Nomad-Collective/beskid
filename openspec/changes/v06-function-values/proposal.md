## Why

The spec defines lambda syntax, contextual typing and capture rules, but it does not say what a function-typed value is at run time, how a call through one is made, or when a closure allocates. Before this change the compiler had no ABI for a function type: a call through a function-typed parameter failed with an internal "semantic fact `abi_type` is unavailable" error, a lambda in value position lowered to a bare code pointer and lost its captures, a named function could not be passed as a value, a function-typed struct field could not be called, and a call on a call result (`Make()(1)`) had no lowering. A lambda that captured a `mut` local also failed with an internal error instead of a user diagnostic. The 0.5.4 line implemented function values; 0.6 ports that design and routes lambda contextual typing through the single `expected_type` query that 0.6 made the sole authority for the checking direction.

## What Changes

- A function type is a reference type. Its value is a GC-managed closure record `{ header, code pointer, environment pointer }`, the same record event handlers use, and its ABI is one pointer.
- A call whose callee has a function type calls indirectly through the record: a function-typed parameter, lambda parameter or local, an unannotated local initialized by a lambda, a function-typed field projection (`holder.op(1)`), a call that returns a function value (`Make()(1)`), or any other expression whose source type is a function type. A function-typed local shadows every item, import and builtin of its name.
- A named, non-generic function used as a value (`Apply(5, Double)`) is a closure record with the item's entry and a null environment. A generic free function used as a value is instantiated where it is read: explicit type arguments (`Identity<i64>`) or the expected function type of its position (`Apply(5, Identity)` against `(i64) => i64`) select the specialization, and the record points at that specialization's entry. Undetermined type arguments are **E1203** (a conflicting expected type **E1229**, a wrong explicit count **E1204**, an unsatisfied `where` bound **E1610**). Methods are not values, and type arguments that name a generic parameter of the enclosing item are not instantiated in 0.6.0.
- Contextual lambda typing is one query. A lambda's untyped parameters, a block body's `return` values and an expression body are checked against the function type the lambda's position declares, through `expected_type`: an annotated local, a struct field, a declared return type, or the parameter of the callee. A lambda is never an expectation of its own.
- Closure allocation is decided by use. An immutable, expression-bodied lambda local used only as a call callee is a stack closure: every call lowers the lambda inline and nothing allocates. A lambda in any other position (an argument, a field value, a return value, an assigned or mutable local, a block-bodied local) is a heap closure: its environment and record are allocated when the lambda is evaluated.
- Captures are by-value snapshots taken when the record is created. A lambda that is not a `spawn` operand and captures a `mut` local or a native pointer is rejected with **E1233** "lambda cannot capture `name`: it is a mutable binding or a native pointer". E1233 is registered in the diagnostic code registry.
- A string concatenation or interpolation operand of a proven type without a text form (a nominal, array or function value, `char`, `u64`, `word`, `unit`) is reported by `beskid check` as **E1209** with the operand's source type instead of reaching emission as an internal error.
- A trailing argument of a callee with a `bulk T[]` parameter is checked against the element type `T`; a generic element is taken from the call's specialization and never inferred from sibling arguments.
- **BREAKING**: a lambda that captures a `mut` local and is not a `spawn` operand stops compiling with E1233 (it previously failed with an internal error).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `language-meta--evaluation--lambdas-and-closures`: adds the function value representation and indirect call, the stack and heap closure rule, the single contextual typing rule and the E1233 capture rule.
- `compiler--semantic-pipeline--diagnostic-code-registry`: allocates E1233.

## Impact

Compiler: `beskid_queries` owns the facts (`function_value_call`, `function_item_value`, `lambda_value_required`, the E1233 legality fact, the E1209 gate obligation, lambda typing inside `expected_type` and `lambda_source_identity`); `beskid_isle` lowers closure records, the indirect call and named function values; `beskid_codegen` adapts the facts and shares the artifact string pool with lifted lambda entries; `beskid_analysis` adds the two diagnostic kinds.

Migration: copy a `mut` local into an immutable local before capturing it; format a value as a string before interpolating it.

Catalog: run `validate-standard` and regenerate `openspec/catalog.json` after this change is applied.
