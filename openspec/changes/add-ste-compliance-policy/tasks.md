## 1. Validate and establish the policy

- [x] 1.1 Create the proposal, design, tasks, and the `standard-ste-compliance`
  capability delta.
- [x] 1.2 Add the validation step requirement to the delta and the canonical
  spec.
- [ ] 1.3 Validate this change strictly and validate the repository OpenSpec
  standard without running compiler or Cargo commands.

## 2. Convert the language-meta Purpose sections

- [x] 2.1 Convert the `## Purpose` section of each `language-meta--*` spec to
  STE-compliant prose. Keep the requirement text, the scenario text, the code
  examples, the source provenance, and the auto-generated sections unchanged.
- [x] 2.2 Convert the surface-syntax specs: `lexical-and-syntax`,
  `documentation-comments`.
- [x] 2.3 Convert the program-structure specs: `code-style-and-naming`,
  `extend-type`, `modules-and-visibility`, `name-resolution`.
- [x] 2.4 Convert the type-system specs: `types`, `enums-and-match`,
  `method-dispatch`, `type-inference`.
- [x] 2.5 Convert the evaluation specs: `control-flow`, `events`,
  `fibers-and-spawn`, `lambdas-and-closures`.
- [x] 2.6 Convert the contracts-and-effects specs: `contracts`,
  `error-handling`, `testing`.
- [x] 2.7 Convert the composition spec: `dependency-injection`.
- [x] 2.8 Convert the memory-model spec: `memory-and-references`.
- [x] 2.9 Convert the metaprogramming specs: `metaprogramming`, `macros`,
  `serialization`, `compiler-mod-sdk`.
- [x] 2.10 Convert the interop specs: `interop-contracts`, `c-abi-profile`,
  `rust-abi-profile`, `ffi-and-extern`, `export-and-callbacks`.
- [x] 2.11 Convert the conformance spec: `glossary-and-conformance`.

## 3. Verify and promote

- [ ] 3.1 Validate the canonical standard and this change with
  `openspec validate --all --strict`.
- [ ] 3.2 Regenerate `openspec/catalog.json` after the new capability and the
  converted Purpose sections land. (Deferred to integration time.)
- [ ] 3.3 Archive this change only after the validation and the catalog
  regeneration are complete.
