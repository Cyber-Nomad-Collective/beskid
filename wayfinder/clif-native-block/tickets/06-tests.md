## Question

Add golden tests for the CLIF block feature — verify that `clif { call @sqrt(%0) }` emits the correct CLIF `call` instruction, that parameter binding works, and that the CLIF verifier accepts the output.

## Scope

1. **Unit test for `emit_clif_block`**: Create a test in `beskid_isle/tests/clif_block.rs` that constructs a minimal `NodeFacts` implementation, calls `emit_clif_block`, and verifies the emitted CLIF contains a `call` instruction
2. **Round-trip test**: A complete pipeline test from Beskid source `clif { call @sqrt(%0) }` through parsing, type checking, lowering, and CLIF verification — similar to the existing `isle_adapter.rs` tests
3. **Rule coverage**: Update `beskid_isle/tests/rule_coverage.rs` to include `ClifBlock` in the `NodeKind` coverage table

## Constraints

- Tests must pass with `cargo test -p beskid_isle`
- The CLIF verifier must accept the emitted function
- JIT execution test (optional for v1): actually call `sqrt` and verify the result

## Files

- `compiler/crates/beskid_isle/tests/clif_block.rs` — new test file
- `compiler/crates/beskid_isle/tests/rule_coverage.rs` — update coverage table
- `compiler/crates/beskid_codegen/tests/isle_adapter.rs` — integration test (optional)

## References

- `beskid_isle/tests/leaf_clif.rs` — pattern for CLIF verification tests
- `beskid_isle/tests/enum_match.rs` — pattern for complex NodeFacts tests
- `beskid_isle/tests/rule_coverage.rs:128-170` — `every_isle_lowered_kind_has_verified_clif_evidence` test
