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
  - [ ] 6.8.1c.0 Define and implement the scheduler-owned `void(pointer)` entry wrapper and non-resumable return trampoline that preserve the generated `i64` fiber result without casting it to the manifest context-entry ABI.
  - [x] 6.8.1c.0a Add the typed, canonical-runtime-only `fn(pointer) -> i64` indirect-call fact and ISLE lowering required by the scheduler entry wrapper; reject raw pointer/word casts and untrusted invocation.
  - [ ] 6.8.1c.1 Derive per-fiber context allocation and initialization from the selected manifest target; admit only the two manifest-declared assembly context exports and reject fixed-size or undeclared-offset storage.
  - [ ] 6.8.1c.2 Implement guarded 64 KiB initial stacks with a hard 8 MiB usable cap, stack-overflow status `3`, and bounds/guard regression coverage.
  - [ ] 6.8.1c.3 Implement the one canonical lifecycle for fiber 0 plus opaque fresh handles, spawn, cancel-slot spawn, yield/resume, cancel, detach, current-id, join-status, and join-value; prove the `0`/`1`/`2`/`3`/`4` status mapping, stale-handle denial, status/value truth, and one scheduler owner through syntax-to-ISLE verified CLIF.
    - [ ] 6.8.1c.3a Implement the Fibers 0.1.13 compatibility surface: deterministic in-place poll executor, one-unit `run_once`, ready/not-ready wake registration, truthful monitor result/error, linked cancellation on final link drop, and stackful-yield compatibility mapping without a second scheduler or runtime fallback.
      - [ ] 6.8.1c.3a.1 Add the exact phase-one poll-entry and executor ABI exports, tags, generation-checked opaque task/monitor/link identities, and manifest/generated-contract/source-authority tests; reject undeclared or copied-source poll entry operations before code generation.
      - [ ] 6.8.1c.3a.2 Implement the canonical scheduler-owned FIFO poll queue and coalesced wake state; prove `run_once` `ran`/`waiting`/`complete`/`fatal` tags, at-most-once polling, stale/foreign/terminal wake denial, and verified-CLIF lowering with no host/Rust/global executor.
      - [ ] 6.8.1c.3a.3 Implement monitor observation ownership and opaque result/error publication; prove pending/result/error/cancelled/panicked/stale monitor tags, result-slot write discipline, stale-handle denial, and no cancellation on monitor drop.
      - [ ] 6.8.1c.3a.4 Implement link reference ownership; prove clone/drop accounting, cancellation only on final live-link drop of a non-detached child, detached-child isolation, no fabricated terminal value, and one canonical cancellation path.
      - [ ] 6.8.1c.3a.5 Add installed-kit Linux x86-64 executable poll-executor coverage for ready/pending/wake/monitor/link cancellation plus provenance/allowlist audits; add a separately target-gated reactor adapter only after phase-one has no host polling fallback.
  - [ ] 6.8.1c.4 Implement Phase-A scheduler ownership, live-stack safepoint enumeration, and main shutdown joins for non-detached children; prove blocking workers do not execute Beskid mutator code.
  - [ ] 6.8.1c.5 Pass the Linux x86-64 installed-kit executable scheduler lifecycle, context-contract, allowlist, and forbidden-provenance gate before claiming Linux scheduler support; repeat independently for macOS arm64 and Windows x86-64 before claiming either target.
- [ ] 6.8.1d Replace undeclared synchronization backing offsets with owned canonical channel, mutex, waitgroup, hub, event, and callback state; prove bounds, park/wake/cancel semantics, and production lowering coverage.
  - [ ] 6.8.1d.1 Implement a scheduler-owned Hub registry with at least 256 registrations, stable replacement/removal order, deterministic round-robin cursor advancement, canonical empty/not-found results, and result publication before cooperative wake.
  - [ ] 6.8.1d.2 Implement lazily allocated field-owned Event subscription state with resolved field capacity, stable first-match unsubscribe, ordered access and raising-fiber invocation; reject global tables and literal runtime-state offsets.
  - [ ] 6.8.1d.3 Add syntax-fact → ISLE → verified-CLIF, canonical-source, installed-kit, bounds/sentinel, scheduler park/wake/cancel, and artifact-provenance tests for Hub and Event; delete HIR, Rust runtime, generated dispatch, and bridge fallbacks once those tests pass.
  - [ ] 6.8.1d.4 Replace callback literal runtime-state offsets and process-global registration tables with a manifest-declared, separately allocated per-runtime callback/handler registry; define atomic validation-and-publication, replacement, invalid-table, and non-aliasing behavior.
  - [ ] 6.8.1d.5 Implement canonical callback and handler registration plus re-entrant trampoline scope entry; remove the no-op handler registration path and reject stale, detached, or unregistered callback targets fail-closed.
  - [ ] 6.8.1d.6 Add syntax-fact → ISLE → verified-CLIF, canonical-source, bounds/sentinel, nested-entry, exact installed-kit, and artifact-provenance tests for Callback; reject HIR, Rust runtime/bridge callback objects, generated dispatch, legacy envelopes/tags, and host fallbacks.
- [ ] 6.8.1e Replace canonical composition sentinel/no-op exports with compiler-frozen plan activation, container-owned state, fiber-local scope state, deterministic disposal, and fail-closed stale/unknown behavior.
  - [ ] 6.8.1e.1 Materialize validated composition snapshot registrations, singular/plural bindings, startup order, and disposal order through canonical `Runtime/Host/Composition.bd`; reject fabricated null containers, fabricated statuses, dynamic service discovery, and process-global registry state.
  - [ ] 6.8.1e.2 Implement per-container and fiber-local nested scope ownership from the validated scope tree; prove plan-order resolution, cross-fiber non-aliasing, balanced enter/leave on normal and failure paths, one-time reverse teardown, and stale-handle denial.
  - [ ] 6.8.1e.3 Lower `launch`, `with`, and field/singular/plural injection only from generation-bound composition facts through `CodegenInput` → ISLE → verified CLIF; reject stale/foreign/unresolved facts and HIR composition lowering.
  - [ ] 6.8.1e.4 Add canonical-source, manifest-signature, syntax-fact → ISLE, verifier, installed-kit AOT/JIT behavior, deterministic ordering, scope/failure, and binary-provenance tests; remove Rust composition container, host/bridge fallback, legacy dispatch, and unapproved composition imports once those tests pass.
- [ ] 6.8.1f Replace the canonical Process environment, filesystem, and terminal placeholder exports with manifest-owned target adapters and fail-closed normalized outcomes.
  - [ ] 6.8.1f.0 Define the manifest-owned intrinsic-to-target adapter-binding model before declaring or implementing Process imports; it SHALL cover Process lifecycle (`process_exit`, `process_getpid`) and environment/filesystem/terminal adapters, distinguish empty strings from unavailable scratch-owned data, and reject inferred flat-import bindings.
    - [ ] 6.8.1f.0a Generate and validate one explicit per-target lifecycle binding for `process_exit` and `process_getpid`, including canonical intrinsic, ABI-v5 symbol, `runtime.adapter.*` capability, exact signature, selected adapter implementation, and ordered allowed OS imports; reject missing, duplicate, orphaned, unavailable-symbol, or signature/capability-mismatched bindings before link/load.
    - [ ] 6.8.1f.0b Define and test the Process lifecycle boundary: canonical `ProcessExit` has no continuation, `ProcessGetpid` has its exact `i32` result, only compiler-embedded runtime source has authority, and missing/unsupported lifecycle adapters fail closed without dispatch, extern, fabricated result, or process-global fallback.
    - [ ] 6.8.1f.0c Add manifest-generation, runtime-kit validation, canonical syntax-fact → ISLE → verified-CLIF, untrusted-invocation denial, selected-target import allowlist, and installed-kit provenance gates for the lifecycle bindings before any Process lifecycle target is claimed.
  - [ ] 6.8.1f.1 Declare `env_get`, `env_set`, `env_getcwd`, `fs_read_text`, `fs_write_text`, `fs_exists`, `fs_mkdir`, `fs_delete`, and `tty_winsize` exactly once in `runtime_manifest.bsol`, with ABI-v5 symbol, `runtime.adapter.*` capability, exact signature, and each selected target import; regenerate the authoritative ABI artifacts.
  - [ ] 6.8.1f.2 Implement `Runtime/Host/Process.bd` as direct canonical wrappers only; remove fabricated null, false, and no-op outcomes plus legacy dispatch, extern, and process-global fallbacks; make missing authority, null required input, unsupported targets, and target-adapter failure fail closed.
  - [ ] 6.8.1f.3 Add canonical-source, manifest-signature, untrusted-intrinsic denial, normalized unavailable/status, syntax-fact → ISLE → verified-CLIF span provenance, installed-kit AOT/JIT, three-target import, and binary-provenance tests; reject Rust host/bridge and generated dispatch provenance.
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
