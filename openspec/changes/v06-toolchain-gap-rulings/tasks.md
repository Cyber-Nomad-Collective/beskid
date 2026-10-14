## 1. Validate

- [x] 1.1 Validate this change with `openspec validate v06-toolchain-gap-rulings --strict`.

## 2. Implement

- [x] 2.1 Read the base of an index expression after its index and assigned value (`compiler/crates/beskid_isle/src/context/aggregate.rs`, `strings.rs`).
- [x] 2.2 Accept repeated array suffixes in `compiler/crates/beskid_analysis/src/beskid.pest` and build one array rank per suffix.

## 3. Verify

- [x] 3.1 Parser test `nested_array_types_parse_one_rank_per_suffix` (`beskid_analysis`).
- [x] 3.2 End-to-end fixtures `index_evaluation_order` and `nested_array_types` (`beskid_e2e_tests`, `toolchain_gaps`).
