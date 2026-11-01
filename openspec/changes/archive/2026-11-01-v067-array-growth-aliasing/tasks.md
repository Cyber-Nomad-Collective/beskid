## 1. Validate
- [x] 1.1 Reproduce on preview.10: local copy, spare slot, field, capture, list element, copied parameter, returned field, `Append` result (all wrong); in-place growth of an unaliased array (correct).
## 2. Introduce
- [x] 2.1 Write the memory-model requirement and the growth-operation delta.
- [x] 2.2 `array_share` fact (queries), mark emission and mark test (ISLE), adapter wiring (codegen).
- [x] 2.3 Runtime: `ArrayElementDescriptor` clears the mark at every element-descriptor read; geometric target from the length.
## 3. Migrate
- [x] 3.1 Corelib `Array.Append` doc comment and CHANGELOG.
- [x] 3.2 Shrink: `RemoveLast` owner-aware copy of a shared array; Corelib `RemoveLast`/`Clear` doc comments; bsol `Abort` keeps its arrays; `Codec.Mem.Zeroed` and `Crypto.BigNat.Zeros`/`ZeroBytes` allocate with `Array.Zeroed`.
- [x] 3.3 Lent field reached through an array element: array arguments whose elements can lead to an object reach the holder.
- [x] 3.4 W1240 also reports a discarded `Array.RemoveLast` on an array that is not an owner (registry requirement in `v067-semantic-diagnostics`).
## 4. Verify
- [ ] 4.1 Codegen `collection_growth_owner`, e2e `array_growth_aliasing` and `array_shrink_aliasing`, affected crates, corelib_tests, Corelib package tests, Book blocks, lings.
- [ ] 4.2 Corelib benches: growth paths before and after.
