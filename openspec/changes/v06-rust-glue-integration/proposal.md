## Why

Rust Glue is required for beskid 0.6, but compiler 95c203ff only observes Glue annotations, source backends fail closed and tool probing verifies regular-file presence. A recoverable scalar emitter is useful implementation material, not full import/export or lifecycle delivery. This change defines the complete required Rust scope before behavior changes.

## What Changes

- Deliver Rust Glue as the in-process checked C ABI owned path: a Beskid consumer image and Rust owner images, admission records on each image, `[RustOwner]` mappings and `[GlueHandle]` opaque types. Prove a manual C ABI basis and equivalent generated Rust adapters for both directions, all fixed integer widths, f32/f64, Bool, Unicode scalar, UTF-8/bytes, unit, checked handles and target-sized values.
- Add canonical missing primitive prerequisites, deterministic source/build artifact closure, explicit bounded tools and hermetic owner Cargo builds.
- Add child-process pipes/wait/termination and canonical host syscall ownership as general Core.Process capabilities.
- **BREAKING** Delete the 0.4 Glue scaffold: the seven string-in/string-out Glue Mod contracts, the `[Glue]`, `[GlueImport]` and `[GlueExport]` attributes, the `GlueBackendKind` enum, the no-op `mod.glue` phase and its `beskid_analysis` host module. Glue generation does not run Mod contracts.
- Move the stdio bridge (envelope, binary codec, pump, session) to the separate provisional change `v06-glue-stdio-bridge-provisional`. It has no 0.6 delivery obligation.
- Record records by value, callbacks, glue-driven exports, enums and the boundary vocabulary unification as `v061-glue-extensions`.
- Supersede scalar-only or scaffold-only Glue completion claims. .NET remains optional and unavailable until separately qualified.

## Capabilities

### New Capabilities
- `language-meta--interop--beskid-glue`: delivered in-process Rust Glue binding, generation, admission and lifecycle contract with named test evidence, reconciling the pending add-beskid-glue-0-4 proposal without relying on its unarchived assertions.

### Modified Capabilities
- `language-meta--type-system--types`: canonical full primitive grammar and semantics prerequisite.
- `language-meta--interop--interop-contracts`: normalized Glue identity over the Glue logical type vocabulary.
- `language-meta--interop--c-abi-profile`: required Rust Glue C representation and ownership matrix.
- `language-meta--interop--rust-abi-profile`: separation from native Rust and runtime embedding ABIs.
- `compiler--build-pipeline--backends-jit-aot`: deterministic external artifact and tool validation.
- `core-library--foundation-and-primitives--core-process`: streaming child control.
- `execution--runtime--panic-io-and-syscalls`: canonical host process syscall lifecycle.
- `tooling--manifests-and-lockfiles--project-manifest-contract`: top-level `glue` owner block (library identity, backend, Rust source directory).
- `tooling--cli--build-analyze-run-contract`: `beskid build --backend glue-rust` selection, outputs and explicit Rust tool flags; glue-dotnet stays unavailable.

## Impact

The Glue logical type vocabulary (`GlueLogicalType`) is the 0.6 Glue boundary vocabulary; unification with Interop.Contracts is deferred to `v061-glue-extensions`. Normal Beskid execution remains canonical AOT/ISLE. R2 generic serialization is owned by v06-serialization-bsol; the provisional stdio bridge owns the Glue value-format adapter. This changes observable primitive availability and Rust integration but does not declare .NET, callback/variadic, foreign-thread or stdio service support. New user FFI layouts use a separately recorded layout band; runtime ABI changes require their existing version gate. Public standard links remain /docs/standard/ and legacy routes retain their redirects.

## Compatibility, Migration and Reversion

No users exist, so the 0.4 scaffold is deleted without deprecation: the seven Glue Mod contracts, the `[Glue]`, `[GlueImport]` and `[GlueExport]` attributes, `GlueBackendKind`, the `mod.glue` phase and raw `GlueTag` construction. No compatibility bypass remains. Recover reviewed draft hunks from compiler 16848cf0 and its dirty overlay into the accepted baseline without mutating user work. Reversion disables the affected backend and rejects its artifacts; it cannot reuse incompatible bands or relabel old evidence. Required release scope cannot be reduced by rollback without explicit scope change.
