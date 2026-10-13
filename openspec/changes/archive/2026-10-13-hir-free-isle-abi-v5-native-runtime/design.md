## Context

Beskid currently has two semantic representations (expanded AST and HIR), multiple lowering entry points, and runtime code split across Rust crates, bridges, and corelib. The duplication caused cross-unit node/span drift and makes generated programs depend on compiler-host implementation details. The approved architecture is expanded AST plus generation-safe Salsa facts, generated ISLE selection, verified stock CLIF, and a manifest-authoritative ABI-v5 Beskid runtime.

Stakeholders are compiler, LSP, runtime, corelib, packaging, and release engineering. The migration must keep one implementation per construct, remain AOT-only, and produce coherent toolchain bundles for the three supported targets.

## Goals / Non-Goals

**Goals:**

- Make `AstNodeKey { unit, generation, node }` the only cross-query syntax identity.
- Make `TypedProgram` and `CodegenInput` the only analysis-to-codegen contracts.
- Cover each typed operation with exactly one generated ISLE rule and verify every emitted CLIF function.
- Make `runtime_manifest.bsol` the sole ABI symbol authority and call `beskid_rt_v5_*` exports directly.
- Compile one canonical Beskid runtime into validated debug/release runtime kits; limit target assembly to context init/switch.
- Delete HIR, Rust lowering, runtime bridge/fallback, and legacy ABI paths once replacement gates pass.

**Non-Goals:**

- Supporting ABI-v4/v5 component mixing or in-process compatibility adapters.
- Adding targets beyond Linux x86-64, macOS arm64, and Windows x86-64.
- Introducing a second IR, custom Cranelift fork, interpreter, or non-AOT production path.

## Decisions

1. **Expanded syntax is the semantic source of truth.** Salsa inputs own immutable expanded units and monotonic generations. Queries return no fact for stale or foreign keys. This avoids source-offset identity and HIR remapping. Keeping HIR as a temporary adapter was rejected because it preserves duplicate authority.
2. **Generated ISLE is the sole operation selector.** A generated typed-operation inventory is compared bijectively with rule declarations. Rust retains only database access, builder/module lifetime management, target metadata, and stock CLIF constructors. Parallel Rust `match` fallbacks were rejected because their coverage drifts.
3. **CLIF verification is part of lowering success.** Every function runs the stock verifier before it enters a codegen artifact. Verifier failure carries the originating AST span and fails compilation.
4. **ABI v5 is direct and manifest-authoritative.** Generated code imports versioned symbols directly. `runtime_manifest.bsol` generates exact import/export allowlists, layouts, traps, and hashes. Dispatch envelopes and registration tables were rejected because they hide signature drift.
5. **The runtime is Beskid plus two assembly exports.** Trusted runtime intrinsics require an unforgeable compiler capability bound to canonical runtime package identity. Assembly exports only `beskid_arch_v5_context_init` and `beskid_arch_v5_context_switch`; all lifecycle and data semantics remain Beskid.
6. **Runtime kits are coherent units.** JIT and AOT resolve exact target/profile kits and validate metadata before loading/linking. Object-only output intentionally remains unlinked. A loose archive search path was rejected because it permits mixed versions.
7. **Observability is stage-based.** Existing compiler tracing records source unit, generation, typed operation, ISLE rule, CLIF verification, ABI manifest hash, target, profile, and runtime-kit hash without recording source contents or secrets.
8. **Security boundary is capability plus allowlists.** User packages cannot obtain trusted runtime facts; application imports, runtime exports, platform imports, and assembly exports must exactly match generated allowlists.
9. **Canonical scheduler state is ABI-owned.** Scheduler state is allocated separately and stored through the manifest-declared runtime-state field. Fiber contexts and stacks are target-derived allocations; no fixed-size inline record or synthetic runtime-state offset is permitted. Context initialization and switching remain the two trusted assembly exports, callable only by canonical runtime lowering.

Deleted legacy paths: HIR types/lowering/normalization/indexing/serialization/caches; codegen `Lowerable` implementations; legacy single-unit lowering; Rust runtime, host, bridge, Abfall/corosensei objects in produced programs; dispatch tags/envelopes/handler registration; ABI adapters and fallback kit lookup.

## Risks / Trade-offs

- **Broad compiler blast radius** → isolate frontend, codegen, and runtime work; require red-green contract slices and whole-workspace integration gates.
- **Incomplete semantic fact coverage** → unavailable facts fail explicitly with a source span; no positional guesses or HIR fallback.
- **ISLE rule drift** → generate inventory and fail builds on missing or duplicate coverage.
- **Target ABI mismatch** → validate exact layouts, calling conventions, symbols, and hashes before execution or link.
- **Bootstrap cycle for the Beskid runtime** → maintain one explicitly versioned bootstrap kit only until the canonical runtime self-build is reproducible, then delete it in the same migration.
- **Rollback requires coordinated artifacts** → publish immutable three-target bundles before rolling aliases; roll back the whole toolchain, never individual ABI components.

## Migration Plan

1. Validate generation-safe syntax and ABI-v5 contracts.
2. Introduce semantic facts, typed-program/codegen input, ISLE compiler, runtime manifest, and runtime-kit metadata behind tests.
3. Migrate frontend/LSP, codegen, runtime, JIT/AOT, and distribution consumers one domain at a time.
4. Delete retired HIR, Rust-lowering/runtime, bridge, and compatibility paths.
5. Verify all workspace, corelib, LSP, package, installed-prefix, retired-pattern, provenance, and three-target gates.
6. Promote immutable bundles and then rolling aliases. Rollback selects the last complete ABI-v4 toolchain bundle.

## Open Questions

- None for the architectural boundary. Platform-specific unwind metadata and signing details remain implementation tasks constrained by existing target packaging specifications.
