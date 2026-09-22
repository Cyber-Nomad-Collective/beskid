## 1. Normative contract

- [x] 1.1 Add the ABI-v5 native executable entrypoint OpenSpec delta.
- [ ] 1.2 Merge the approved delta into the canonical AOT specification and
  regenerate catalog provenance.

## 2. Implement one executable boundary

- [ ] 2.1 Validate that every selected executable entry adapter declares the
  exact private program boundary `beskid_program_main`; reject any other
  alias before object publication or native linking.
- [ ] 2.2 Make executable AOT lowering emit exactly one private
  `beskid_program_main` adapter for the selected logical application function.
- [ ] 2.3 Make installed runtime-kit startup own `main` on Linux x86-64 and
  macOS arm64 and `wmain` on Windows x86-64; remove generated application
  definitions of those CRT symbols.
- [ ] 2.4 Keep `Start` accepted only when explicitly supplied to the compiler
  AOT API; preserve `Main` as the language and AOT default and reject missing
  or incompatible requested entries without fallback.
- [ ] 2.5 Preserve explicit `[Export]` output through the public export
  policy, distinct from the private executable entry boundary.

## 3. Verify

- [ ] 3.1 Add manifest-validation coverage for exact
  `beskid_program_main` acceptance and mismatched-alias rejection.
- [ ] 3.2 Add executable object and link tests proving that generated
  application objects define `beskid_program_main` but not `main` or `wmain`,
  while the selected runtime kit supplies the target CRT entrypoint.
- [ ] 3.3 Add Linux x86-64, macOS arm64, and Windows x86-64 installed-kit AOT
  executable coverage for logical `Main`, explicitly requested `Start`, and
  fail-closed missing/invalid entry requests.
- [ ] 3.4 Add coexistence coverage for an explicit public `[Export]` and the
  private program boundary, including public symbol-policy failures.
