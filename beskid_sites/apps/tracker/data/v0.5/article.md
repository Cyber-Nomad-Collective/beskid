# v0.5 — Foundations, networking, and glue language-specific generation

**Status:** Planned (spec-planned; implementation not started) · planning window opens 2026-08-16, anchored at v0.4 release tip `17442fb9` (`beskid`)

v0.5 is the next delivery candidate after v0.4 sign-off. It is **spec-planned only**: two OpenSpec changes (`beskid-v0-5-foundations` = CYB-60, `beskid-v0-5-networking` = CYB-61) define the normative scope, and the glue 0.5 generation track consumes the contracts landed by `add-beskid-glue-0-4`. No implementation commits have landed; the cutoff will be revised with real start/end SHAs once work begins and 0.4 sign-off closes.

## Tracks

| Track | OpenSpec / dependency | Focus |
|-------|----------------------|-------|
| **Foundations** | `beskid-v0-5-foundations` (CYB-60) | Fibers, channels, scheduler, `spawn`/`use` grammar, Core.IO — the async/resource-lifetime substrate |
| **Networking** | `beskid-v0-5-networking` (CYB-61) | TCP/UDP/DNS with opaque handles, one reactor contract, Core.IO.Stream implementation |
| **Glue 0.5 generation** | consumes `add-beskid-glue-0-4` contracts | Language-specific code generation for Beskid.Glue |

## Glue 0.5 scope

The glue/interop workstream delivers language-specific code generation on top of the 0.4 contract cutoff:

- **Rust source backend** — `RustSource` `Backend` variant emitting a compilable crate via `TokenStream` + `prettyplease` at the `CodegenInput` boundary (alongside the existing `CraneliftClif` path).
- **.NET project backend** — `DotnetProject` backend emitting a NativeAOT-able .NET project; `dotscope` reader drives signature reading for managed assemblies.
- **stdio-protocol bridge fiber runtime** — the generated stdio bridge fiber with host typed tag objects per imported library, implementing the `StdioBridge` glue contract.
- **corelib glue runtime implementations** — corelib packages instantiating the interop view types (`CStringView`, `CBuffer`, `CArrayView`) and the seven atomized glue contracts (TypeMapping, SymbolEmission, LinkArgs, SignatureReader, SignatureWriter, ToolchainProbe, StdioBridge).
- **ToolchainProbe full validation** — fail-closed, manifest-governed discovery of rustc, cargo, dotnet, linkers, and dotscope under the same hash-verified discipline as the ABI-v5 runtime kit.
- **MOD_GLUE dispatcher wiring** — compiler mod contract set for glue-specific operations (type mapping, symbol emission, link args, signature read/write, toolchain probing, stdio bridge generation).
- **glue attribute semantic handling** — `[Glue]`, `[GlueImport]`, `[GlueExport]` attribute lowering and the normative boundary against the v0.3 `Extern` / `[Export]` C ABI surfaces (see `reconcile-glue-ffi-extern-0-5`): a symbol uses one surface, not both, and the reference compiler rejects conflicting annotations with a diagnostic.

## Dependencies

Glue 0.5 generation depends on three 0.4-band contract changes that must close before implementation begins:

- **`add-beskid-glue-0-4`** — the contract cutoff: Beskid.Glue capability, `Backend` trait / `BackendKind` enum, `ToolchainProbe` contract, seven glue mod contracts, `GlueTag` type, and corelib interop view types. 0.4 is the contract cutoff; 0.5 is the generation.
- **`complete-mod-pipeline-0-4`** — `NativeContractInvoker` dlopen, the host execution seam the MOD_GLUE dispatcher builds on.
- **`complete-v0-4-corelib-runtime-contracts`** — retired patterns and the runtime contract surface that corelib glue runtime implementations must respect.

The normative boundary between the direct C ABI surfaces and the glue-mod-driven surfaces is established by **`reconcile-glue-ffi-extern-0-5`**, which lands before 0.5 generation to prevent a single symbol from producing both a link-time `ExternImport` row and a glue `GlueTag` binding.

## Status note

v0.5 is **spec-planned but not implementation-started**. Task seed files are intentionally not created in this band; they will be seeded when implementation begins and 0.4 sign-off closes. The cutoff window recorded in `version.json` is a planning anchor (start SHA === end SHA === v0.4 release tip) and will be revised with real provenance once v0.5 work lands.
