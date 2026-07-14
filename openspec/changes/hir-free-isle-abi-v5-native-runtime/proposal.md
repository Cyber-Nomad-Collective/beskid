## Why

The current compiler still routes validated programs through HIR and a Rust-linked runtime, which duplicates semantic authority, permits cross-unit span/type drift, and blocks a deterministic native ABI. Beskid 0.4 needs one generation-safe AST/Salsa-to-ISLE-to-verified-CLIF path and one directly linked ABI-v5 runtime before release closure.

## What Changes

- **BREAKING** Remove HIR as a compiler, cache, LSP, and codegen contract; semantic facts are keyed only by generation-safe expanded-AST identities.
- **BREAKING** Replace Rust `Lowerable` dispatch with exhaustive generated ISLE rules that consume typed AST/Salsa facts and emit verifier-approved stock CLIF.
- **BREAKING** Replace legacy runtime dispatch, bridges, and Rust-linked runtime objects with direct `beskid_rt_v5_*` imports and target runtime kits generated from the authoritative runtime manifest.
- Compile the canonical Beskid runtime through the same frontend and codegen path as applications, with only context initialization and switching implemented in target assembly.
- Complete the canonical runtime corpus (lifecycle, GC, roots, collections, strings, scheduler, composition, clocks, callbacks, and target OS adapters) before any ABI-v5 kit is releasable.
- Make JIT, AOT, installed toolchains, and release bundles validate the same ABI metadata, hashes, target, and profile.
- Require debug and release static/shared installed-prefix smokes on all three supported target lanes, with binary provenance and allowlist audits.
- Delete compatibility fallbacks only after every consumer is migrated; make HIR, `Lowerable`, bridge/host/runtime linkage, and ABI dispatch scans release-blocking.
- Preserve existing public `/platform-spec/` routes through the OpenSpec catalog; no legacy URL migration is required.
- Stage rollout behind contract, coverage, verifier, runtime-kit, and installed-prefix gates. Rollback is a whole-toolchain rollback to the last ABI-v4 bundle; mixed ABI-v4/v5 components are rejected.

## Capabilities

### New Capabilities

- `compiler--codegen-and-ir--isle-lowering-contract`: Exhaustive typed-operation inventory, generated ISLE selection, stock CLIF emission, and mandatory verification.
- `execution--runtime--native-runtime-kit`: Manifest-authoritative ABI-v5 runtime artifacts, target assembly boundary, validation, and installation layout.

### Modified Capabilities

- `compiler--front-end--hir-normalization-and-legality`: Replace HIR normalization authority with expanded-AST semantic facts and legality queries.
- `compiler--semantic-pipeline--type-system-pass-contract`: Replace typed-HIR results with generation-safe Salsa facts and `TypedProgram`.
- `compiler--build-pipeline--program-assembly`: Make expanded source units and immutable semantic identities the assembly-to-codegen contract.
- `compiler--build-pipeline--stage-ordering`: Establish the single AST/Salsa to ISLE to verified-CLIF stage order.
- `compiler--codegen-and-ir--lowering-contract`: Replace HIR inputs and Rust lowering fallbacks with `CodegenInput` and generated rules.
- `execution--abi-and-host--abi-versioning-and-compatibility`: Require direct ABI-v5 calls, exact manifest allowlists, and whole-kit compatibility.

## Impact

This affects `beskid_analysis`, `beskid_queries`, `beskid_codegen`, the new ISLE rule crate, JIT/AOT entry points, `beskid_abi`, runtime and bridge crates, LSP document services, corelib runtime sources, runtime-kit tooling, installers, CI, and release manifests. HIR artifacts and Rust runtime provenance become release-blocking retired patterns. The change supports only little-endian 64-bit `x86_64-unknown-linux-gnu`, `aarch64-apple-darwin`, and `x86_64-pc-windows-msvc` runtime kits.
