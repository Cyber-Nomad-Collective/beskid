# 0.6 standard and evidence audit

This audit ran against the current dirty release worktree while the coordinator's `rc14-workspace` Cargo run remained live. It does not qualify immutable release artifacts or claim workspace tests pass.

## Standard catalog repaired

`validate-standard.ts` initially rejected catalog drift for `compiler--semantic-pipeline--diagnostic-code-registry/spec.md`. Its E1888 guidance had been updated from the obsolete `beskid validate-bsol` to `beskid dev bsol validate <manifest>.bproj` without regenerating the catalog.

Ran the existing `build-catalog.ts` generator; no hand editing or weakening of validation. Catalog revision is now `6ea48b519b68`, with 197 capabilities and 576 requirements. Canonical standard validation passes (1042 archived source records and 3189 archived artifact hashes). Book traceability and layout validators exit successfully. Strict OpenSpec validation passes all 224 items, including all five v06 changes. Retained strict log: `.build/v06-codex-openspec-strict-20261006.log`.

The release checkout has no node_modules, so `pnpm run openspec:validate` initially failed because tsx was unavailable. Validation then used the existing original checkout's absolute tsx/openspec executables against release-worktree scripts/current working directory; it did not install dependencies or change lockfiles. This proves current specification validation, not a clean-checkout dependency installation gate.

## Release evidence tests: 31 pass, two fail

Command: `node --test scripts/ci/test/woodpecker-release-evidence.test.mjs scripts/ci/test/woodpecker-cli-surface-evidence.test.mjs`.

All 33 tests executed, none skipped. Two packaging cases failed before exercising their intended path:

- `packaging rejects legacy flat bundles instead of reporting an installer success`: expected bundle extraction failure; received distribution checkout cleanliness denial.
- `native packaging consumes the complete verified bundle`: expected successful packaging; received the same cleanliness denial.

The distribution submodule has tracked and untracked implementation changes. Preserve these changes and the production cleanliness/provenance guard. These results do not establish either packaging case passes. Before final qualification, run these controls against the integrated clean distribution checkout or an isolated source-bound fixture that exercises the exact current packaging implementation and retains the cleanliness denial negative control.

## Live test ownership

Observed local rgate PID 54160 and SSH PID 54162 for rc14-workspace, with remote log advancing through CLI library target integration tests. Runtime prefix is `/workspace/v06-prefix-c14`; cache `/target/v06-release` remains coordinator-owned. Four native library cases were marked ignored in the observed log and therefore require their dedicated staged native matrix. No second Cargo run or source synchronization was launched by this audit.

## Packaging harness repair and verified follow-up

The production packager resolves its source/distribution checkout relative to its own script path. The prior packaging fixture supplied evidence for the mutable shared checkout, causing the cleanliness guard to terminate two tests before their intended behavior. This is a harness coupling; weakening the guard would be incorrect.

Remedy: the fixture now copies the actual current packager, evidence validator, source-authority guard, CLI inventory and bundle extractor/version helper into a temporary committed checkout with pinned compiler/distribution gitlinks and matching evidence. The installer executables are explicit tool doubles; the test is named packaging orchestration, and establishes extraction, formula generation, artifact digest/report and provenance behavior rather than claiming a native installer works. A new end-to-end dirty pinned distribution case verifies rejection before output creation. Existing tracked/untracked/ignored cleanliness controls remain intact. No production packager or distribution implementation was changed.

Primary-source basis: [Git status](https://git-scm.com/docs/git-status) documents porcelain output and tracked/untracked status; [Node filesystem copying](https://nodejs.org/api/fs.html#fscopyfilesyncsrc-dest-mode) documents copying fixture bytes. The choice of a committed fixture with exact gitlinks is a beskid inference from the existing packager's executable authority checks. It retains those checks instead of introducing a test bypass or alternate acceptance authority.

Verified command: `node --test scripts/ci/test/woodpecker-release-evidence.test.mjs scripts/ci/test/woodpecker-cli-surface-evidence.test.mjs scripts/ci/test/package-source-authority.test.mjs`. Result: **36 pass, 0 fail, 0 skipped**, about 6.6 seconds. Retained log: `.build/v06-codex-packaging-controls-20261006.log`.

The rc14 workspace run continued advancing through native SDK tests during verification. Its final result and native/install qualification remain pending.

## Installation-control path repair

Ran distribution ownership controls for container staging, DEB private prefix, Homebrew owner identity/rpath and immutable installation inventory. Invocation from the distribution directory reproduced seven failures caused by three test files resolving script/formula paths from process.cwd. Invocation from the superrepo root passed all ten, isolating the failure to test path construction rather than product behavior.

Changed only those three test files to locate consumed scripts/formula via `fileURLToPath(new URL(relativePath, import.meta.url))`. Existing source changes remain intact. Both distribution-directory and superrepo-root invocations now pass **10/10**, with no skips. Logs: `.build/v06-codex-installation-controls-fixed-20261006.log` and `.build/v06-codex-installation-controls-root-fixed-20261006.log`. These are fixture controls with explicit native-tool doubles, not real Homebrew/DEB/container installer qualification. Disposable-host Homebrew kit install was inspected but not run on this developer machine.

The 0.6 matrix reader suite independently passes **28/28** (`.build/v06-codex-matrix-controls-20261006.log`). Its success uses synthetic reader fixtures; the production 101-case manifest remains `binding_required`, and cannot qualify release artifacts until real assertions and execution bindings are frozen. The old v1 feature producer does not establish the complete v2 matrix. Do not treat these controls as 303 native acceptance cells.

## Native assertion binding support

A concrete implementation gap in `ValidateV06FeatureEvidence` prevented binding native corelib assertions: declaration provenance required Node `test("id",` text exclusively, while real Beskid test sources declare `test identifier` followed by a body. Added explicit mandatory `binding.harness_language` values `node` and `beskid`; unknown or absent language fails closed. Native identifiers must match the identifier grammar, their exact source bytes/line boundary must match, and the declaration must lead into a test body. Existing reviewed-source, immutable-manifest, packet hash, case identity and executed-test checks remain unchanged. No production bindings were fabricated or frozen.

Regression uses the actual source declaration `bsol_serialization_wire_exact_unsigned_width` from corelib SerializationWireTests.bd, with explicitly synthetic reader execution receipts. It failed before the fix and passes after. Negative controls reject relabeled/missing languages and a prefix of a different native identifier. Retained red and full green logs: `.build/v06-native-declaration-red.log`, `.build/v06-native-declaration-complete.log`. Combined matrix, packaging, CLI evidence and source authority suite: **67 passed, 0 failed, 0 skipped**.

The full rc14 run has reached e2e tests; source-keyed staging harness control passes, while multiple native CLI cases were observed still running. Do not infer their completion or a repaired staging root cause from that single harness control.

## Current-run partial triage and managed allocator contract

Observed remote rc14 e2e process 3135122, nested Cargo process 3135134 and active rustc process 3136118 compiling beskid_queries in `/target/v06-release`. This establishes active compilation rather than a deadlock from elapsed-test messages. Copied the then-current log to `.build/rc14-workspace-codex-observed.log`: 111 completed binary summaries, 97 passed and 14 failed, with 23 failed tests. Counts are partial, exclude unfinished binaries and are not release qualification.

One source-contract test failed because it expected `pointer object = GcAlloc(size, alignment);`. Current runtime ordinary allocation delegates to AllocateObjectWithPolicy(request, false), while that policy routes checked allocations through GcTryAlloc and ordinary allocations through GcAlloc. Updated only the existing allocator authority test to require all three exact routes and retain the SystemAllocate bypass denial. No runtime allocation policy or GC implementation was changed.

Focused current-source command: `cargo test --locked -p beskid_abi --test canonical_runtime_sources`, using the existing local `.build/compiler` cache and two jobs, without modifying/synchronizing the coordinator builder. **9 passed, 0 failed**; log `.build/v06-managed-allocator-policy-controls.log`. This repair is not present in the already-running remote source snapshot and requires integration/synchronization before its next affected gate. Source-contract success does not prove forced-GC execution.

Other partial failures still include Fiber facade source expectations, LSP/documentation, Mod generation, real native test execution, template relocation, and canonical lowering/authority cases. Preserve those as unresolved until their root causes and current coordinator repairs are inspected.

## Fiber facade source-contract repair

The exact join/cancel facade test expected a bare handle argument; current move-only Fiber<T> methods explicitly use this.handle. Corrected the two source expectations without changing runtime/facade behavior or the exact service inventory and cancellation ABI assertions. Focused control passes; the full runtime_source::tests module passes **21/21** (23 other ABI tests filtered out), including all target import preflight and source authority checks. Logs: `.build/v06-fiber-facade-controls.log`, `.build/v06-runtime-source-contract-controls.log`. These are current local source controls, not native fiber lifecycle qualification. The changed test still needs inclusion in the coordinator's next synchronized source/gate.

## E2E private dependency-state contamination (2026-10-06)

The rc14 dependency e2e failed because its fresh workspace contained a non-private `.beskid/dependency-transaction` directory. Read-only builder inspection found the source fixture already had a generated 0700 transaction directory; the harness recursively copied `.beskid` and recreated directories with default permissions. Local source fixture had no such directory, explaining environment sensitivity. The product guard correctly denied the copied state.

[Rust DirBuilder](https://doc.rust-lang.org/std/fs/struct.DirBuilder.html) documents creating directories with configured settings; [Unix DirBuilderExt](https://doc.rust-lang.org/std/os/unix/fs/trait.DirBuilderExt.html) documents default 0777 mode. Inference from the actual copier: source directory privacy is not retained by its create_dir_all calls. Selected remedy: exclude private `.beskid` state from fixture copying, alongside existing obj and Project.lock exclusions. Do not chmod or relax the product guard, preserve the original source state, and let the real transaction code create a fresh private directory.

Added a real copier regression with nested private transaction state, generated obj and stale Project.lock; it proves these are excluded, ordinary source/manifest bytes remain and source-side state is preserved. Current local test passes: `.build/v06-e2e-private-state-controls.log`, 1 passed, 8 filtered out. Full native dependency e2e still needs rerun after the coordinator integrates this harness change; no Linux end-to-end success is claimed from the local copier control.

## Check semantic failure exit status (2026-10-06)

The current rc14 e2e assertion retained the old analyze exit-zero convention after switching its invocation to `check`. Accepted v06 command-surface requirements prescribe 0 on success, 1 on operation failure, 2 on usage error. The actual CLI reports the missing value diagnostic and exits 1, matching the normative requirement. [Cargo check documentation](https://doc.rust-lang.org/cargo/commands/cargo-check.html) supports a failing status for failed checks; its exact failure code differs, so beskid's code 1 comes from the accepted beskid policy, not Cargo.

Updated the test to require exactly exit 1 and the actual unknown-value identifier diagnostic on stderr, preventing tracing/progress output from satisfying the old nonempty-stderr assertion. Current builder binary was exercised directly in an isolated temporary directory with independent home/config/corelib roots: valid source exits 0, invalid source exits 1 and retains the semantic diagnostic on stderr. No builder source/cache synchronization or Cargo build was performed by that probe. Log: `.build/v06-check-exit-contract-probe.log`. The changed e2e assertion still requires the coordinator's synchronized gate; this probe does not qualify an immutable installed release.

## Documentation normalization verified

The current local focused parser integration gate is terminal: **3/3 pass**. This fixes both rc14 missing-second-line regressions and retains CRLF source bounds plus Markdown indentation. Changed only the raw atomic DocRun normalization's pre-delimiter ASCII space/tab handling; grammar, recovery and metadata authority are unchanged. See `.build/v06-documentation-indent-controls.log` and the blocker web-solutions entry. The remote snapshot needs this repair before the next affected gate.

Existing documentation module gate also passes **24/24**, with 480 unrelated library tests filtered out. It covers reference links, structured argument/return/variant docs, graph links and API signatures. Log: `.build/v06-existing-documentation-controls.log`. No further broad rerun is justified by this local fix until integration into the coordinator snapshot.

## Template closure and Disposable source expectations — pending gates

Current rc14 template authoring failure compares the actual twelve-package corelib closure against a ten-package pre-0.6 expectation. Added corelib_bsol and corelib_serialization to the independent required package list, retaining the real create/update/relocate/locked/frozen journey and immutable lock assertions. Gate session 77842 is active, log `.build/v06-template-closure-controls.log`; do not claim success before its result.

Current Disposable source already exposes the contract and error enum with a fully qualified Result type, so the source fixture no longer contains an unused import. Corrected the expected declaration count from three to two and added explicit ContractDefinition/EnumDefinition AST-kind checks. Existing Dispose signature and failure-variant assertions remain. Gate session 43048 is queued behind the CLI build in the local cache, log `.build/v06-disposable-contract-controls.log`. No source synchronization, new remote Cargo run or native qualification is claimed. Preserve both handles and finish the queued gates rather than restarting them.

Template closure gate 77842 is terminal: **2/2 pass**, including actual authoring creation, complete twelve-package closure, update, directory relocation, locked/frozen replay and unchanged portable lock identity. Disposable/scoped-use gate 43048 is terminal: **4/4 pass**. Logs: `.build/v06-template-closure-controls.log`, `.build/v06-disposable-contract-controls.log`. Neither result is a three-platform immutable installed release gate.

Dynamic lookalike control rc14 reports zero TypeDefinition nodes when inspecting only direct root children. Candidate test repair now recursively traverses the same generation-bound indexed child graph used by neighboring helpers, retains an exact two-declaration requirement and applies both no-managed-erasure-authority and ordinary header-only-layout checks to each declaration. Verification process 11914 is live, log `.build/v06-dynamic-lookalike-controls.log`; outcome is pending. If the recursive count still fails, inspect actual indexed topology rather than relaxing the declaration count or authority denial.

Dynamic/owner geometry process 11914 is terminal: **6/6 pass**. Recursive indexed traversal resolves the previously missed declarations; both ordinary dynamic names are checked and receive no managed opaque authority, with ordinary 16-byte header-only layout. Neighboring positive owner geometry, managed trace-slot, native-pointer and UTF8 lookalike controls also pass. Log: `.build/v06-dynamic-lookalike-controls.log`. This verifies the current local source-contract controls, not native forced-GC release qualification.

Delegated read-only acceptance-binding research to /root/release_binding_audit under the research skill and repository parallel-work agreement. Expected report: `docs/research/2026-10-06-v06-acceptance-binding-audit.md`. Worker has no permission to freeze bindings, mark execution, run Cargo, change shared implementation or synchronize the coordinator builder. The audit should expose actual required coverage and missing producer/installed-consumer seams across the full 101-case scope.

## Private document-service fixture resolution

Reproduced rc14's seven document-service failures locally with `cargo test --locked -p beskid_analysis --lib services::document_tests::tests::corelib_mvp -- --test-threads=1`: 1 passed, 7 failed, all before LSP assertions on a stale checked-in Project.lock. Log `.build/v06-document-fixture-before.log`. The fixture lock retains the old ten-package Corelib closure; current Corelib includes BSOL and serialization.

Changed only test fixture setup in `compiler/crates/beskid_analysis/src/services/document_tests.rs`: copy exact source and manifest inputs into a per-fixture TempDir, retain its lifetime with the fixture, and resolve current bundled Corelib without copying checkout Project.lock, obj or .beskid state. Existing process-private toolchain provisioning and product stale-lock checks remain. Added a regression checking distinct project roots and independent resolution state. No repository fixture lock, installed developer Corelib or remote source/cache was changed.

The same affected gate is terminal with **9/9 pass**, 496 unrelated tests filtered out, covering completion, definition, references, lifecycle and new isolation assertion. Log `.build/v06-document-fixture-after.log`; diff whitespace check passes. This establishes local document controls, not native installed release qualification. Coordinator must integrate the patch and rerun the Linux group. Cached macOS minimum-deployment linker warnings persist and do not qualify the supported minimum target.

Acceptance-binding worker completed `docs/research/2026-10-06-v06-acceptance-binding-audit.md`. Its source inventory exposes installed producer/binding gaps, joined native ownership/stdio tests, generated typed consumer coverage, and real fresh-user CLI observations. It claims no execution.

## Native project fixture case sensitivity

Two native CLI fixtures created `src/Main.bd` while leaving the manifest source root at its canonical default `Src` (`compiler/crates/beskid_analysis/src/projects/parser/sections_builders.rs`). rc14 failed real-project materialization before native assertions; case-insensitive development filesystems mask this typo. Changed only both fixture directories/paths in `compiler/crates/beskid_cli/tests/native_test_execution_v06.rs` to `Src`. Preserve default manifest behavior, actual native execution and nested-process cancellation assertions.

A Linux read-only candidate-CLI probe with temporary isolated home/config/corelib roots and the coordinator's existing debug prefix reproduced lowercase failure (exit 1, missing `/Src`) and uppercase success (exit 0, selected ProjectSmoke executed). Log `.build/v06-native-fixture-case-probe.log`. A second probe exercised the actual nested native Endless executable with corrected source spelling and a five-second parent matrix budget: parent failed at its budget and observed native child was absent or zombie after termination. Log `.build/v06-native-matrix-case-probe.log`. No remote source synchronization or Cargo build took place.

Changed Rust integration target compiles successfully, `.build/v06-native-fixture-case-compile.log`; diff whitespace check passes. Full Rust test target still requires integration and native rerun. These temporary development-binary probes are not immutable installed release qualification.

## Real Serialization Mod prerequisite probe

Ran a temporary Linux consumer using a source copy of the actual `corelib/mods/serialization_mod/Src`, explicit foundation/compiler-sdk source dependencies, an annotated Config record and a CompiledShape<Config> call. Exact reproducer `.build/v06-real-serialization-mod-probe.py`; retained output `.build/v06-real-serialization-mod-probe.log`. It executes the current candidate development CLI with private home/config/corelib roots and reads the existing debug runtime prefix; it neither synchronizes source nor invokes remote Cargo. Two initial probe-only manifest errors were corrected before the retained run and are not serialization evidence.

The retained valid-manifest run exits 1 in dependency preparation: `lockfile duplicates a dependency name`, after materializing the fifteen-entry closure. This blocks real Generator admission before typed consumer compilation. The explicit source-package closure and automatic installed Std closure must be reconciled by actual package identity; do not relax ProjectLockfileV2's unique name/destination rejection or declare the Mod/generated consumer successful. This probe supplies a reproducible earlier blocker, not proof of typed deserialization behavior.

Separately, source inspection finds that `Core.Bsol.Serialization` already implements WireEncoder and SyntaxReader; do not misreport absence of native format adapters. Its `ReadTyped<T,B>` requires FieldDecoder<T,SyntaxReader>, while the Mod's DecoderAdapter emits a Decoder<T> implementation and fresh private decoder/factory identifiers. No caller-facing generated FieldDecoder/factory bridge was located in the inspected canonical registration/query/corelib paths. This is a source mismatch to resolve after actual Mod admission, not an executed deserialization verdict.

During the probe, corrected `compiler/crates/beskid_cli/tests/native_mod_sdk_v06.rs` host manifest from invalid `type = App` to the canonical implicit Host project kind (App is a target kind). Preserve its native Collector/Generator execution assertions. Local compile verification is running in session 42904, log `.build/v06-native-mod-manifest-compile.log`; do not claim it passes until terminal. An earlier incorrectly launched root-cwd compile was interrupted (exit130), then relaunched from compiler cwd; no remote Cargo/cache was changed.

## Serialization Mod real source parsing repaired

Native Mod fixture compile process 42904 is terminal, exit0. `.build/v06-native-mod-manifest-compile.log` confirms the corrected Host manifest integration target compiles; native callback execution is not claimed.

Refined the earlier duplicate-lock probe by pointing explicit Mod SDK/foundation dependencies at the candidate's process-private installed Corelib instead of mixing checkout packages with automatically installed Std. The duplicate failure disappears. Retained scripts/logs `.build/v06-real-serialization-mod-installed-deps-probe.py` and `.log`. Thus the earlier observation must not be presented as a proven production resolver bug: it mixed two distinct package roots. The installed-dependency probe now reaches the actual Mod parser and rejects `Scope scope` in Driver.bd.

Added a real strict-parser regression `compiler/crates/beskid_analysis/tests/serialization_mod_sources_v06.rs`, enumerating all actual Mod source files and rejecting recovery or diagnostics. The first RED reproduces Driver.bd:66:52, `.build/v06-serialization-mod-parse-before.log`. After its repair, the complete failure inventory exposes reserved `attribute` in Policies.bd and `contract` parameters in Syntax.bd (`.build/v06-serialization-mod-parse-inventory.log`). Grammar Identifier excludes Keyword, including ScopeKeyword, AttributeDeclarationKeyword and ContractDeclarationKeyword; this is invalid product source, not a parser change request.

Changed only local variable/parameter names and their uses in those three real corelib Mod files: moduleScope, fieldAttribute, contractPath. Kept SDK field `_contract`, logical attribute names, eligibility and generated contribution behavior. The exact parser gate is now terminal **1/1 pass**, covering all **11 source files** with no recovery, `.build/v06-serialization-mod-parse-after.log`. Diff whitespace checks pass.

Follow-up native probe process 11538 is active with script `.build/v06-real-serialization-mod-local-fixes-probe.py` and output `.build/v06-real-serialization-mod-local-fixes-probe.log`. It copies these three local fixes into only the temporary consumer Mod, reads candidate-installed dependencies, and leaves shared builder source/cache untouched. Finish that process before deciding the next native prerequisite. No generated typed roundtrip or immutable release qualification is proven yet.

## Native Serialization Mod import collisions and namespace prerequisite

Probe 11538 terminated normally with consumer exit1 and 34 semantic diagnostics. It passed strict source parsing and now exposes ambiguous Collect imports: SDK `Beskid.Compiler.Collect` and local `SerializationMod.Collect`. Aliased the local selector as Selection in the real Mod.bd and Driver.bd and updated exact selector calls. Re-ran the eleven-source strict parser gate successfully (`.build/v06-serialization-mod-parse-aliased.log`).

Follow-up actual native consumer probe 22653 is terminal. Script/output `.build/v06-real-serialization-mod-aliased-probe.py` and `.log` retain exact current local source copies and candidate-installed dependencies. It exits1 with **32** unresolved-import/type diagnostics; the two ambiguous Collect diagnostics are gone. Native generation is still unqualified.

A temporary CLI regression explored whether materialized entry paths caused the remaining imports. Its first valid fixture reproduction fails to resolve Helpers; changing physical entry discovery alone still fails. Retained scope topology `.build/v06-mod-materialized-entry-topology.log` shows host modules inferred as Std::Helpers and Std::Mod because the global has_std_dependency bit prefixes every effective root. This falsifies the path-only repair. Removed only our unverified prepared_mod_input extraction, temporary failing test and entry-path change; existing coordinator implementation remains. Resolve the Mod/host/SDK namespace rule against normative module semantics before editing inference; do not hide it by guessing Std prefixes in all source files or silently dropping required dependencies.

The CLI binary-unit compile uncovered missing imports in the existing cancellation controls. Added only the missing super/std imports in matrix_test.rs. Focused real lock-release/missing-file cancellation gate is terminal exit0 (`.build/v06-matrix-cancel-unit-controls.log`); see exact count in that retained log. No native release qualification follows from this unit gate.

## Serialization library Mod dependency closure

The actual `compiler/corelib/packages/serialization/corelib_serialization.bproj` lacked the normative transitive Mod dependency. Added `serialization_mod` through the canonical relative path. A regression in `compiler/crates/beskid_analysis/tests/serialization_mod_sources_v06.rs` builds the real project graph and verifies the Mod kind, exact canonical manifest path, SDK and Foundation closure. Red: `.build/v06-serialization-mod-closure-before.log` failed specifically on the missing Mod. Green: `.build/v06-serialization-mod-closure-after.log`, two tests passed (graph closure and all real Mod source parsing), terminal exit 0. Existing macOS linker minimum-version warnings remain. This is graph/parser evidence only; native generation remains blocked by the namespace defect described in `docs/research/2026-10-06-v06-mod-namespace-repair.md`. Adding this required dependency activates Mod loading in Serialization consumers, so native consumer gates must pass before qualification. No remote sync, publication or shared-builder Cargo was performed.
