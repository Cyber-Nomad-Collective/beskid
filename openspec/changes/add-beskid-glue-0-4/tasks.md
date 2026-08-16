## 1. Validate and establish RED evidence

- [x] 1.1 Create the proposal, design, tasks, and complete capability
  deltas.
- [ ] 1.2 Validate this change strictly and validate the repository
  OpenSpec standard without running compiler or Cargo commands.
- [ ] 1.3 Add failing tests proving `Interop.Contracts` is not
  instantiated as Rust types (no `TypeShapeClass`, `OwnershipClass`,
  `CallShapeClass`, `InteropSignature` in `beskid_abi`).
- [ ] 1.4 Add failing tests proving there is no `Backend` trait, no
  `BackendKind` enum, and no `--backend` CLI flag.
- [ ] 1.5 Add failing tests proving `ToolchainProbe` does not exist and
  external tool discovery is ad hoc (no `ToolSpec`, `ResolvedTool`,
  `ToolchainError`).
- [ ] 1.6 Add failing tests proving the `Core.Interop` corelib package
  does not exist (no `CStringView`, `CBuffer`, `CArrayView`).
- [ ] 1.7 Add failing tests proving `SDK_MOD_CONTRACTS` has only six
  contract ids and no `Beskid.Glue.*` ids.
- [ ] 1.8 Add failing tests proving there is no `mod.glue` phase id.

## 2. Introduce the typed Interop.Contracts model

- [x] 2.1 Add `beskid_abi/src/interop.rs` with `TypeShapeClass`,
  `TypeShape`, `OwnershipClass`, `CallShapeClass`,
  `InteropParameter`, `InteropReturn`, `InteropSignature` (with
  `validate()`), and `ConformanceEnvelope` (with `current()`).
- [x] 2.2 Add `beskid_abi/src/interop/c_profile.rs` with
  `CAbiProfile::bind()` and `CAbiProfile::validate_signature()`;
  permitted scalars `I8`, `U8`, `I32`, `I64`, `F64`; view type mapping.
- [x] 2.3 Add `beskid_abi/src/interop/rust_profile.rs` with
  `RustAbiProfile::bind()` and
  `RustAbiProfile::validate_runtime_symbol()`; `RUNTIME_SYMBOL_PREFIX`
  check.
- [x] 2.4 Register `pub mod interop` in `beskid_abi/src/lib.rs`.

## 3. Introduce the backend abstraction

- [x] 3.1 Add `beskid_codegen/src/backend.rs` with `BackendKind` enum
  (`CraneliftClif`, `RustSource`, `DotNetProject`), `BackendArtifact`
  enum, `BackendError`, `Backend` trait, `CraneliftClifBackend`
  wrapping `lower_syntax_program`, and `RustSourceBackend`/
  `DotNetProjectBackend` failing closed.
- [x] 3.2 Register `pub mod backend` in
  `beskid_codegen/src/lib.rs`.
- [x] 3.3 Add the `--backend` CLI flag to `BuildArgs`; validate it
  parses via `BackendKind::from_str`; error on glue backends with
  `NotImplementedFor0_4`; pass `clif` through unchanged.

## 4. Introduce the toolchain probe scaffold

- [x] 4.1 Add `beskid_abi/src/toolchain.rs` with `ToolCapability`
  enum (`Rustc`, `Cargo`, `Dotnet`, `Linker`, `Dotscope`), `ToolSpec`,
  `ResolvedTool` (with `satisfies()`), and atomized `ToolchainError`
  variants.
- [x] 4.2 Register `pub mod toolchain` in `beskid_abi/src/lib.rs`.

## 5. Introduce the corelib interop views package

- [x] 5.1 Add `corelib/packages/interop/` with `corelib_interop.bproj`
  (Lib target), `src/Core/Interop/Interop.bd` (hub),
  `CStringView.bd` (`{pointer ptr, i64 len}`), `CBuffer.bd`
  (`{pointer ptr, i64 len}`), `CArrayView.bd` (`{pointer ptr, i64
  len, i64 cap}`).
- [x] 5.2 Register `member "interop"` in `CoreLib.bws` and
  `dependency "corelib_interop"` in `beskid_corelib/corelib.bproj`.

## 6. Introduce the Beskid.Glue corelib package

- [x] 6.1 Add `corelib/packages/glue/` with `corelib_glue.bproj`
  (Lib target), `src/Core/Glue/Glue.bd` (hub), `GlueTag.bd`
  (`GlueTag` type + `GlueBackendKind` enum), `StdioBridge.bd`
  (`StdioBridgeMessage` type + `[Glue]`, `[GlueImport]`,
  `[GlueExport]` attributes).
- [x] 6.2 Add the seven contract files in `Contracts/`:
  TypeMapping (`MapType`), SymbolEmission (`EmitSymbol`), LinkArgs
  (`ResolveLinkArgs`), SignatureReader (`ReadSignatures`),
  SignatureWriter (`WriteSignatures`), ToolchainProbe (`ResolveTool`
  + `ValidateTool`), StdioBridge (`GenerateBridge`).
- [x] 6.3 Register `member "glue"` in `CoreLib.bws` and
  `dependency "corelib_glue"` in `beskid_corelib/corelib.bproj`.

## 7. Introduce the glue mod contracts and phase id

- [x] 7.1 Extend `SDK_MOD_CONTRACTS` in
  `beskid_analysis/src/mod_host/registrations.rs` with seven
  `Beskid.Glue.*` contract ids and entry methods.
- [x] 7.2 Add the `MOD_GLUE` phase id (`"mod.glue"`) in
  `beskid_pipeline/src/phases.rs` between `MOD_REWRITE` and
  `LOWER_READY`.
- [x] 7.3 Insert `MOD_GLUE` into `FULL_BUILD_PHASE_ORDER`,
  `JIT_RUN_PHASE_ORDER`, and `RUN_AOT_PHASE_ORDER`; add phase
  ordering assertions in the three existing test functions.

## 8. Verify

- [ ] 8.1 Run `cargo check -p beskid_abi` and assert the typed
  Interop.Contracts model and toolchain probe compile cleanly.
- [ ] 8.2 Run `cargo test -p beskid_pipeline` and assert the
  `mod.glue` phase ordering tests pass.
- [ ] 8.3 Run `bun run scripts/openspec/validate-standard.ts` and
  assert the OpenSpec standard validates with the new change.
- [ ] 8.4 Run full OpenSpec, compiler workspace, and release gates;
  update catalog/changelog/traceability evidence and run GitNexus
  changed-scope analysis before integration.
