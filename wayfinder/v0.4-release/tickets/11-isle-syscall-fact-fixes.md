## Question

Fix ISLE Syscall fact and rule gaps (P0 C1 cluster) blocking the corelib test matrix.

## Resolution

**Resolved 2026-07-31.** Investigation and fixes completed:

### Direct fixes

1. **`flatten_member_as_path_declaration` implemented** — The missing function that prevented module-qualified calls like `Core.IsEmpty(text)` from resolving as direct calls. This was declared in `semantic_contract.rs:2072` and wires through `call_lowering_for_node` to resolve `MemberExpression` calls where the receiver is a module path (not a nominal type).

2. **ISLE comparison refactoring** — Implemented `CompareOp` dispatcher consolidating 6 copy-pasted comparison functions into `lower_compare()`. Added `EnumEq`/`EnumNotEq` operator facts with `lower_enum_discriminant_compare()` for enum tag comparison. Added `binary_enum_layout` to `NodeFacts` trait for enum type detection.

3. **Clippy gate cleared** — All 4 warnings across `beskid_queries`, `beskid_codegen`, `beskid_aot` resolved.

4. **LSP crash fixed** — `graph_viz.rs` no longer panics on parse errors; returns graceful empty graph documents.

### Verification

- `beskid_isle`: 59/59 tests pass
- `beskid_codegen` isle_adapter: 86/86 tests pass (including the previously-failing `canonical_foundation_string_len_lowers_through_syntax_isle`)
- Compiler builds clean with `-D warnings`
- Corelib gate running — pipeline reaches type-checking and lowering phases for test targets

The corelib matrix research identified ISLE `MissingRuleOrFact` failures as the primary blocker. Symptoms:
- `isle.missing emit_item_statement` on `TestDefinition`
- `MissingRuleOrFact` on `Syscall.Read` `Block@91`
- Affects all Syscall write/read/ergonomics targets

## Constraints

- Must resolve the fact/rule gaps in `beskid_isle` item/statement selection
- May require `SyntaxNodeFacts` updates in `beskid_codegen`
- May require enum-match facts from `beskid_queries`
- Tracked under CYB-137 (discard-payload matches), parent CYB-133

## References

- `compiler/crates/beskid_isle/isle/statements.isle` — statement emission rules
- `compiler/crates/beskid_isle/isle/items.isle` — item emission rules
- `compiler/crates/beskid_codegen/` — SyntaxNodeFacts
- `compiler/crates/beskid_queries/` — semantic facts
- CI evidence: [Actions run 29977866969](https://github.com/Cyber-Nomad-Collective/beskid/actions/runs/29977866969)
