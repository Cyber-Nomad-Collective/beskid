# v0.6 Rust BSOL grammar milestone

## Scope and result

Implemented the shared Rust bootstrap syntax corrections under `beskid_bsol`: strict escaped strings and Unicode scalar decoding, exact signed integer/finite decimal spellings, numeric list items, empty maps, canonical @ attributes, inline blocks on assignment RHS, ordered nested AST construction and canonical semantic document/value writing. Regenerated Tree-sitter parser/node-types/grammar JSON/highlighting queries and exercised every shipped schema through the existing sync script.

This is the bounded R3 grammar milestone. Native Beskid corelib parsing/writing, complete typed serialization, profile-aware bindings, structural migrations, full shared semantic corpus and required-target qualification remain mandatory later work. No compiler/product code outside `beskid_bsol` was edited by this worker; no commits or pushes occurred. GitNexus was omitted under the user's explicit goal-wide instruction.

## Red/green evidence

Build environment for every Cargo test/Clippy command: `CARGO_TARGET_DIR=/Users/mikserek/.codex/worktrees/v06-release/beskid/.build/bsol CARGO_BUILD_JOBS=2`.

1. `cargo test --manifest-path beskid_bsol/Cargo.toml -p bsol-syntax --test v06_grammar`: initial RED, 0 passed/5 failed. Failures included accepted bracket attributes/invalid escapes, missing signed value, rejected empty map and escaped quote causing unclosed body.
2. Corrected grammar/scanner/builder: GREEN, 5 passed/0 failed. Existing `parse_attributes` initially failed because its fixture used bracket spelling; migrated that fixture to the normative @ spelling.
3. `cargo test --manifest-path beskid_bsol/Cargo.toml -p bsol-analysis structured_extra_field_format`: RED, 0 passed/1 failed, nested output was `[value"record" { ... }]`. Canonical recursive writing fixed truncation and escapes; final workspace result includes GREEN for this test.
4. Nested writer indentation test: RED with over-indented @ attribute and unindented block kind; corrected writer passes literal canonical expected output and idempotence.
5. Identifier-prefix/raw-schemaless regression: RED on `true_identifier`; atomic bool boundary and raw quote scanning fixed it, GREEN 1 passed.
6. Unicode diagnostic regression: RED panic `span bounds` for `😀 {}`; normalized UTF-8 boundaries and one-based newline counting fixed it, GREEN 1 passed.
7. Manually constructed numeric AST writer test: RED accepting `1 other = 2`; exact numeric-token/full-consumption and finite-value validation fixed it, GREEN 1 passed.
8. Final `cargo test --manifest-path beskid_bsol/Cargo.toml --workspace`: exit 0; conformance7, analysis5, schema5, existing syntax4, v06 grammar12 tests all passed (33 tests total; remaining crates/doc-tests had zero tests). No ignored/filtered cases in final workspace run and no warnings. The runtime-manifest case parses and canonical-roundtrips the complete portable fixture.
9. `bash beskid_bsol/scripts/sync-grammar.sh`: regenerated and passed 3/3 Tree-sitter corpus cases and all shipped schema parses. Initial regeneration revealed expected node rename `decimal_unsigned` → `number`; corpus/highlighting queries were updated to the intentional numeric node.
10. `cargo fmt --manifest-path beskid_bsol/Cargo.toml --all -- --check`, `git -C beskid_bsol diff --check`: pass after formatting.
11. `cargo clippy --manifest-path beskid_bsol/Cargo.toml --workspace --all-targets -- -D warnings`: exit 0, warning-free.

## Grammar rulings

- @Name and optional nonempty `(key = value, ...)` arguments are canonical. Bracket attributes, empty arguments, missing commas and trailing argument commas reject. The previous scanner accepted bracket spelling despite Pest using @; this conflict is resolved explicitly by the validated OpenSpec change.
- Strings decode the defined escaped quote/backslash/control/Unicode forms; surrogate pairs combine to one scalar. Unknown/truncated escapes, raw controls and lone/unpaired surrogates reject. Escape decoding uses `serde_json::from_str::<String>`; this is only a scalar codec, not a BSOL parser forwarding path.
- Integers retain exact raw decimal text and are never converted through f64. Decimal/exponent literals must parse to finite f64; negative zero spelling survives. Leading zeros, malformed token suffixes and NaN/Infinity reject. Existing boolean-prefix identifiers stay identifiers.
- Empty maps accept. RHS inline blocks precede bare identifiers in PEG alternatives and remain a distinct AST value; lists retain their existing inline blocks. Nested items now unwrap actual `block_item` nodes and preserve assignment/block contents and original byte spans.
- Entire ordinary block bodies must be consumed; unknown trailing text cannot silently terminate parsing. Braces in strings/comments do not affect balancing. Schemaless contents remain raw and do not undergo ordinary escaped-string validation.
- Canonical writer uses two-space indentation, LF and final LF. Ordered blocks/items and exact numeric spelling remain stable. Comments/format preservation is outside canonical Write and belongs to the separate edit/document contract.

## API and compiler/editor handoff

`bsol-syntax` and the `bsol` facade export:

- `BsolNumber { span: BsolSpan, raw: String }`.
- Additive variants `BsolValue::Number(BsolNumber)`, `BsolValue::InlineBlock(BsolBlock)` and `BsolListItem::Number(BsolNumber)`.
- `BsolQuotedString::new(span: BsolSpan, raw: &str) -> Result<BsolQuotedString, BsolError>` now performs strict decoding; callers must propagate the checked result.
- `write_bsol_document(&BsolDocument) -> Result<String, BsolError>`.
- `write_bsol_value(&BsolValue) -> Result<String, BsolError>`.

Source-preserving editor workers should consume existing exact `span.start..span.end` byte ranges, retain original document text/comments and use `write_bsol_value` for replacement value fragments. Canonical whole-document Write deliberately does not preserve comments. Assignment attributes appear once, escaped labels exclude trailing whitespace from spans, and all reported Unicode spans lie on UTF-8 boundaries. Tree-sitter numeric node is now `number`; downstream node-name queries must update. Escaped string scalar decoding and nonfinite/overflow checks remain semantic Rust parser responsibilities beyond Tree-sitter lexical tokenization.

Compiler integration caught `compiler/crates/beskid_manifest/src/v5/parsing.rs` expecting only Ident/QuotedString in its scalar helper. Actual runtime manifest syntax still parses; the helper must consume `Number(n).raw` for numeric scalar declarations. That adapter is owned by root/compiler integration, not this worker. Other exhaustive compiler AST matches must deliberately support the new variants rather than converting numbers back into identifiers.

## Remaining limits

The bounded grammar milestone does not implement the complete 8 MiB/depth/allocation policies, generic metadata or schema migration corrections. The writer checks numeric AST injection/nonfinite values and reparses output, but general manually synthesized identifier/block validation and source-preserving edits need their respective contract work. Full Rust/native semantic diagnostic parity and Windows/Linux qualification remain release gates; macOS-local grammar tests do not close them.
