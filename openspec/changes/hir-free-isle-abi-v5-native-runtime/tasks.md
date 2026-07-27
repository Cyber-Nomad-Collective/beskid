## 1. Validate contracts and baseline

- [x] 1.1 Add generation-safe AST/Salsa identities, semantic query signatures, and stale-generation contract tests
- [x] 1.2 Add ABI-v5 manifest, target, layout, trap, assembly, and runtime-kit metadata contract tests
- [x] 1.3 Record the full compiler workspace baseline and first runtime-kit hermeticity failure
- [ ] 1.4 Add retired-pattern and runtime-provenance scans that fail on active HIR or Rust runtime linkage

## 2. Introduce replacement authorities

- [x] 2.1 Complete indexed expanded-AST semantic facts for resolution, typing, calls, casts, control flow, captures, legality, spans, bodies, and reachability
- [x] 2.2 Add `TypedProgram` construction and the sole `CodegenInput` boundary for project assemblies
- [ ] 2.3 Complete the generated typed-operation inventory and exhaustive ISLE rule compiler
- [x] 2.4 Require stock CLIF verification with originating AST spans for every generated function
- [x] 2.5 Generate exact ABI-v5 allowlists, layouts, traps, and deterministic hashes from `runtime_manifest.bsol`
- [ ] 2.6 Implement canonical Beskid runtime modules and the two target assembly context exports
- [ ] 2.7 Implement runtime-kit build, validation, and exact installed-prefix discovery for all targets and profiles

## 3. Migrate consumers

- [ ] 3.1 Migrate frontend services and project assembly from HIR units to expanded syntax plus Salsa facts
- [ ] 3.2 Migrate LSP document, hover, definition, references, completion, diagnostics, and refresh paths to syntax indexes and semantic queries
- [ ] 3.3 Migrate all codegen expressions, statements, calls, memory operations, control flow, items, and intrinsics to generated ISLE rules
- [ ] 3.4 Migrate JIT and AOT to the same `CodegenInput` and validated ABI-v5 runtime kits
- [ ] 3.5 Migrate corelib runtime facilities to canonical Beskid sources and trusted runtime intrinsic facts
- [ ] 3.6 Migrate CLI, installers, and release bundles to coherent three-target ABI-v5 toolchains

## 4. Delete legacy paths

- [ ] 4.1 Delete HIR types, lowering, normalization, indexing, serialization, caches, adapters, and derives
- [ ] 4.2 Delete Rust `Lowerable` implementations and all legacy/single-unit codegen entry points
- [ ] 4.3 Delete Rust runtime, host, bridge, fallback, Abfall, corosensei, panic, and unwind objects from produced programs
- [ ] 4.4 Delete legacy ABI dispatch, envelopes, registration, adapters, and fallback runtime-kit lookup
- [ ] 4.5 Remove obsolete dependencies, features, generated artifacts, and compatibility documentation

## 5. Verify and release

- [ ] 5.1 Pass analysis, query, document, LSP, codegen, JIT, AOT, runtime, corelib, and full compiler workspace tests
- [ ] 5.2 Pass ISLE coverage, CLIF verifier, ABI allowlist/layout/trap/hash, runtime capability, GC, scheduler, collection, and assembly preservation tests
- [ ] 5.3 Pass debug/release installed-prefix smokes on Linux x86-64, macOS arm64, and Windows x86-64
- [ ] 5.4 Pass retired-pattern, runtime Rust-provenance, dependency, actionlint, package-content, and distribution-order gates
- [ ] 5.5 Update GUIDE, GLOSSARY, CHANGELOG, OpenSpec catalog, implementation anchors, and release-closure evidence
- [ ] 5.6 Run GitNexus changed-scope analysis and whole-branch review before integration

## 6. 0.4 release-closure execution waves

The detailed dependency-ordered execution record is `docs/superpowers/plans/2026-07-14-0.4-release-closure.md`. Items in this section are intentionally unchecked until their listed fresh acceptance commands are recorded in release evidence.

The 2026-07-20 readiness audit is recorded in `docs/superpowers/reports/2026-07-20-0.4-readiness-baseline.md`. Compiler `79eccbd` closes task 2.4 and CYB-14: `FunctionEmissionError::Verification` retains the originating AST site, canonical database-aware rendering includes path, generation/node identity, construct, and range, and a multi-function `lower_syntax_program` regression proves module-level attribution. Fresh rebased gates passed 108 tests with one intentionally isolated child ignored. CYB-5 and CYB-15 remain open because the broader parsed-project no-legacy acceptance harness is not yet complete.

- [x] 6.1 Production adapter: compile an actual expanded-syntax `TypedProgram` through `CodegenInput` and ISLE to verified CLIF without HIR or `Lowerable`; run `cargo test -p beskid_codegen --all-targets` and `cargo test -p beskid_isle --all-targets`.
- [x] 6.2 Semantic-fact closure: land generation-safe captures, spawn, trusted runtime intrinsics, diagnostics, and spans; run `cargo test -p beskid_queries --tests -- --test-threads=1`.
- [ ] 6.3 AOT exact-kit closure: remove prebuilt/standalone and fallback runtime-kit compatibility; run `cargo test -p beskid_aot --all-targets`.
- [ ] 6.4 Migrate remaining codegen and LSP consumers after 6.1–6.2; run ISLE/codegen/LSP focused suites and record results.
- [ ] 6.5 Finish canonical runtime corpus and installed-prefix debug/release smokes across the three supported targets.
- [ ] 6.6 Delete HIR, legacy lowering, Rust bridge/host/runtime linkage, ABI dispatch, and obsolete dependencies after their callers are migrated; make retired-pattern and binary-provenance audits green.
- [ ] 6.7 Run fresh workspace, corelib, package, documentation, GitNexus changed-scope, and whole-branch review gates; record evidence before release sign-off.

### 6.8 Canonical runtime completion and kit matrix

- [ ] 6.8.1 Implement canonical Beskid lifecycle, traps, TLS, allocation, non-moving mark/sweep GC, root frames/barriers, strings, collections, scheduler/concurrency, composition, clocks, callbacks, and target OS adapters; add capability and untrusted-intrinsic denial tests.
- [x] 6.8.1b Define and enforce the canonical `gc_external_root_count` contract: one registry-backed C-ABI export, distinct from temporary handles, with 0→1→0 lifecycle coverage.
- [x] 6.8.1a Add the trusted canonical-runtime intrinsic declaration/call surface, including `pointer`, `word`, and `never`, and lower it through Salsa facts and ISLE; map ABI `usize` to source `word` and prove that user packages cannot declare or invoke it.
- [ ] 6.8.1c Implement the canonical scheduler from ABI-owned state and target-derived contexts/stacks; prove syntax-to-ISLE spawn/yield/join behavior, Phase-A safepoints, and main-fiber shutdown before claiming a supported target.
- [ ] 6.8.1d Replace undeclared synchronization backing offsets with owned canonical channel, mutex, waitgroup, hub, event, and callback state; prove bounds, park/wake/cancel semantics, and production lowering coverage.
- [ ] 6.8.2 Compile canonical runtime sources through `TypedProgram` → `CodegenInput` → ISLE → verified CLIF; reject any alternate HIR or Rust-runtime build path.
- [ ] 6.8.3 Produce static/shared debug and release kits for Linux x86-64, macOS arm64, and Windows x86-64 at the installed ABI-v5 layout; run JIT and AOT empty-prefix smokes for every matrix cell.

### 6.9 Complete consumer migration before deletion

- [ ] 6.9.1 Expand the production syntax-fact adapter and ISLE inventory to all expressions, statements, calls, locals, memory, control flow, items, aggregates, closures/captures, spawn, trusted intrinsics, and span diagnostics; enforce a bijective inventory test.
- [ ] 6.9.1a Add fail-closed AST/Salsa and ISLE lowering for explicit primitive numeric conversion calls, including canonical runtime coverage.
- [ ] 6.9.2 Migrate every LSP feature (hover, definition, references, completion, diagnostics, refresh) and CLI/frontend service to syntax indexes plus Salsa facts; each feature needs a regression without a legacy analysis snapshot.
- [ ] 6.9.3 Migrate JIT, AOT, corelib, installers, and release bundles to the sole `CodegenInput` plus exact validated runtime-kit route; retain deliberately unlinked object-only output only.

### 6.10 Retirement, provenance, and sign-off

- [ ] 6.10.1 Delete HIR, normalization, legacy lowering, `Lowerable`, bridge/host/Rust runtime, dispatch, envelope, fallback, and obsolete dependency paths once 6.9 callers are migrated.
- [ ] 6.10.2 Make `verify-hir-free-abi-v5.sh`, dependency inspection, and per-artifact binary provenance/allowlist audits report zero violations; use only an explicit reviewed fixture allowlist.
- [ ] 6.10.3 Record fresh focused tests, full workspace/corelib tests, matrix smokes, package/actionlint checks, GitNexus changed-scope analysis, whole-branch review, and documentation evidence before marking the change or 0.4 release complete.
