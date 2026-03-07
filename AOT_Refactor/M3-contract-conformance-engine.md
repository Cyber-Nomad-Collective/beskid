# M3 — Contract Conformance Engine

## Goal
Make explicit `type T : ContractA, ContractB` conformance first-class and drive contract obligations + call classification from it.

## Current grounded status
- Contract diagnostics exist for missing methods/signature mismatch:
  - `analysis/diagnostic_kinds.rs` (`E1601`, `E1602`, `E1606`)
- But type-definition models currently have no conformance list:
  - `syntax/items/type_definition.rs`
  - `hir/item.rs` (`HirTypeDefinition`)

## Task list
1. Add conformance list parsing and AST/HIR carriage:
   - `beskid.pest`
   - `syntax/items/type_definition.rs`
   - `hir/item.rs`
   - lowering layer files in `hir/lowering/`
2. Resolver: register declared conformance relationships in resolution tables.
3. Build obligation expansion:
   - include embedded contracts
   - flatten required method signatures
4. Validate each declared conformance against impl methods:
   - missing method -> `E1601`
   - signature mismatch -> `E1602`
5. Feed conformance metadata into call classification where contract-typed dispatch is required:
   - `types/context/expressions.rs`
   - downstream lowering metadata consumption

## Acceptance criteria
- Explicit conformance declarations are parsed, lowered, resolved, and enforced.
- Existing contract diagnostics map to declared conformance source spans.
- No ad-hoc contract satisfaction by naming conventions alone.

## Test targets
- `crates/beskid_tests/src/analysis/legality.rs`
- `crates/beskid_tests/src/analysis/pipeline/core.rs`
- `crates/beskid_tests/src/analysis/types.rs`
- Add/extend contract-specific negative tests for obligation failure and mismatched signatures.
