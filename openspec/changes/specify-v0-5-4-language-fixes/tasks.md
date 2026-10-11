## 1. Validate

- [x] 1.1 Read the 0.5.4 compiler log (`43903d3c..ff0b8545`, including
  `feat/0.5.4-f64` at `648d5e2a`) and list each commit that changes
  observable language behavior; exclude build pins, the no-net-change
  visibility restore `c8bdc7f0`, and the corelib `Time.bd` pin.
- [x] 1.2 Confirm each stated rule against the commit's code and tests, and
  confirm that the language has no `f32` type to specify.
- [x] 1.3 Validate this change with
  `openspec validate specify-v0-5-4-language-fixes --strict --no-interactive`.

## 2. Introduce

- [x] 2.1 Interpolation operand text for `string`, integers, `bool`, and
  `f64`, with runtime services `str_from_i64` and `str_from_f64_bits`
  (`abe19020`, `648d5e2a`).
- [x] 2.2 Empty concatenation through `str_concat` (`abe19020`).
- [x] 2.3 String ordering through `str_cmp` (`88143add`).
- [x] 2.4 Saturating `f64` to integer conversions (`909444b8`).
- [x] 2.5 Fully qualified module paths without `use` (`3763c00b`).
- [x] 2.6 `bulk` parameter typing, generic inference, and lowering
  (`e9664e4e`).
- [x] 2.7 Contract methods on `where`-bounded generic receivers (`570fdd56`).
- [x] 2.8 Parameters and locals shadow fields, `this.Method()`, fields of call
  results, nested projections in generic methods, array literal elements,
  locals annotated with a type parameter, and contextual enum constructors in
  method arguments (`f857c827`, `9c94c662`, `a4fac1b2`, `8223acd3`,
  `2b74d8ef`, `b2ea9586`, `8e230afe`).

## 3. Migrate

- [x] 3.1 No source migration: the rules are additive or fix defects.

## 4. Delete

- [x] 4.1 The `bulk` checker work replaced eight copies of the call arity and
  argument loop with one helper; no other legacy path remains.

## 5. Verify

- [x] 5.1 Compiler tests named in `design.md` pass on the 0.5.4 branch.
- [ ] 5.2 Archive `extend-contract-system-generic-and-self` first, then archive
  this change and promote its requirements into `openspec/specs`.
- [ ] 5.3 After archiving, regenerate `openspec/catalog.json` and run
  `pnpm run openspec:validate`.
