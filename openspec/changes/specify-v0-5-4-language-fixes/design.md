## Context

The behavior below shipped in the 0.5.4 compiler branch. Each requirement
names only what the commit and its tests show. Implementation and conformance
anchors (informative, not normative):

| Behavior | Compiler commit | Anchor tests |
|----------|-----------------|--------------|
| `bool`, minimum `i64`, empty concatenation | `abe19020` | `parsed_string_interpolation_spells_bool_operands`; runtime `StrConcat`, `StrFromI64` |
| `f64` interpolation | `648d5e2a` | `parsed_string_interpolation_formats_f64_operands_from_their_bits`; runtime `StrFromF64Bits` |
| String ordering | `88143add` | `parsed_string_ordering_lowers_through_str_cmp`; runtime `StrCmp` |
| `f64` to integer conversions | `909444b8` | `parsed_f64_to_integer_conversions_saturate` |
| Fully qualified module paths | `3763c00b` | `fully_qualified_core_output_writeline_resolves_beside_an_alias`, `qualified_import_resolution_follows_public_reexports_and_declared_modules` |
| `bulk` parameters | `e9664e4e` | `bulk_tests` in `call_arguments.rs`, `parsed_program_packs_generic_bulk_arguments_with_the_call_specialization` |
| Bounded generic receivers | `570fdd56` | `bounded_generic_receiver_calls_the_bound_contract_methods`, `bounded_generic_receivers_dispatch_to_each_instantiation` |
| Parameters and locals shadow fields | `f857c827` | `parameters_and_locals_shadow_method_owned_fields` |
| `this.Method()` | `9c94c662` | `this_qualified_sibling_call_uses_the_implicit_method_receiver` |
| Field of a call result | `a4fac1b2` | `field_of_a_function_call_result_lowers` |
| Nested projection in generic methods | `8223acd3` | `specialized_generic_method_lowers_a_nested_projection_through_the_implicit_receiver` |
| Array literal elements | `2b74d8ef` | `array_literals_of_call_concatenations_and_enum_values_plan_their_element_abi` |
| Locals annotated with a type parameter | `b2ea9586` | `generic_local_annotated_with_a_type_parameter_lowers_for_scalar_and_string` |
| Contextual enum constructors in method arguments | `8e230afe` | `generic_enum_constructor_takes_its_application_from_a_method_parameter` |

## Decisions

- **Interpolation operand types.** The admitted operand types are those the
  lowering coerces: `string`, `bool`, `i64`, `i32`, `u32`, `u8`, and `f64`.
  Any other operand type has no string coercion and fails compilation. The
  language has no `f32` type (`PrimitiveType` in `beskid.pest`), so no `f32`
  rule is stated.
- **`f64` text.** The digits are the shortest that read back as the same
  value under round-half-even input; an exact tie between two shortest
  candidates takes the even digit. The layout is ECMAScript
  `Number::toString`. The result equals JavaScript `String(x)`.
- **String ordering is ordinal.** Bytewise UTF-8 comparison equals Unicode
  code point order. There is no locale collation. Ordering a string against a
  non-string stays a type error.
- **Conversions saturate.** `f64` to `i64`, `i32`, `u32`, and `u8` (also
  spelled `byte`) truncate toward zero, clamp out-of-range values, and give
  `0` for NaN. They never trap. `word(x)` of an `f64` is not stated: the
  commit does not test it.
- **Fully qualified paths.** An import-based resolution still wins. Without
  one, a path resolves when exactly one visible unit declares the module and
  each declared parent exposes the next segment with `pub mod`. Item
  visibility rules are unchanged.
- **Bounded receivers.** The `where` bound that declares the method is used.
  When no bound or more than one bound declares it, the call does not
  resolve. Bounds are read from the enclosing generic function, as in
  `extend-contract-system-generic-and-self`.
- **One path per construct.** Each behavior has one implementation path; the
  `bulk` checker work replaced eight copies of the arity and argument loop
  with one helper. No legacy path is kept and none is deleted by this change.

## Observability, security, rollback

- Diagnostics are unchanged: arity mismatches still report `CallArityMismatch`,
  missing type arguments still report `MissingTypeArguments`, and unresolved
  paths stay unresolved.
- Security: fully qualified paths cannot reach a module that a parent declares
  without `pub mod`, so private modules stay private.
- Rollback: remove this change; the compiler behavior is unaffected.
- Source of truth: the requirements in this change once archived; the commits
  and tests above are conformance anchors only.
