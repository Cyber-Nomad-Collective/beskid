## 1. Validate

- [x] 1.1 Validate this change with `openspec validate v06-toolchain-gap-rulings --strict`.

## 2. Implement

- [x] 2.1 Read the base of an index expression after its index and assigned value (`compiler/crates/beskid_isle/src/context/aggregate.rs`, `strings.rs`).
- [x] 2.2 Accept repeated array suffixes in `compiler/crates/beskid_analysis/src/beskid.pest` and build one array rank per suffix.
- [x] 2.3 Type unsuffixed integer literals and module constant uses from `integer_literal_primitive_type` (`beskid_queries` `semantic_type_for_literal`, `node_type`, `constant_integer_literal`), and report T0905 for constant uses and inferred `let` literals that do not fit (`legality/gate/operators.rs`).
- [x] 2.4 Rule T1: a literal or constant operand takes the type of the other binary operand (a call result included); T0905 when it does not fit, and lowering fails closed instead of widening (`abi/types.rs` `value_abi_type`, `legality/gate/operators.rs`).

## 3. Verify

- [x] 3.1 Parser test `nested_array_types_parse_one_rank_per_suffix` (`beskid_analysis`).
- [x] 3.2 End-to-end fixtures `index_evaluation_order` and `nested_array_types` (`beskid_e2e_tests`, `toolchain_gaps`).
- [x] 3.3 Query tests `declared_integer_constant_node_type_is_its_literal_natural_type`, `unsuffixed_literal_beyond_i32_has_the_i64_natural_type`, and gate parity tests for constant and inferred-literal T0905 (`beskid_queries`); CLIF tests `inferred_let_of_a_literal_beyond_i32_materializes_the_full_i64_value` and `wide_module_constants_materialize_their_full_value_in_every_context` (`beskid_codegen`).
- [x] 3.4 End-to-end fixtures `integer_constant_width` (`runtime_cases`) and `integer_constant_range` (`failure_contracts`) (`beskid_e2e_tests`).
- [x] 3.5 Rule T1 tests: gate parity `binary_operand_literal_or_constant_takes_the_other_operand_type` (`beskid_queries`), CLIF `literal_and_constant_operands_take_the_i32_type_of_the_other_operand` (`beskid_codegen`), and end-to-end `integer_operand_range` (`failure_contracts`).
