## Why

Rust Glue is required for beskid 0.6, but compiler 95c203ff only observes Glue annotations, source backends fail closed and tool probing verifies regular-file presence. A recoverable scalar emitter is useful implementation material, not full import/export or lifecycle delivery. This change defines the complete required Rust scope before behavior changes.

## What Changes

- Deliver a manually proven C ABI basis and equivalent generated Rust adapters for both directions, all fixed integer widths, f32/f64, Bool, Unicode scalar, UTF-8/bytes, unit, checked handles and target-sized values.
- Add canonical missing primitive prerequisites; implement registered Glue Mod invocation, deterministic source/build artifact closure, explicit bounded tools and one stdio transport using shared serialization, Core.IO and existing fibers.
- Add child-process pipes/wait/termination and canonical host syscall ownership needed by that transport.
- Supersede scalar-only or scaffold-only Glue completion claims. .NET remains optional and unavailable until separately qualified.

## Capabilities

### New Capabilities
- `language-meta--interop--beskid-glue`: delivered Rust binding, generation, transport and lifecycle contract, reconciling the pending add-beskid-glue-0-4 proposal without relying on its unarchived assertions.

### Modified Capabilities
- `language-meta--type-system--types`: canonical full primitive grammar and semantics prerequisite.
- `language-meta--interop--interop-contracts`: normalized Glue identity and ownership compatibility.
- `language-meta--interop--c-abi-profile`: required Rust Glue C representation and ownership matrix.
- `language-meta--interop--rust-abi-profile`: separation from native Rust and runtime embedding ABIs.
- `compiler--compiler-mods--mod-host-bridge`: actual deterministic registered contract execution.
- `compiler--build-pipeline--backends-jit-aot`: deterministic external artifact and tool validation.
- `core-library--foundation-and-primitives--core-process`: streaming child control.
- `execution--runtime--panic-io-and-syscalls`: canonical host process syscall lifecycle.
- `tooling--manifests-and-lockfiles--project-manifest-contract`: top-level `glue` owner block (library identity, backend, Rust source directory).
- `tooling--cli--build-analyze-run-contract`: `beskid build --backend glue-rust` selection, outputs and explicit Rust tool flags; glue-dotnet stays unavailable.

## Impact

Interop.Contracts remains boundary vocabulary; normal Beskid execution remains canonical AOT/ISLE. R2 generic serialization is owned by v06-serialization-bsol; Glue supplies its value-format adapter and explicit limits. This changes observable primitive availability and Rust integration but does not declare .NET, callback/variadic or foreign-thread support. New user FFI layouts use a separately recorded layout band; runtime ABI changes require their existing version gate. Public standard links remain /docs/standard/ and legacy routes retain their redirects.

## Compatibility, Migration and Reversion

Unsupported historical Glue forms continue to fail before generation until implemented. Raw GlueTag construction/handle access is replaced by checked session-scoped APIs; no compatibility bypass remains. Recover reviewed draft hunks from compiler 16848cf0 and its dirty overlay into the accepted baseline without mutating user work. Reversion disables the affected backend and rejects its artifacts; it cannot reuse incompatible bands or relabel old evidence. Required release scope cannot be reduced by rollback without explicit scope change.
