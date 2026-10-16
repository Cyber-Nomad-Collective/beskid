## 1. Review and validate

- [ ] 1.1 Owner reviews the 16 flagged rulings in `design.md` ("Rulings flagged for the owner") and confirms or changes each one; update the spec deltas to match.
- [ ] 1.2 Validate with `openspec validate v07-name-binding-rulings --strict --no-interactive`, run `validate-standard` and regenerate `openspec/catalog.json`.
- [ ] 1.3 Archive `v06-qualified-dependency-paths`, `v06-field-visibility`, `v06-query-front-end`, `v06-serialization-bsol`, `v06-rust-glue-integration` and `v06-function-values` before this change.

## 2. Make the query layer conform

- [ ] 2.1 Measure first: run the query gate with each "newly rejected" ruling (B10, D5, E12, F7, I2, L2, M1) on Corelib and the 61 projects; record the counts in this file before switching the authority.
- [ ] 2.2 Imports: bind `use M.Item;` (C3); report E1104 for ambiguous unqualified names at the reference (C6), for a `use` of a multi-unit module (C14) and for a second unit of one module path (B10); report E1102 for duplicate `use` names (C8); add W1503 with the credit rules and the optional missing-import help (C10, C11).
- [ ] 2.3 Re-exports: report E1501 for a `pub use` of a non-`pub` item or unreachable module in any unit (D5).
- [ ] 2.4 Qualified paths: remove the `Dynamic` fallback (E12); make a qualified non-generic function read as a value a function value (E15); allow imported `[Extern]` contracts as namespaces (E10); remove the collision exemption for the entry unit (B11).
- [ ] 2.5 Locals and order: report E1106 only without an earlier binding (G12); add W1103 for local-over-local shadowing (G11); apply the unqualified value order with fields before constants (G14).
- [ ] 2.6 Types: check generic parameters before lexical types (H4); look types up by name and report E1203/E1204 for arity (H8); remove the any-nesting type fallback (M1).
- [ ] 2.7 Members: reject `self` as a receiver name (I2); resolve `extend type` methods in `call_lowering` and build one member set with E1102 for duplicate names (I5, I6); check method privacy on the local-rooted path (F7); report E1511 for private access in a same-unit `extend type` body (F5).
- [ ] 2.8 Builtins and macros: let items and locals shadow builtins without E1102 (K1); add the constant part of the runtime corpus scope (K6); remove the macro "unique function" fallback (L2).
- [ ] 2.9 Checks that only the legacy side has today: E1002/E1003 (A6), E1505/E1506/E1507 (B6), W1504 (F10), the `extend type` target check (I7), E1303 (J4), and package-prefixed qualified names with reverse lookup (A7, A8, A11).
- [ ] 2.10 Report one E1102 per duplicate and stop the E1001/E1006 duplicate stage (A3).
- [ ] 2.11 Constant visibility (K8, owner ruling 2026-10-14): accept `pub const` in `beskid.pest` (`ConstantDefinition`), the tree-sitter grammar in `beskid_bsol` and the editor highlighting; make constants without `pub` private to their source unit (E1107); add `pub` to every Corelib, runtime-corpus-external and fixture constant read from another unit; update the grammar chapter of the standard.
- [ ] 2.12 Generated companions (B10, owner ruling 2026-10-14): discover `X.g.bd` beside `X.bd` in assembly, merge the pair into one module scope and one privacy unit, keep `use` and W1503 per file, report E1102 for a name in both files, E1105 for a companion without a primary and E1104 for a companion `mod` that names another path; teach the language server and `beskid doc` the pair; update the Mods source-generation guidance to write `X.g.bd`.

## 3. Retire the legacy resolver

- [ ] 3.1 Move the language server (navigation, completion, find references, document model) to the query binding facts.
- [ ] 3.2 Move `beskid doc` (`api.json`) to the query facts and the derived qualified names.
- [ ] 3.3 Remove legacy stage 1 (`LR/name_resolution.rs`) and the legacy rule stages that sections 2.2-2.10 replace, one rule group at a time, so that each relaxed ruling (A1, C3, G12, K1) takes effect when its legacy check goes.
- [ ] 3.4 Delete `beskid_analysis/src/resolve/**` when no consumer remains.

## 4. Verify

- [ ] 4.1 Add a query-level regression test per scenario of the spec deltas.
- [ ] 4.2 Run the `beskid_queries`, `beskid_analysis`, `beskid_lsp`, `beskid_tests_projects` and `beskid_e2e_tests` gates on the builder.
- [ ] 4.3 Record M4 (associated-type references, E1609 today) as an open conformance gap.

## 5. Beskid resolver

- [ ] 5.1 Implement these rules in the Beskid resolver and run it as a shadow against the query binding facts on Corelib and the 61 projects (`docs/research/2026-10-14-resolver-generation.md`, Part 6).
