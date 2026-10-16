## 1. Validate

- [x] 1.1 Validate this change with `openspec validate v06-struct-literal-condition-context --strict`. (`openspec/catalog.json` lists only `openspec/specs`, so it changes when this delta is archived into the spec.)

## 2. Introduce

- [x] 2.1 Carry the "no struct literal" context on the pest stack in `compiler/crates/beskid_analysis/src/beskid.pest`: `if`, `while`, `for` and `match` push a restricting marker; delimited nested positions push their opening delimiter; `StructLiteralExpression` rejects the literal when the top marker is the restricting one.
- [x] 2.2 Add parser tests in `compiler/crates/beskid_analysis/tests/struct_literal_conditions_v06.rs`.

## 3. Verify

- [x] 3.1 Every `.bd` source in the repository (9759 files) parses to a byte-identical pest tree with the old and the new grammar (rule, start and end of every pair); 137 sources that failed before still fail with the same error.
- [ ] 3.2 `corelib_parse_tree_stability` passes without re-blessing, and the Mod SDK accepts the trees (rc-prep `QUALIFY=1`).
