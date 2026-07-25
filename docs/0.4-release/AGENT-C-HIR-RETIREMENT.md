# Agent C - HIR Retirement and Legacy Removal

## Scope
Delete all HIR model, lowering, normalization, caches, adapters, and legacy codegen entry points after all ISLE lowering gaps (Agent A) are closed. Add compile-fail guards preventing reintroduction.

## Prerequisites
Cannot start until Agent A completes all 12 ISLE lowering issues. Every production consumer must have migrated to syntax/Salsa facts before HIR can be deleted.

## Issues (5)

| ID | Pri | Title | Dependencies |
|----|-----|-------|--------------|
| CYB-84 | Urgent | Delete HIR model, normalization, legacy lowering | All Agent A |
| CYB-35 | Urgent | Delete HIR model, lowering and caches | CYB-84 |
| CYB-36 | Urgent | Delete Lowerable and legacy codegen entry points | CYB-35 |
| CYB-86 | Urgent | Remove legacy ABI dispatch and compatibility resolver | CYB-36 |
| CYB-67 | Urgent | Remove obsolete dependencies, features, artifacts | CYB-86 |

## Serial Chain (strict order)
1. CYB-84: Delete HIR types, normalization, indexing, serialization, caches, adapters, derives. Use retirement scan to enumerate active references. Remove one isolated dependency cluster at a time. Replace test fixtures with syntax/Salsa equivalents.
2. CYB-35: Delete HIR model, lowering and caches (8 points). Workspace must compile. Focused suites must pass. No active HIR symbol remains.
3. CYB-36: Delete Lowerable implementations, single-unit codegen entry points, HIR linker adapters. Make CodegenInput the only public project-assembly boundary. Add compile-fail/API-surface checks.
4. CYB-86: Delete legacy ABI dispatch, envelopes, registration adapters, fallback runtime-kit lookup. Make ABI-v5 manifest validation and exact installed-prefix discovery the sole route. Remove compatibility flags/configuration.
5. CYB-67: Remove obsolete dependencies, Cargo features, generated artifacts, compatibility documentation. Produce reviewed inventory. Clean Cargo.lock.

## Verification
  cd compiler
  cargo check --workspace
  cargo test --workspace --all-targets
  bash scripts/verify-hir-free-abi-v5.sh
  cargo test -p beskid_codegen --test hir_free_guard

## Key Files
- compiler/crates/beskid_hir/ - HIR model (to be deleted)
- compiler/crates/beskid_codegen/src/services.rs - retired LoweredProgram facade
- compiler/crates/beskid_codegen/src/lib.rs - Lowerable re-export
- compiler/crates/beskid_analysis/src/hir/ - HIR normalization
- compiler/crates/beskid_aot/src/ - legacy linker adapters
- compiler/Cargo.toml - dependency cleanup
- compiler/scripts/verify-hir-free-abi-v5.sh - retirement gate

## Acceptance
- No production HIR model/lowering/normalization/caches or Lowerable imports
- Compiler compile-fail guard prevents reintroduction
- Full workspace tests pass
- HIR-free verifier reports zero deprecated fallback reachability
- No obsolete dependencies remain in Cargo.lock
- No compatibility aliases or fallback branches reachable
