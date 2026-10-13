## Why

Beskid 0.6 delivers Rust Glue as the in-process checked C ABI owned path (`v06-rust-glue-integration`). It admits fixed-width scalars, f32/f64, Bool, Unicode scalars, UTF-8 and byte views, arrays, unit and branded opaque handles. The design review of 2026-10-13 (docs/research/2026-10-13-glue-design-review.md) lists the gaps that keep most real Rust crates behind a hand-written wrapper. Rust `cxx`, Swift C++ interop and .NET `LibraryImport` support records by value and callbacks; Beskid Glue does not. This proposal records the deferred scope so that 0.6 acceptance text does not imply it and 0.6.1 work starts from one list.

## What Changes

- **Records by value.** Admit `repr(C)` records whose fields are admitted Glue types, in both directions, with a manual C ABI fixture first and generated adapters second. Today `Type::Complex` resolves only to `GlueHandle` brands in `beskid_queries/src/semantic_contract/glue.rs` (`logical_type`), and plain records are rejected. The C profile (`beskid_abi/src/interop/c_profile.rs`) has no record shape. The checked status/out-parameter form already carries the return path.
- **Callbacks and function types.** Admit Beskid function values as foreign callbacks and foreign function pointers as Beskid callables, with GC root, lifetime, thread and panic rules. Today `Type::Function` is rejected in `logical_type` ("unclosed associated, receiver, or callback Glue type"; line 106 at the review baseline).
- **Glue-driven exports.** Generate the Rust-side consumer for Beskid exports through the owner build, so that Rust calls Beskid without a hand-linked consumer. Today C ABI exports work and are tested by `fixtures/glue/manual/export_caller.rs`, but the export fixture is linked by hand.
- **Enums and variants.** Admit fieldless enums as checked integer discriminants and evaluate tagged variants. Today the native path has no enum admission.
- **One boundary vocabulary.** Lower `GlueLogicalType` to `beskid_abi::interop` `TypeShape` and `InteropSignature` in one function, with a test that round trips every admitted form, or retire Interop.Contracts from the Glue text. Today `TypeShape` and `InteropSignature` are not used by `beskid_codegen/src/glue`, `beskid_aot/src/api/glue` or `semantic_contract/glue.rs`.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `language-meta--interop--beskid-glue`: record, callback, enum and export admission (spec deltas are written when this proposal is accepted).
- `language-meta--interop--c-abi-profile`: record and function-pointer representations.
- `language-meta--interop--interop-contracts`: one Glue boundary vocabulary.

## Impact

Out of scope for 0.6. No 0.6 release case depends on this proposal. Each item follows the manual-then-generated discipline of `v06-rust-glue-integration`: a hand-written C ABI fixture establishes behavior before generated adapters claim equivalence. Spec deltas are added before implementation. Public standard links remain /docs/standard/.

## Compatibility, Migration and Reversion

No users exist. Each item adds admitted forms; forms that remain unadmitted keep failing before generation. Reversion removes the admission and its fixtures.
