# OpenSpec reconciliation for 0.6.0

Date: 2026-10-13. Branch: `release/v0.6.0`.

This report records how the OpenSpec state was brought in line with the 0.6.0 implementation. Ground truth, in priority order: the code in `compiler/` (working tree), `docs/reports/2026-10-04-v06-decisions.md`, `docs/superpowers/specs/2026-10-04-beskid-v0-6-release-design.md`, `docs/reports/2026-10-11-v054-v06-overlap.md` and `docs/reports/2026-10-13-v06-release-case-binding-plan.md`.

The `v06-*` changes stay open. They are archived at release. The `v061-*` to `v065-*` changes belong to other work and are only reported here.

## 1. Changes archived on 2026-10-13

All archives were made with the OpenSpec CLI. The archive directories are `openspec/changes/archive/2026-10-13-<id>/`.

| Change | Classification | Evidence | Command |
| --- | --- | --- | --- |
| `zed-extension-sdk-parity` | Implemented | 15/15 tasks ticked; `editors/zed`; new capability `tooling--zed-extension--extension-surface` | `archive -y` |
| `extend-contract-system-generic-and-self` | Implemented | 29/33 tasks; `compiler/crates/beskid_queries/tests/semantic_facts/contract_specialization.rs` | `archive -y` |
| `complete-v0-4-corelib-runtime-contracts` | Implemented | Corelib uses `Result<unit, E>` across packages (for example `Core/FS/FS.bd` `WriteAllText`, `Delete`) | `archive -y` after the edit below |
| `add-v05-corelib-native-import-preflight` | Implemented | 5/7 tasks; Corelib native services pass the import preflight in `beskid_codegen/src/module_emission/imports.rs` | `archive -y` after the edit below |
| `add-reachability-scoped-semantic-legality-gate` | Implemented | 37/43 tasks; E1230, E1231, E2101 and E2102 in `beskid_analysis/src/analysis/diagnostic_kinds/code.rs`; tests `beskid_queries/tests/semantic_facts/scoped_cleanup.rs`, `dead_growth.rs`, `beskid_codegen/tests/isle_adapter/diagnostics_fail_closed.rs` | `archive -y` |
| `beskid-v0-5-foundations` | Implemented (shipped in 0.5.x; `tasks.md` was not maintained, 1/53 ticked) | Growable region heap and span allocator in `compiler/runtime/beskid/src/Runtime/Mem/Gc/*.bd`; `compiler/crates/beskid_engine/tests/native_kit/heap_growth_native.rs` | `archive -y` after the heap-cap reconcile below |
| `beskid-v0-5-networking` | Implemented (shipped in 0.5.x; 7/21 ticked) | `compiler/corelib/packages/network/src/Network/{Dns,Tcp,Udp,Types,Errors}.bd` | `archive -y` |
| `beskid-v0-5-http` | Implemented | 11/12 tasks; `compiler/corelib/packages/http/src/Http.bd` | `archive -y` |
| `add-beskid-glue-0-4` | Superseded by `v06-rust-glue-integration` | 0.6 Glue is the in-process checked C ABI owned path; the 0.4 attribute model is not the implementation | `archive -y --skip-specs` |
| `reconcile-glue-ffi-extern-0-5` | Superseded by `v06-rust-glue-integration` | 0/13 tasks; the 0.5 reconciliation was replaced by the 0.6 Glue design | `archive -y --skip-specs` |
| `extend-extern-import-extraction-glue-0-5` | Superseded by `v06-rust-glue-integration` | 0/12 tasks; Glue import extraction is owned by the 0.6 Glue path | `archive -y --skip-specs` |
| `complete-mod-pipeline-0-4` | Superseded by `v06-lsp-mod-host` and `v06-native-structural-emitter` | 1/29 tasks; the mod host and emitter are rebuilt in 0.6 | `archive -y --skip-specs` |
| `hir-free-isle-abi-v5-native-runtime` | Superseded by `v06-query-front-end` | 12/81 tasks; HIR removal finished through the query front end; `compiler/crates/beskid_analysis/src/types/` no longer exists | `archive -y --skip-specs` |
| `managed-aggregate-allocation-abi-v5` | Superseded | 1/41 tasks; allocation is specified by the region heap requirements that `beskid-v0-5-foundations` added | `archive -y --skip-specs` |
| `core-args-abi-v5` | Superseded | 3/10 tasks; its deltas describe an intermediate ABI-v5 state | `archive -y --skip-specs` |
| `align-native-executable-crt-entrypoint-abi-v5` | Abandoned | 1/11 tasks; no follow-up in the 0.6 documents | `archive -y --skip-specs` |
| `add-normative-manifest` | Abandoned | 0/13 tasks; no manifest chapters or route exist; the base spec remains (see section 3) | `archive -y --skip-specs` |
| `add-platform-spec-document-contexts` | Abandoned | 0/6 tasks; the platform-spec site was retired in favour of `/docs/standard/` | `archive -y --skip-specs` |
| `add-ste-compliance-policy` | Implemented (spec already in base) | 13/17 tasks; base capability `openspec/specs/standard-ste-compliance` already exists, so the deltas were not applied again | `archive -y --skip-specs` |
| `add-linux-package-derivative-provenance` | Implemented (release evidence only) | 2/2 tasks; it was a 0.5.2 release-evidence change and has no spec delta to apply | `archive -y --skip-specs` |
| `add-tracker-platform-delivery-sync` | Duplicate | The same change was already archived as `archive/2026-07-20-add-tracker-platform-delivery-sync`. The working copy had stale unticked tasks | `archive -y --skip-specs` |

Delta order: the heap-cap reconcile, then foundations, networking and HTTP. The legality gate was archived before `v06-function-values`, so that change's MODIFIED block applies on top of it.

### Edits made before archiving

- `complete-v0-4-corelib-runtime-contracts`: spelled the unit type `unit` (`Result<unit, E>`), as in the code. The base `core-fs` spec was corrected the same way.
- `add-v05-corelib-native-import-preflight`: removed the sentence that Glue is "fail-closed and deferred to v0.6". The requirement now says that user Glue imports fall under the Beskid Glue interop contract.
- Heap cap: `beskid-v0-5-foundations` specified a 1 GiB default cap and the host variable `BESKID_HEAP_MAX_BYTES`. The code has no default cap, and the runtime reads `BESKID_HEAP_MAX` in `ProcessInit` (`heap_growth_native.rs`: `heap_max_environment_caps_the_heap_at_process_init`). `v06-runtime-limits` now MODIFIES "Heap growth pacing and committed-size cap" (`BSP-REQ-539C3C627D46`) and "Diagnosable managed-heap exhaustion" (`BSP-REQ-8C1FA4687232`). The same corrected text is also in the base spec, so the base does not describe the removed variable before release.
- `v06-function-values`: folded the E1230, E1231 and E2101 to E2199 text from the legality gate into its MODIFIED D-COMP-SEM-0003 block, so archiving `v06-function-values` keeps that text.

## 2. v06 changes (open)

Each `v06-*` change was checked against the code. Tasks with evidence were ticked, and the remaining tasks stay unticked. The proposal, design and delta text was corrected where it disagreed with the implementation:

- Rust Glue is an in-process checked C ABI owned path.
- Fallible imports report failures through a checked scope.
- Foreign-thread release reports FOREIGN.
- The stdio bridge is in `v06-glue-stdio-bridge-provisional`.
- `Thread.Spawn` is removed.
- The runtime limits are `BESKID_HEAP_MAX` and `BESKID_FIBER_STACK_MAX`.
- Function values and qualified dependency paths ship.
- The query front end is the sole semantic authority, and the legacy TypeChecker is retired.

Fixes made to keep the deltas consistent with the base specs after the archives above:

- `v06-rust-glue-integration`: two requirements in `language-meta--type-system--types` ("Aggregate unit fields retain semantics without physical storage" and "Private canonical runtime helpers require verified corpus scope") changed from MODIFIED to ADDED. "Issued absolute shutdown deadlines" in `core-library--foundation-and-primitives--core-process` also changed from MODIFIED to ADDED. None of these existed in a base spec.
- Every MODIFIED, REMOVED and RENAMED header in the `v06-*` changes now matches a base requirement. No requirement is modified by two `v06-*` changes.

Known gaps are left unticked in the `v06-*` task lists: dynamic mapping DYN-06-03/04, `for` over iterators, CLI tasks 2.6 and 2.7, native emitter tasks 2.1 and 4.1, and the former MOD-06-07 to MOD-06-09 duplicate IDs, which are resolved: the typed-emitter IDs were renumbered to MOD-06-29 to MOD-06-33.

## 3. Normative specs corrected

- `core-library--concurrency--core-threading`, `execution--runtime--fiber-scheduler-and-stacks`, `execution--runtime--memory-and-gc-runtime-contract`, `compiler--semantic-pipeline--stage-ordering`, `language-meta--type-system--types` and `language-meta--conformance--glossary-and-conformance`: removed `Thread.Spawn` as a public surface, the normative stdio bridge, the TypeChecker as a conformance reference, and the Phase B opt-in switch. The 0.6 way to spawn is fiber `spawn`. CPU parallelism is planned in `v061-attributes-and-isolate-prerequisites` to `v065-parallel-sequences`.
- `core-library--concurrency--concurrency-package`: `Fiber<T>` declares no `OnCancelled` event. `compiler/corelib/packages/concurrency/src/Concurrency/Fiber.bd` has only `Join`, `Detach` and `Cancel`. `Cancel` records the reason and the canceling fiber, and `Join` returns `FiberError::Cancelled(reason, canceler)`. Decisions D-CORE-CONC-0002 and D-CORE-CONC-0011 were rewritten and renamed ("Fiber cancellation via Cancel and Join", "Fiber handle surface"). D-CORE-CONC-0008 now states that `ProcessorCount` is `1` in 0.6.0: `FiberProcessorCount` in `compiler/runtime/beskid/src/Runtime/Fiber/Fiber.bd` returns 1, and `SetProcessorCount` has no effect.
- `execution--runtime--channels-and-synchronization`: D-EXEC-RT-0013 no longer orders wakes after an `OnCancelled` event. Parked operations wake with `Cancelled(reason)`.
- `standard-normative-manifest`: the platform-spec site is replaced by the public Docs standard surface (`/docs/standard/`). The manifest was never built. The new change `v06-remove-normative-manifest` REMOVES all seven requirements and stays open with the v06 set. OpenSpec 1.6.0 will not apply a delta that leaves a spec without requirements (checked with a dry run on a copy of `openspec/`). At release, archive it with `--skip-specs`, then delete the capability directory and regenerate the catalog.
- `execution--runtime--memory-and-gc-runtime-contract`: D-EXEC-RT-0006 was renamed "Span-batched tri-color mark-sweep collection and barrier exports" (renamed again on 2026-10-13 after owner review: the collector is a marking collector; only its scheduling is non-incremental). `gc_collect` (`Runtime/Mem/Gc/Collection.bd`) sets the marking phase, marks roots, drains the mark queue, sweeps and returns to idle before the heap's mutator resumes, so collection is atomic with respect to that mutator. Generated code does not call `gc_write_barrier` for field stores. Array element stores call `beskid_rt_v5_array_write_barrier` (`Runtime/Data/Collections.bd`, referenced in `beskid_codegen/src/module_emission/orchestration.rs`). Both barrier exports remain for runtime code and native Mod adapters (`beskid_codegen/src/native_mod/c_codec.rs`), and `GcWriteBarrier` has no effect outside the marking phase. The foundations requirement "Span-queued marking and per-span sweep" and its scenario now say the same.
- `core-library--foundation-and-primitives--core-environment`: D-CORE-PRIM-0150 and D-CORE-PRIM-0151 now match `Core/Environment/Environment.bd` and `EnvironmentError.bd`. `Get` returns `Result<string, EnvironmentError>`, `TryGet` returns `Option<string>` and `Has` returns a bool. `Set` returns `Result<bool, EnvironmentError>` (`UnsupportedMutation(name, 0)` on host failure). There is no `Unset` and no `All()`. The variants are `InvalidName`, `NotFound` and `UnsupportedMutation`.
- New taxonomy areas `taxonomy--core-library--networking` and `taxonomy--tooling--zed-extension`. `validate-standard` requires a parent area for the feature capabilities that the networking, HTTP and Zed archives created.

Text inside the "Informative Source Provenance" sections was not changed. Those sections are hashed migration records that still mention `Thread.Spawn`, `OnCancelled`, `TypeChecker` and host logical CPUs.

## 4. Validation

With `/Users/mikserek/Projects/beskid/node_modules/.bin` (tsx 4.23.1, OpenSpec 1.6.0). The worktree has no `node_modules`, so `pnpm run` cannot find `tsx`.

- `tsx scripts/openspec/build-catalog.ts`: 206 capabilities, 662 requirements, revision `937894c5f816`.
- `tsx scripts/openspec/validate-standard.ts`: valid (206 capabilities, 662 requirements, 1042 archived source records, 3189 archived artifact hashes).
- `tsx scripts/openspec/validate-book-traceability.ts` and `validate-layouts.ts`: exit 0.
- `openspec validate --all --strict --no-interactive`: 227 passed, 0 failed (including `v06-remove-normative-manifest`). The `v061-*` to `v065-*` changes passed at the time of this run, but other agents are still editing them.

## 5. Open items

- The doc comment on `ProcessorCount` in `compiler/corelib/packages/concurrency/src/Concurrency.bd` still says "defaults to host logical CPUs". This is a code comment and outside this pass.
- The archives were run with the global OpenSpec CLI 1.4.1. Validation was run with the pinned 1.6.0.

## Release archive order (verified by dry run)

Verified on 2026-10-13 with OpenSpec 1.6.0 (`/Users/mikserek/Projects/beskid/node_modules/.bin/openspec`) on a copy of `openspec/`. Every archive succeeded. After each archive, a script compared the requirement headers and scenario names of every base spec before and after: no requirement was lost except those named in REMOVED or RENAMED blocks, and no scenario was dropped from a kept requirement. Run each command from the repository root:

1. `openspec archive v06-query-front-end -y`
2. `openspec archive v06-core-namespace -y`
3. `openspec archive v06-field-visibility -y`
4. `openspec archive v06-qualified-dependency-paths -y`
5. `openspec archive v06-function-values -y`
6. `openspec archive v06-native-structural-emitter -y`
7. `openspec archive v06-serialization-bsol -y`
8. `openspec archive v06-runtime-limits -y`
9. `openspec archive v06-remove-raw-thread-spawn -y`
10. `openspec archive v06-rust-glue-integration -y`
11. `openspec archive v06-glue-stdio-bridge-provisional -y`
12. `openspec archive v06-cli-dependencies -y`
13. `openspec archive v06-lsp-mod-host -y`
14. `openspec archive v06-release-qualification -y`
15. `openspec archive v06-remove-normative-manifest --skip-specs -y`, then delete `openspec/specs/standard-normative-manifest/` and regenerate the catalog
16. `openspec archive v061-attributes-and-isolate-prerequisites -y`
17. `openspec archive v061-glue-extensions -y`
18. `openspec archive v062-captures-and-move -y`
19. `openspec archive v063-isolates-and-scope -y`
20. `openspec archive v064-ports-and-pipelines -y`
21. `openspec archive v065-parallel-sequences -y`

Before this run, three changes had MODIFIED blocks that dropped base scenarios, and OpenSpec aborted their archives. They were rebased on the current base text:

- `v06-cli-dependencies`, "Stable CLI command families": the scenario "CLI06-03 Required families are present" now has the base name "Required families are present", and "Removed Hi command is rejected" is kept for the 0.6 CLI (exit status 2, no terminal UI).
- `v06-remove-raw-thread-spawn`, D-CORE-SYST-0001: keeps the stable ID, the legacy provenance lines and the scenario "Conformance exercises Decision".
- `v06-rust-glue-integration`, D-CORE-PRIM-0180: keeps the scenario "Conformance exercises Decision".
