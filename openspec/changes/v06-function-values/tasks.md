## 1. Validate

- [ ] 1.1 Validate this change with `openspec validate v06-function-values --strict` and regenerate `openspec/catalog.json`.

## 2. Introduce

- [x] 2.1 Map function types to the closure record pointer ABI; lower a lambda in value position to an allocated record (`lambda_value_required`), and keep an immutable expression-bodied lambda local used only as a callee inline.
- [x] 2.2 Classify calls through function-typed parameters, locals, field projections and call results as `CallLowering::FunctionValue` and lower them with `call_indirect`, selecting the environment convention from the record.
- [x] 2.3 Lower a named, non-generic function read as a value to a record with the item's entry (`function_item_value`); make the item reachable from its reader.
- [x] 2.4 Route lambda contextual typing through `expected_type` (`Return` inside a block-bodied lambda, `LambdaBody`, untyped parameters) and the lambda's own source identity (`lambda_source_identity`); delete the separate parent walk.
- [x] 2.5 Report E1233 for a non-spawn lambda that captures a `mut` local or a native pointer, as a legality fact of `check_items`.
- [x] 2.6 Report E1209 for a string concatenation or interpolation operand without a text form, as a `beskid check` gate obligation.
- [x] 2.7 Port the generic `bulk T[]` query part: `bulk_call_element_abi_type`, bulk-aware generic inference, and the trailing-argument expectation in `expected_type`.

## 3. Verify

- [ ] 3.1 Run `cargo test --locked -p beskid_queries -p beskid_codegen -p beskid_isle -p beskid_analysis` on the builder.
- [ ] 3.2 Run the Corelib check gate and the query parity inventory.
