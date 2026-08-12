# CYB-190: authoritative beskid 0.4 release boundary

Date: 2026-08-11

Research revision: root `0733294b3f07269182b38e610bf4646889ce61c1`, compiler `8bbdb593208bfd5e8ecb7df04aba07ddbc50b498`, Corelib `9ca06db4c052148e0348e101d476af5b1a160dca`

Linear inventory captured: 2026-08-11

Scope: the 40 unresolved `release/0.4` issues explicitly related from [Establish the authoritative 0.4 release boundary and disposition every unresolved item](https://linear.app/cybernomad-it/issue/CYB-190/establish-the-authoritative-04-release-boundary-and-disposition-every), plus obligations missing from that baseline.

## Resolution

The 0.4 boundary is the union of:

1. accepted, still-active OpenSpec 0.4 changes and their unchecked release ledger;
2. Tracker `v0.4` delivery state; and
3. fresh release-gate evidence at one exact candidate revision.

Linear status is a projection, not evidence. Tracker says this directly: v0.4 remains an in-progress delivery candidate, the OpenSpec ledger and fresh commands govern completion, and its historical cutoff is not sign-off evidence (`beskid_tracker/data/v0.4/version.json:2-13`). The Corelib deliverable records the current authoritative baseline as 20/61, with rooted collections, host-backed FS, per-artifact verification, and native three-platform proof incomplete (`beskid_tracker/data/v0.4/deliverables/v04-corelib-complete.json:2-4`).

The release is therefore **not close to sign-off**. The 40 baseline items reduce to:

- 28 required implementation/evidence owners or rollups;
- 7 duplicate/superseded issue records to close or convert to links;
- 2 items beyond the 0.4 destination;
- 3 stale failure tickets that need focused re-verification before closure, not speculative duplicate implementation.

The existing 40-item baseline is also incomplete. It omits active normative Core.Args, scheduler, synchronization/callback, composition, Process/adapter, numeric-conversion, and platform-delivery obligations listed below.

## Authority and fresh facts

| Fact | Primary authority/evidence | Consequence |
|---|---|---|
| OpenSpec, not issue status, governs observable behavior. | `openspec/changes/hir-free-isle-abi-v5-native-runtime/tasks.md:3-111`; `openspec/changes/complete-v0-4-corelib-runtime-contracts/tasks.md:3-75` | Unchecked requirements remain release work even when a Linear parent is Done. |
| HIR/runtime retirement is not complete. | `bash compiler/scripts/verify-hir-free-abi-v5.sh` at the revisions above failed and reported live `Lowerable`, HIR, `beskid_runtime`, `beskid_host`, legacy dispatch, and retired dependencies. Examples include `compiler/crates/beskid_codegen/src/lowering/lowerable.rs`, `compiler/crates/beskid_engine/src/jit_module.rs`, and workspace manifests. | W6/retirement rollups cannot be Done. CYB-35, CYB-36, CYB-67, and CYB-86 remain required. |
| The authoritative Corelib matrix has 61 targets. | `compiler/corelib/beskid_corelib/tests/corelib_tests/corelib_tests.bproj` contains 61 `target` declarations; Tracker records 20 pass / 41 fail (`beskid_tracker/data/v0.4/tasks/corelib-matrix-green.json:14-31`). | CYB-181 is the matrix authority; no release gate or parent may treat the old 42-target or a filtered run as completion. |
| The runtime-kit verifier is unsound today. | `beskid_tracker/data/v0.4/tasks/runtime-kit-per-artifact-verification.json:14-22` | CYB-182 supersedes the old matrix-validation proof; static/shared and native platform evidence must be regenerated independently. |
| Collections and FS are specified but not implemented. | `beskid_tracker/data/v0.4/tasks/corelib-collections-storage-wiring.json:14-20`; `beskid_tracker/data/v0.4/tasks/corelib-system-fs-host-backed.json:14-20` | CYB-184 and CYB-185 are release blockers; CYB-186 closes only after both and the package/stub audit. |
| Structural splitting is not a normative release outcome by itself. | The remaining Tracker subtasks are size/responsibility splits (`beskid_tracker/data/v0.4/tasks/compiler-large-file-structural-splits.json:23-27`); no OpenSpec release SHALL requires the listed file splits. | The unfinished portion of CYB-183 belongs after 0.4 unless CYB-193 links a particular split to a concrete correctness/gate blocker. |
| The 40-item list omits platform delivery work already assigned to v0.4. | Tracker `data/v0.4/tasks/` still has open auth, Coolify, Nexus, webhook, package-publish, verify-all, and VS Code tasks. | The map must either keep these as release blockers or explicitly move them to a later delivery version; omission is not disposition. |

## One-row disposition of the 40 baseline issues

“Pred → successor” names the required order; a comma means independent predecessors. Ownership is the label currently on the issue and should be preserved during topology repair.

| Issue | Current | Disposition | Named authority/evidence | Canonical survivor / required edges | Owner |
|---|---|---|---|---|---|
| [Correct per-artifact runtime-kit verification and native smokes](https://linear.app/cybernomad-it/issue/CYB-182/v04-correct-per-artifact-runtime-kit-verification-and-native-smokes) | In Progress | **Required** | Tracker verifier defect; OpenSpec 5.3, 6.8.3, 6.10.2-3 | Survivor CYB-182. CYB-33 + CYB-34 + Linux proof → CYB-182 → CYB-41/CYB-11. | `agent/codex` |
| [Implement canonical host-backed Core.FS](https://linear.app/cybernomad-it/issue/CYB-185/v04-implement-canonical-host-backed-corefs) | Backlog | **Required** | Corelib change tasks 1.4, 1.6-1.7, 2.1, 2.5-2.6, 3.4, 4.1 | Survivor CYB-185. CYB-181 + CYB-184 + Result/adapter facts → CYB-185 → CYB-186. | `agent/codex` |
| [Complete Corelib API and purge all stubs](https://linear.app/cybernomad-it/issue/CYB-186/v04-complete-corelib-api-and-purge-all-stubs) | Backlog | **Required final Corelib audit** | Tracker stub-replacement task; Corelib change deletion/package gates | Survivor CYB-186. CYB-181 + CYB-184 + CYB-185 → CYB-186 → CYB-41. | `agent/codex` |
| [Implement rooted Core.Collections backing storage](https://linear.app/cybernomad-it/issue/CYB-184/v04-implement-rooted-corecollections-backing-storage) | Backlog | **Required** | Corelib change tasks 1.3/1.5, 2.2-2.4, 3.1-3.3, 4.1-4.4 | Survivor CYB-184. CYB-157 → CYB-158 → CYB-159 → CYB-184 → CYB-185/CYB-186. | `agent/codex` |
| [Split remaining mixed-responsibility compiler monoliths](https://linear.app/cybernomad-it/issue/CYB-183/v04-split-remaining-mixed-responsibility-compiler-monoliths) | In Progress | **Beyond 0.4 as presently written** | Remaining work is structural/LOC cleanup, not a normative release obligation | Close remaining scope as out of 0.4. CYB-193 may retain only a specifically proven gate-blocking split as a new bounded issue. | `agent/codex` |
| [Windows x86-64 debug/release runtime kits](https://linear.app/cybernomad-it/issue/CYB-171/w516-windows-x86-64-debugrelease-runtime-kits) | Backlog | **Duplicate** | Same platform cells as CYB-34; verification belongs to CYB-182 | Close to CYB-34 (implementation) + CYB-182 (proof). | `agent/cursor` |
| [Recover authoritative 61-target Corelib matrix and bounded harness](https://linear.app/cybernomad-it/issue/CYB-181/v04-recover-authoritative-61-target-corelib-matrix-and-bounded-harness) | In Progress | **Required** | 61-target manifest; Tracker 20/61 and bounded-harness record | Survivor CYB-181. Failure leaves → 61/61 → CYB-184/185/186 and final gates. | `agent/codex` |
| [Tracker: update v0.4 seed data for corelib/runtime refactor evidence](https://linear.app/cybernomad-it/issue/CYB-177/w77-tracker-update-v04-seed-data-for-corelibruntime-refactor-evidence) | Backlog | **Required reconciliation owner** | Tracker is delivery SOT; current seed now names the authoritative gaps | Survivor CYB-177 over CYB-172. All implementation evidence → CYB-177 → CYB-197. | `agent/cursor` |
| [Windows x86-64 empty-prefix JIT+AOT smoke](https://linear.app/cybernomad-it/issue/CYB-176/w524-runtime-windows-x86-64-empty-prefix-jitaot-smoke) | Backlog | **Duplicate/subset** | CYB-34 owns the platform; CYB-182 requires stronger JIT+AOT+REPL+run proof | Close to CYB-34 + CYB-182. | `agent/cursor` |
| [macOS arm64 empty-prefix JIT+AOT smoke](https://linear.app/cybernomad-it/issue/CYB-175/w523-runtime-macos-arm64-empty-prefix-jitaot-smoke) | Backlog | **Duplicate/subset** | CYB-33 owns the platform; CYB-182 requires stronger proof | Close to CYB-33 + CYB-182. | `agent/cursor` |
| [Close CodeStringLiteral and TryExpression gaps](https://linear.app/cybernomad-it/issue/CYB-174/w518-isle-lowering-close-codestringliteral-and-tryexpression-gaps) | Backlog | **Required, narrowed** | OpenSpec 2.3/3.3/6.9.1 exhaustive inventory | Keep TryExpression desugaring and its regression. Explicitly exclude CodeStringLiteral from 0.4 with a fail-closed classification. CYB-174 → CYB-181. | `agent/cursor` |
| [Close LambdaExpression gap](https://linear.app/cybernomad-it/issue/CYB-173/w517-isle-lowering-close-lambdaexpression-gap-w42-carry-over) | Backlog | **Required** | OpenSpec 2.3/3.3/6.9.1; CYB-25 acceptance was not met | Survivor CYB-173; close the false CYB-25 rollup only after CYB-173 evidence. CYB-173 → CYB-181. | `agent/cursor` |
| [Update tracker seed data and catalog for corelib completion evidence](https://linear.app/cybernomad-it/issue/CYB-172/w76-update-tracker-v04-seed-data-and-catalog-for-corelib-completion) | Backlog | **Duplicate** | Same seed/catalog reconciliation as newer, broader CYB-177 | Close to CYB-177; final catalog/doc reconciliation remains CYB-197. | `agent/cursor` |
| [macOS arm64 debug/release runtime kits](https://linear.app/cybernomad-it/issue/CYB-170/w515-macos-arm64-debugrelease-runtime-kits) | Backlog | **Duplicate** | Same platform deliverable as CYB-33 | Close to CYB-33 (implementation) + CYB-182 (proof). | `agent/cursor` |
| [Align Ansi.PrivateMode with mutable-local authority](https://linear.app/cybernomad-it/issue/CYB-163/w59a3b-align-ansiprivatemode-with-syntax-mutable-local-authority) | Todo | **Required bounded leaf** | Fresh span-bearing reproduction; explicit immutable/mutable semantic contract | CYB-163 → CYB-181. Do not relax compiler immutability. | `agent/cursor` |
| [Lower value-field projections on event-bearing nominal aggregates](https://linear.app/cybernomad-it/issue/CYB-162/w59a3a-lower-value-field-projections-on-event-bearing-nominal-aggregates) | Todo | **Required bounded leaf** | Fresh reproduction; generation-safe field layout is absent | CYB-162 → CYB-181; keep separate from managed allocation CYB-158. | `agent/cursor` |
| [Import Core.Syscall and Core.Results for canonical Core.Error lowering](https://linear.app/cybernomad-it/issue/CYB-161/w59b5-import-coresyscall-and-coreresults-for-canonical-coreerror-lowering) | Backlog | **Required bounded leaf** | Fresh missing-import reproduction; fail-closed name authority | CYB-161 → CYB-181. | `agent/cursor` |
| [Preserve valid string handles through ANSI style-chain JIT lowering](https://linear.app/cybernomad-it/issue/CYB-156/w59c2-preserve-valid-string-handles-through-ansi-style-chain-jit) | Backlog | **Required rollup, no parallel implementation** | Escaping callee-stack aggregate pointer; managed allocation change | CYB-156 is parent evidence. CYB-157 → CYB-158 → CYB-159 closes it; then CYB-181. | `agent/cursor` |
| [Lower aggregate literals through managed allocation with root-safe stores](https://linear.app/cybernomad-it/issue/CYB-159/w59c2c-lower-aggregate-literals-through-managed-allocation-with-root-safe) | Backlog | **Required** | Managed aggregate OpenSpec; Corelib task 2.4 | CYB-158 → CYB-159 → CYB-184/CYB-181. | `agent/cursor` |
| [Emit header-aware syntax aggregate layouts and static allocation plans](https://linear.app/cybernomad-it/issue/CYB-158/w59c2b-emit-header-aware-syntax-aggregate-layouts-and-static) | Backlog | **Required** | Managed header/descriptor/pointer-map authority | CYB-157 → CYB-158 → CYB-159. | `agent/cursor` |
| [Specify and implement managed aggregate allocation ABI-v5](https://linear.app/cybernomad-it/issue/CYB-157/w59c2a-specify-and-implement-managed-aggregate-allocation-abi-v5) | Backlog | **Required** | Active managed-allocation change has 40 unchecked tasks | CYB-157 → CYB-158. Reconcile its stale task list with the newer Corelib rooted-grow contract before implementation. | `agent/cursor` |
| [Authorize canonical Foundation Output panic service lowering](https://linear.app/cybernomad-it/issue/CYB-141/w59a4-authorize-canonical-foundation-output-panic-service-lowering) | Backlog | **Re-verify, then close if current evidence passes** | Newer Core.Error evidence says canonical Output already passes this trusted-source shape | Run the exact focused regression at current tip. If green, close as completed; otherwise retain CYB-141 → CYB-181. | `agent/cursor` |
| [Generalize generic call ABI-specialization harvesting](https://linear.app/cybernomad-it/issue/CYB-140/w59a3-generalize-generic-call-abi-specialization-harvesting-for-reachable) | Backlog | **Re-verify/superseded failure statement** | CYB-162’s newer trace says the original generic-specialization failure no longer reproduces | Do not implement from stale diagnosis. Current-tip focused regression; close if green, otherwise replace with a new exact CYB-188 leaf. | `agent/cursor` |
| [Specialize generic string equality to ABI str_eq](https://linear.app/cybernomad-it/issue/CYB-138/w59c1-specialize-generic-string-equality-to-abi-str-eq) | Backlog | **Re-verify, then close if current evidence passes** | CYB-163’s newer evidence says preceding generic string equality assertions pass | Current-tip equality regression; close if green, otherwise CYB-138 → CYB-181. | `agent/cursor` |
| [Remove legacy ABI dispatch and compatibility resolver branches](https://linear.app/cybernomad-it/issue/CYB-86/w64a-remove-legacy-abi-dispatch-and-compatibility-resolver-branches) | Backlog | **Required** | Retirement scan finds live `interop_dispatch_*` and generated dispatch authority | CYB-86 → CYB-67 → retirement/provenance gate. | `agent/cursor` |
| [Delete HIR model, normalization, and legacy lowering after migration](https://linear.app/cybernomad-it/issue/CYB-84/w61a-delete-hir-model-normalization-and-legacy-lowering-after-migration) | Backlog | **Superseded audit umbrella** | Duplicates CYB-35/CYB-36 and the fresh frontier audit CYB-195 | Close/convert to relation. CYB-35 + CYB-36 are implementation survivors; CYB-195 owns the fresh inventory. | `agent/cursor` |
| [Validate canonical runtime-kit target/profile matrix](https://linear.app/cybernomad-it/issue/CYB-83/w55a-validate-canonical-runtime-kit-targetprofile-matrix) | Backlog | **Superseded** | Its proof model is invalidated by CYB-182’s per-artifact defect | Close to CYB-182 after preserving CYB-33/CYB-34 as platform implementers. | `agent/cursor` |
| [Remove obsolete dependencies, features and generated artifacts](https://linear.app/cybernomad-it/issue/CYB-67/w66-remove-obsolete-dependencies-features-and-generated-artifacts) | Todo | **Required** | OpenSpec 4.5/6.10.1-2; retirement scan reports retired workspace dependencies | CYB-35 + CYB-36 + CYB-86 + Rust-runtime deletion → CYB-67 → zero-violation gate. | `agent/cursor` |
| [Fresh full compiler workspace verification](https://linear.app/cybernomad-it/issue/CYB-40/w71-fresh-full-compiler-workspace-verification) | Todo | **Required evidence** | OpenSpec 5.1-5.2/6.10.3 | All compiler implementation/retirement → CYB-40 → CYB-41/final sign-off. | `agent/cursor` |
| [Migrate corelib, CLI, installers and release bundles](https://linear.app/cybernomad-it/issue/CYB-66/w58-migrate-corelib-cli-installers-and-release-bundles) | Backlog | **Required** | OpenSpec 3.5-3.6/6.9.3 | Runtime/Corelib consumers + exact kits → CYB-66 → Rust runtime deletion/CYB-41. | `agent/cursor` |
| [Defer taxonomy hub promotion](https://linear.app/cybernomad-it/issue/CYB-58/f-defer-taxonomy-hub-promotion) | Backlog | **Out of scope by design** | Its own contract says non-blocking; provisional hubs have no leaf SHALL obligations | Close as out of 0.4 and retain the deferral in OpenSpec/catalog, not on the release frontier. | `agent/cursor` |
| [Corelib, installed-prefix and package verification](https://linear.app/cybernomad-it/issue/CYB-41/w72-corelib-installed-prefix-and-package-verification) | Todo | **Required evidence** | OpenSpec 5.2-5.4/6.10.3; Tracker pckg task | CYB-40 + CYB-66 + CYB-182 + CYB-186 + version decision → CYB-41 → CYB-11. | `agent/cursor` |
| [Delete Lowerable and legacy codegen entry points](https://linear.app/cybernomad-it/issue/CYB-36/w62-delete-lowerable-and-legacy-codegen-entry-points) | Todo | **Required** | Fresh scan finds live trait/implementations; OpenSpec 4.2/6.10.1 | CYB-35/migrated callers → CYB-36 → CYB-67. | `agent/cursor` |
| [Delete HIR model, lowering and caches](https://linear.app/cybernomad-it/issue/CYB-35/w61-delete-hir-model-lowering-and-caches) | Todo | **Required** | Fresh scan finds live HIR assembly, linking, caches, and test support; OpenSpec 4.1 | Consumer migration/CYB-173/174 → CYB-35 → CYB-36/CYB-67. | `agent/cursor` |
| [macOS arm64 debug/release runtime kits](https://linear.app/cybernomad-it/issue/CYB-33/w56-macos-arm64-debugrelease-runtime-kits) | In Progress | **Required platform survivor** | OpenSpec 5.3/6.8.3; native evidence absent | CYB-33 → CYB-182. Absorb CYB-170/CYB-175. | `agent/cursor` |
| [Canonical strings and collections](https://linear.app/cybernomad-it/issue/CYB-30/w53-canonical-strings-and-collections) | Backlog | **Required rollup, narrowed** | OpenSpec canonical runtime + Corelib collections obligations | Retain string-runtime acceptance; move collection implementation to CYB-184 and aggregate lifetime to CYB-156/157-159. CYB-29 → CYB-30 → kits. | `agent/cursor` |
| [Scheduler, concurrency and callbacks](https://linear.app/cybernomad-it/issue/CYB-31/w54-scheduler-concurrency-and-callbacks) | Backlog | **Required rollup, insufficiently decomposed** | OpenSpec 6.8.1c-d and managed-allocation tasks 5-6 | CYB-29 → missing scheduler/sync/callback leaves → CYB-31 → CYB-66/kits. | `agent/cursor` |
| [Allocator, roots, barriers and mark/sweep GC](https://linear.app/cybernomad-it/issue/CYB-29/w52-allocator-roots-barriers-and-marksweep-gc) | Backlog | **Required** | OpenSpec 2.6/6.8.1 and managed-allocation tasks 2.x | CYB-29 → CYB-157/collections/scheduler → kits. | `agent/cursor` |
| [Run release gates and record sign-off evidence](https://linear.app/cybernomad-it/issue/CYB-11/04-w7-run-release-gates-and-record-sign-off-evidence) | In Progress | **Required final rollup** | OpenSpec 5.x/6.10.3 and root workflows | All implementation, migration, three-platform proof, Tracker/platform delivery, docs/catalog, GitNexus review → CYB-11. | `agent/cursor` |
| [Windows x86-64 debug/release runtime kits](https://linear.app/cybernomad-it/issue/CYB-34/w57-windows-x86-64-debugrelease-runtime-kits) | In Progress | **Required platform survivor** | OpenSpec 5.3/6.8.3; native evidence absent | CYB-34 → CYB-182. Absorb CYB-171/CYB-176. | `agent/cursor` |

## Falsely completed or evidence-invalid rollups

These statuses must not be consumed as release evidence. Reopen them, or retain Done only with an explicit “historical implementation slice; not release closure” resolution and point the dependency graph at the live survivor.

| Done issue | Why completion is false or stale | Correct live owner |
|---|---|---|
| `0.4 W5 — Complete canonical runtime and three-target kit matrix` (CYB-9) | Children CYB-29/30/31/33/34/66/83 and multiple Corelib failure leaves are open; OpenSpec runtime/kit tasks remain unchecked. | CYB-29/30/31, CYB-33/34, CYB-66, CYB-181/182/184-186 |
| `0.4 W6 — Retire HIR and all legacy runtime paths` (CYB-10) | Fresh retirement scan fails with live HIR, `Lowerable`, Rust runtime/host, legacy dispatch, and retired dependencies. | CYB-35/36/67/86 plus CYB-195 audit |
| `W4.2 — Lower aggregates, closures, captures and spawn` (CYB-25) | CYB-173 explicitly records the deferred LambdaExpression acceptance gap. | CYB-173 |
| `W6.5 — Make retirement and binary-provenance gates authoritative` (CYB-39) | The authoritative retirement gate currently fails and its deletion predecessors remain open. | CYB-35/36/67/86, then rerun CYB-39 evidence |
| `W6.3a — Remove Rust runtime bridge, handlers, envelopes, and fallback objects` (CYB-85) | Fresh scan finds `beskid_runtime`, `beskid_host`, `beskid_runtime_handlers`, engine registrations, and dependencies live. | CYB-66 then a reopened/bounded Rust-runtime deletion issue |
| `W5.9c — Prevent JIT allocation overflow…` (CYB-134) | Open descendants CYB-138 and CYB-156-159 prove the aggregate/string acceptance chain is incomplete. | CYB-156-159; re-verify CYB-138 |
| `W5.9b.2 — Lower discard-payload unit enum matches…` (CYB-137) | CYB-141 remains open and its acceptance was part of the same Output/Error path. | Re-verify CYB-141 and close with current evidence |
| `W5.9b.4 — Lower Core.Error unit enum-match panic arm…` (CYB-160) | CYB-161 records the next missing import/call fact in the same canonical path. | CYB-161 |
| `W5.5 — Linux x86-64 debug/release runtime kits` (CYB-32) | Implementation may be landed, but CYB-182 invalidates the old combined-artifact proof. | Keep implementation Done; do not count proof until CYB-182 passes Linux independently. |
| `W7.1a`, `W7.3`, `W7.4`, `W7.5`, and `W7.3a` (CYB-87/42/43/44/88) | They predate the current source tip and newly accepted obligations. A changed candidate invalidates final gate, docs, review, and sign-off evidence. | CYB-40/41, CYB-196/197, then CYB-11 |
| `0.4 W3 — Exact ABI-v5 runtime-kit route` (CYB-7) | Fresh scan still finds fallback/legacy dispatch and CYB-182 proves artifact verification is unsound. | CYB-66/86/182 |
| `0.4 W4 — Migrate remaining codegen, LSP, and frontend consumers` (CYB-8) | CYB-173/174 and OpenSpec 3.1-3.3/6.9.1-2 remain open. | CYB-173/174, CYB-35, and missing numeric-conversion leaf |

## Obligations missing from the 40-item baseline

Create these as bounded Linear children before topology repair, unless an exact existing issue is found and linked. Do not hide them inside broad CYB-29/31/66 descriptions.

| Missing issue to create or link | Authority | Predecessor → successor | Owner |
|---|---|---|---|
| Implement canonical scheduler, guarded contexts/stacks, poll executor, monitor/link ownership, safepoints, shutdown, and native proof | `hir-free-isle-abi-v5-native-runtime/tasks.md:63-76` | CYB-29 → new scheduler leaf → CYB-31/CYB-182 | `agent/codex` |
| Replace channel/mutex/waitgroup/hub/event/callback placeholder state and prove lowering/provenance | same file `:77-83` | scheduler leaf → new sync/callback leaf → CYB-31/CYB-67 | `agent/codex` |
| Implement composition activation, container/scope ownership, lowering, disposal, and provenance | same file `:84-88` | scheduler/facts → new composition leaf → CYB-66/CYB-67 | `agent/codex` |
| Implement manifest-owned Process lifecycle, environment, and terminal adapters beyond Core.FS | same file `:89-96` | adapter contract → new Process leaf (+ CYB-185 for FS) → CYB-66/CYB-182 | `agent/codex` |
| Complete Core.Args ABI-v5 canonical services, three-target adapters, JIT injection, fallback deletion, and proof | `openspec/changes/core-args-abi-v5/tasks.md:9-21` | new Core.Args leaf → CYB-66/CYB-182/CYB-41 | `agent/codex` |
| Add explicit primitive numeric-conversion syntax facts/ISLE/proof | `hir-free-isle-abi-v5-native-runtime/tasks.md:102-103` | new bounded compiler leaf → CYB-35/CYB-40 | `agent/codex` |
| Delete the still-live Rust runtime/host/handlers after replacement consumers pass | OpenSpec 4.3/6.10.1; fresh retirement scan | CYB-66 + scheduler/sync/composition/process → new deletion leaf → CYB-67 | `agent/codex` |

The Tracker v0.4 delivery projection also has open items absent from the 40-item compiler/runtime baseline: auth OAuth scaffold; multi-service Coolify matrix; production Nexus serve/hosting; roadmap labels; production Tracker GitHub webhook; `@beskid/ui-react` package publication; verify-all-on-main; VS Code/pckg/docs integration; and corelib-quality/pckg publication. Each must either be linked to a live Linear issue with `release/0.4` and an ownership label, or moved to a later Tracker version by an explicit scope decision. The map cannot claim an authoritative 0.4 boundary while leaving them implicit.

## Canonical dependency spine

1. Resolve release identity/scope (CYB-194) and add/link the missing obligations above.
2. Recover exact failure topology (CYB-188/CYB-181); close stale CYB-138/140/141 only from current focused evidence.
3. Complete runtime/facts: CYB-29; scheduler/sync/composition/Process/Core.Args leaves; CYB-157 → CYB-158 → CYB-159; CYB-161/162/163/173/174.
4. Complete Corelib: CYB-184 → CYB-185 → CYB-186; obtain 61/61 through CYB-181.
5. Complete migration and retirement: CYB-66 → CYB-35 → CYB-36/CYB-86 → Rust-runtime deletion → CYB-67; retirement scan must report zero violations.
6. Produce platform artifacts: CYB-33 + CYB-34 + Linux implementation → CYB-182 native per-artifact proof.
7. Run CYB-40 → CYB-41, then all root platform/delivery gates.
8. Reconcile Tracker/OpenSpec/catalog/docs/changelog through CYB-177/CYB-197; run GitNexus changed-scope and whole-branch review.
9. Execute the immutable sign-off sequence defined by CYB-196; only then close CYB-11 and the Wayfinder map.

## Linear resolution comment draft

Research at root `0733294b`, compiler `8bbdb593`, Corelib `9ca06db4` establishes that the current 40-item `release/0.4` baseline is neither minimal nor complete. Tracker is authoritative for delivery projection and says v0.4 is still in progress at 20/61 Corelib; OpenSpec and fresh commands govern completion. The HIR-free retirement gate fails with live HIR/Lowerable, Rust runtime/host, legacy dispatch, and retired dependencies. Per-artifact kit proof is invalid and native three-platform evidence is absent.

Disposition: retain 28 required owners/rollups, close or convert 7 duplicate/superseded records, move CYB-183’s remaining structural-only work and CYB-58 beyond 0.4, and re-verify three stale failure tickets before closure rather than reimplementing stale diagnoses. Canonical duplicate survivors are CYB-33/CYB-34 + CYB-182 for macOS/Windows, CYB-177 for Tracker reconciliation, CYB-35/CYB-36 + CYB-195 for HIR retirement, and CYB-182 for matrix verification.

Before repairing topology, add/link missing normative leaves for scheduler/poll execution, synchronization/hub/event/callback state, composition, Process/env/terminal adapters, Core.Args ABI-v5, primitive numeric conversions, and final Rust-runtime deletion. Also disposition the open platform-delivery tasks already assigned to Tracker v0.4. Reopen or explicitly demote the stale Done rollups CYB-9, CYB-10, CYB-25, CYB-39, CYB-85, CYB-134, CYB-137, CYB-160, and prior final sign-off/doc/review issues; Done is not evidence.

Full one-row table and dependency spine: `docs/superpowers/reports/2026-08-11-cyb-190-v04-release-boundary.md` on branch `research/0-4-release-boundary`.

## Method limits

- This was a read-only planning audit; no Linear status, relation, label, or implementation change was made.
- The retirement scanner was run and failed on source facts. The provenance helper was not treated as a standalone gate because it requires a symbol-list argument.
- No current full 61-target execution was repeated; the source-tip Tracker report is the retained primary evidence and the manifest count was independently confirmed.
- Native macOS/Windows/Linux evidence was not inferred from cross-compilation or static inspection.
