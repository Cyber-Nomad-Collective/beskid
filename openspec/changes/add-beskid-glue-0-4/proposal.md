## Why

Beskid 0.4 cannot claim a complete interop story while the
`Interop.Contracts` vocabulary exists only as normative prose and is
not instantiated as typed Rust models, while there is no backend
abstraction to host glue code generators, and while foreign-library
toolchain discovery (rustc, cargo, dotnet, linkers, dotscope) is ad hoc
rather than fail-closed and manifest-governed. The C ABI profile and
interop-contracts specs define type-shape classes, call-shape classes,
ownership classes, a conformance envelope, and interop view types
(`CStringView`, `CBuffer`, `CArrayView`), but none of these exist as
Rust types or corelib packages. The codegen pipeline is CLIF-only with
no seam for a source-emitting backend; adding a non-CLIF backend
requires a `Backend` trait at the `CodegenInput` boundary. The host
linker and external tool discovery is not under the same hash-verified
manifest discipline as the ABI-v5 runtime kit. Finally, there is no
compiler mod contract set for glue-specific operations (type mapping,
symbol emission, link args, signature read/write, toolchain probing,
stdio bridge generation).

This change completes the contracts before 0.4 sign-off so the glue
model, backend abstraction, toolchain probe, glue mod contracts, and
corelib interop view types are normative, typed, and fail-closed. 0.5
delivers language-specific code generation (Rust crate emission, .NET
project emission via dotscope, stdio-protocol runtime, corelib glue
runtime implementations); 0.4 is the contract cutoff.

## What Changes

- **ADD** `language-meta--interop--beskid-glue`: the Beskid.Glue
  capability. Defines the glue model as Beskid.Glue attributes
  (`[Glue]`, `[GlueImport]`, `[GlueExport]`), a generated stdio bridge
  fiber with host typed tag objects per imported library, seven
  atomized glue contracts (TypeMapping, SymbolEmission, LinkArgs,
  SignatureReader, SignatureWriter, ToolchainProbe, StdioBridge), and
  a `GlueTag` type carrying the backend kind. Glue rules live in Beskid
  (`type=Mod` packages); the host seam is Rust.
- **ADD** `compiler--codegen-and-ir--backend-abstraction`: a `Backend`
  trait and `BackendKind` enum at the `CodegenInput` boundary.
  `CraneliftClif` is the existing path; `RustSource` and
  `DotNetProject` are declared and fail closed with
  `BackendError::NotImplementedFor0_4` until 0.5. Backend selection is
  via a `--backend` CLI flag (default `clif`); glue backends error
  immediately.
- **ADD** `tooling--foreign-library-import--glue-toolchain-probe`: a
  crossplatform toolchain-checking contract modeled on the ABI-v5
  runtime kit discovery/validation. `ToolchainProbe` resolves
  `rustc`, `cargo`, `dotnet`, `linker`, and `dotscope` against a
  `ToolSpec` (name, version, target, capability, exact path, sha256)
  and returns atomized `ToolchainError` variants. Fail closed, no
  fuzzy search-path fallback.
- **MODIFY** `language-meta--interop--interop-contracts`: instantiate
  the `Interop.Contracts` vocabulary as typed Rust models in
  `beskid_abi::interop`: `TypeShapeClass`, `TypeShape`,
  `OwnershipClass`, `CallShapeClass`, `InteropParameter`,
  `InteropReturn`, `InteropSignature` (with `validate()`), and
  `ConformanceEnvelope` (with `current()` using
  `BESKID_RUNTIME_ABI_VERSION` and `BESKID_USER_FFI_LAYOUT_BAND`). C
  and Rust ABI profiles bind these primitives; they do not redefine
  them.
- **MODIFY** `language-meta--interop--c-abi-profile`: the C ABI
  profile binds `Interop.Contracts` primitives via `CAbiProfile::bind()`
  and `CAbiProfile::validate_signature()`. Permitted scalars are
  `I8`, `U8`, `I32`, `I64`, `F64`. Interop view types
  (`CStringView`, `CBuffer`, `CArrayView`) map to `BeskidStr` and
  `BeskidArray` at the boundary.
- **MODIFY** `compiler--compiler-mods--mod-host-bridge`: extend the
  closed `SDK_MOD_CONTRACTS` set with seven `Beskid.Glue.*` contract ids
  (TypeMapping, SymbolEmission, LinkArgs, SignatureReader,
  SignatureWriter, ToolchainProbe, StdioBridge) and add a `mod.glue`
  phase id between `mod.rewrite` and `lower.ready`.
- **MODIFY** `compiler--build-pipeline--backends-jit-aot`: extend the
  shared-`CodegenArtifact` contract to allow a `BackendArtifact` enum
  with CLIF, Rust source, and .NET project variants. 0.4 ships only the
  CLIF variant populated; source variants are declared and fail
  closed.
- **MODIFY** `core-library--foundation-and-primitives--core-interop-views`:
  add the `Core.Interop` corelib package with `CStringView`,
  `CBuffer`, and `CArrayView` record types using `pointer` for the
  `ptr` field and `i64` for `len`/`cap`, matching the ABI-v5
  `BeskidStr`/`BeskidArray` layouts.

## Capabilities

### New Capabilities

- `language-meta--interop--beskid-glue`: the Beskid.Glue model, glue
  attributes, stdio bridge fiber, host typed tag objects, and seven
  atomized glue contracts.
- `compiler--codegen-and-ir--backend-abstraction`: the `Backend` trait,
  `BackendKind` enum, `BackendArtifact` enum, and `--backend` CLI flag.
- `tooling--foreign-library-import--glue-toolchain-probe`: the
  crossplatform toolchain-checking contract for rustc, cargo, dotnet,
  linker, and dotscope.

### Modified Capabilities

- `language-meta--interop--interop-contracts`: typed Rust
  instantiation of the Interop.Contracts vocabulary.
- `language-meta--interop--c-abi-profile`: C ABI profile binds
  Interop.Contracts primitives and validates signatures.
- `compiler--compiler-mods--mod-host-bridge`: seven glue contract ids
  and the `mod.glue` phase id.
- `compiler--build-pipeline--backends-jit-aot`: `BackendArtifact` enum
  extends the shared-codegen-artifact contract.
- `core-library--foundation-and-primitives--core-interop-views`: the
  `Core.Interop` corelib package with interop view record types.

## Compatibility and migration

This change is contract-first. The typed Interop.Contracts Rust models,
the `Backend` trait, the `ToolchainProbe` scaffold, the glue mod
contracts, the `Core.Interop` package, and the `--backend` CLI flag are
all new surface area. The existing CLIF codegen path is unchanged: the
`CraneliftClif` backend wraps the existing `lower_syntax_program`. The
seven glue contract ids extend the closed `SDK_MOD_CONTRACTS` set; the
existing six compiler mod contracts remain. The `mod.glue` phase id is
inserted between `mod.rewrite` and `lower.ready` without reordering
existing phases. The `--backend` CLI flag defaults to `clif`; glue
backends error immediately with `NotImplementedFor0_4`. No public
standard URL or legacy URL changes.

## Rollback and staged deployment

This contract is staged before language-specific generation. 0.4
ships the contracts, typed models, backend seam, toolchain probe
scaffold, glue mod contract ids, corelib interop views, and the CLI
flag — all fail-closed for glue backends. 0.5 delivers Rust crate
emission, .NET project emission via dotscope, stdio-protocol runtime,
and corelib glue runtime implementations. Reverting a later
implementation restores the prior release as a unit; it does not
reinstate a CLIF-only pipeline without a backend trait, an
uninstantiated Interop.Contracts vocabulary, an ad hoc toolchain
discovery, or a six-contract mod SDK as the production path.

## Impact

Spec plus scaffold in this change. Follow-on 0.5 work covers
language-specific Rust crate emission, .NET project emission via
dotscope signature read/write, stdio-protocol runtime implementation,
corelib glue runtime implementations, and conformance tests for each
glue backend.
