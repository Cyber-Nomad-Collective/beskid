# Agent B - Runtime Implementation and Target Kit Matrix

## Scope
Complete canonical runtime implementation in Beskid source (GC, strings, collections, scheduler) and build/validate the three-target ABI-v5 runtime-kit matrix (Linux x86-64, macOS arm64, Windows x86-64).

## Issues (11)

| ID | Pri | Title | Dependencies |
|----|-----|-------|--------------|
| CYB-29 | Urgent | Allocator, roots, barriers, mark/sweep GC | - |
| CYB-30 | Urgent | Canonical strings and collections | CYB-29 |
| CYB-31 | Urgent | Scheduler, concurrency, callbacks | CYB-29 |
| CYB-66 | Urgent | Migrate corelib, CLI, installers, release bundles | - |
| CYB-83 | Urgent | Validate canonical runtime-kit target/profile matrix | - |
| CYB-33 | Urgent | macOS arm64 debug/release runtime kits (In Progress) | - |
| CYB-34 | Urgent | Windows x86-64 debug/release runtime kits (In Progress) | - |
| CYB-170 | High | macOS arm64 debug/release runtime kits (Backlog) | - |
| CYB-171 | High | Windows x86-64 debug/release runtime kits (Backlog) | - |
| CYB-175 | Medium | macOS arm64 empty-prefix JIT+AOT smoke | CYB-33 or 170 |
| CYB-176 | Medium | Windows x86-64 empty-prefix JIT+AOT smoke | CYB-34 or 171 |

## Note on Duplicates
CYB-33/34 and CYB-170/171 appear to be duplicate pairs. CYB-33/34 are In Progress (older). CYB-170/171 are Backlog (newer). Reconcile: close one set as duplicate.

## Serial Chain (runtime implementation)
1. CYB-29: Implement object headers, alignment, root-frame registration, write barriers, mark worklist, sweep/free-list, OOM/trap handling in Beskid source. 13 points.
2. CYB-30: Implement canonical strings and core collections using ABI-v5 layouts and GC barriers. 8 points.
3. CYB-31: Implement scheduler, concurrency primitives, task lifecycle, callback dispatch, clocks. 13 points.

## Parallel Tasks
- CYB-66: Migrate corelib facilities, CLI commands, installers, and release bundles to sole CodegenInput + exact validated ABI-v5 kit route. 8 points.
- CYB-83: Validate full target/profile matrix: Linux/macOS/Windows x debug/release x static/shared. Mismatched architecture/profile/hash/capability must fail closed.

## Kit Build + Smoke (after matrix validation)
- CYB-33 (or 170): Build macOS arm64 static/shared debug+release ABI-v5 kits. Generate manifests/hashes. Run JIT/AOT smokes. Audit Mach-O symbols.
- CYB-34 (or 171): Build Windows x86-64 static/shared debug+release ABI-v5 kits. Handle COFF import library. Run JIT/AOT smokes. Audit PE/COFF symbols.
- CYB-175: macOS arm64 empty-prefix JIT+AOT smoke (depends on kit build).
- CYB-176: Windows x86-64 empty-prefix JIT+AOT smoke (depends on kit build).

## Verification
  cd compiler
  cargo test -p beskid_runtime --all-targets
  cargo test -p beskid_aot --all-targets
  BESKID_RUNTIME_PREFIX=target/native-runtime-kit BESKID_RUNTIME_KIT_PROFILE=release ./target/release/beskid_cli test --project corelib_tests.bproj --plain

## Key Files
- compiler/runtime/beskid/src/ - canonical runtime source (Beskid)
- compiler/runtime_manifest.bsol - ABI-v5 manifest
- compiler/crates/beskid_aot/src/ - kit resolver, validation
- compiler/crates/beskid_tools/src/ - kit builder, publication
- compiler/scripts/verify-hir-free-abi-v5.sh - provenance gate

## Acceptance
- GC suites pass without Rust runtime linkage
- String/collection suites pass
- Scheduler/concurrency suites pass on all supported hosts
- Three-target matrix: every cell passes, exports match allowlist
- Empty-prefix JIT/AOT smokes pass for all three targets
- No legacy dispatch or fallback reachable
