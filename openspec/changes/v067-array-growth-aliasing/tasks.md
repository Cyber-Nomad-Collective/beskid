## 1. Validate
- [x] 1.1 Reproduce on preview.10: local copy, spare slot, field, capture, list element, copied parameter, returned field, `Append` result (all wrong); in-place growth of an unaliased array (correct).
## 2. Introduce
- [x] 2.1 Write the memory-model requirement and the growth-operation delta.
- [x] 2.2 `array_share` fact (queries), mark emission and mark test (ISLE), adapter wiring (codegen).
- [x] 2.3 Runtime: `ArrayElementDescriptor` clears the mark at every element-descriptor read; geometric target from the length.
## 3. Migrate
- [x] 3.1 Corelib `Array.Append` doc comment and CHANGELOG.
## 4. Verify
- [ ] 4.1 Codegen `collection_growth_owner`, e2e `array_growth_aliasing`, affected crates, corelib_tests, Corelib package tests, Book blocks, lings.
- [ ] 4.2 Corelib benches: growth paths before and after.
