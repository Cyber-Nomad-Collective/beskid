## 1. Validate
- [x] 1.1 Write spec deltas for each item below and validate the change with OpenSpec before implementation.
- [x] 1.2 Decide the boundary vocabulary: lower `GlueLogicalType` to `TypeShape`/`InteropSignature`, or retire Interop.Contracts from the Glue text. Ruling: lower (design decision 1).

## 2. Introduce
- [x] 2.1 Records by value: manual C ABI fixture, record shape in the C profile, `logical_type` admission, generated adapters for both directions.
- [x] 2.2 Callbacks and function types: manual fixture, root/lifetime/thread/panic rules, removal of the `Type::Function` rejection for admitted forms. Foreign function pointers as Beskid values: evaluated, deferred (design decision 4).
- [x] 2.3 Glue-driven exports: generated Rust consumer through the owner build, replacing the hand-linked `export_caller.rs` path.
- [x] 2.4 Enums: fieldless enum admission as checked discriminants; evaluate tagged variants. Tagged variants: evaluated, deferred (design decision 3).
- [x] 2.5 Boundary vocabulary: implement the decision of task 1.2 with a round-trip test over every admitted form.

## 3. Delete
- [x] 3.1 Remove the superseded rejections and any hand-written wrapper that a generated adapter replaces. The `Type::Function` and plain-record rejections are replaced by admission; `export_caller.rs` stays (plain C export profile, design decision 5).

## 4. Verify
- [ ] 4.1 Run the manual and generated matrices natively on Linux x86_64, macOS aarch64 and Windows x86_64 and record the evidence files by name with per-file test counts.
