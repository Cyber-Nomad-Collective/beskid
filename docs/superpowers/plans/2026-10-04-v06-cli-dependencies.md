# beskid 0.6 CLI and Dependencies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver one discoverable installed CLI with safe dependency mutation and predictable automation across Linux x64, macOS arm64, and Windows x64.

**Architecture:** Clap owns one canonical command grammar; commands delegate project selection, dependency planning and commit to the existing analysis authority. Separate BSOL text edits, resolution staging and recoverable file commit; reuse the Rust BSOL bootstrap syntax tree rather than waiting for native corelib BSOL. Ordinary execution continues through CommandSession and generation-bound semantic queries.

**Tech Stack:** Rust, Clap, existing reqwest/SHA-256/tempfile/ZIP workflow, Rust BSOL syntax spans, pnpm editor/site consumers, native installed artifacts.

**Spec:** `docs/superpowers/specs/2026-10-04-beskid-v0-6-release-design.md`; evidence: `docs/research/2026-10-04-v06-cli-ergonomics-research.md`.

## Global Constraints

- Rust Glue is required for 0.6.0; .NET is stretch.
- Native BSOL includes parser, writer, schema validation, and typed serialization/deserialization through shared serialization metadata.
- `build/run/test/check` must not silently upgrade dependency versions.
- Preserve comments and unrelated BSOL content: canonical serialization alone cannot satisfy manifest editing.
- Broad upgrade requires `--all`; bare `update` prints guidance.
- No legacy dispatch, invented Git materialization, partial range solving, credential copying, or alternate semantic frontend.
- All product edits follow coordinator-owned normative OpenSpec deltas; this plan does not edit standards. Impact analysis precedes symbol edits; HIGH/CRITICAL impact is reported before proceeding. Detect changes before each execution commit.
- This planning slice changes only this document and runs no product builds. Execution commits are local checkpoints; release integration follows coordinator authorization.

## Review Focus

- CRLF, Unicode offsets, comments adjacent to dependency blocks: untouched bytes remain identical (Task 2).
- Failure after replacing the first of two files and process death: next command recovers original manifest/lock before resolution (Task 3).
- Registry unavailable with an unpinned dependency: user mutation/build fails rather than succeeding with an unresolved note (Task 1).
- Workspace names, relative path dependencies and paths containing spaces: unique selection is required and paths resolve relative to the selected manifest (Tasks 2/4).
- Large child output and interrupted subprocesses: no pipe deadlock, stale child, interactive wait or success status (Task 6).

---

## Baseline reconciliation and prerequisites

Inspection baseline: root `f67ae4f2`, compiler `95c203ff12639b25e2c67b08da531e3715fef4c2`, in the isolated release checkout. The compiler is the published 0.5.2 revision. GitNexus query for CLI/dependency workflows reported an index 113 commits behind with partial search failures; current files were checked directly. Graph omissions are not evidence of missing capability.

Shipped facts from `compiler/crates/beskid_analysis/src/projects/workflow/registry.rs`: `select_registry_version` requires an exact non-yanked match when requested; it does **not** substitute another version. `ResolvedRegistryDependency` carries registry identity, selected version and SHA-256 digest; lock entries persist them; existing pins and materialized trees are verified; archive extraction stages before destination replacement. Preserve this hardening. Historical research statements about fallback and absent digests describe an earlier checkout and are superseded here.

Remaining source facts: unpinned, non-refresh registry lookup/download unavailability can return `Ok(None)`; fetch/update use `UnresolvedDependencyPolicy::Warn`. Bare selection follows first active server response order. `WorkspacePrepareOptions.refresh_lock` is global, so selective update needs a new scope. RunArgs has no trailing argv; AOT execution captures output with a 60-second timeout; main maps reports to exit 1. NewArgs selects a template and requires output rather than accepting a default app name. Root/app and dev declarations duplicate ordinary and internal routes.

Before execution, initialize `beskid_bsol`, `beskid_vscode`, website and common submodules at coordinator-pinned revisions; inspect their closest AGENTS.md. Resolve ABI-v5 installed kit and disposable registry fixture prerequisites through the release harness. Task 2's preserving Rust edit API is shared with the BSOL owner: publish this interface once and do not independently implement a second document editor. Runtime/Glue owners retain library discovery and ABI validation; Task 6 forwards their failures. Inspect direct callers and references for each modified existing symbol using current source; ignore GitNexus under the standing goal instruction.

## Required OpenSpec deltas and acceptance IDs

Coordinator creates a single coherent change before observable edits, updates catalog/delivery links, and links these IDs to scenarios. Existing capability paths below are relative to `openspec/specs/`.

| Acceptance ID | Capability and SHALL/scenario delta | Owning task |
|---|---|---|
| CLI06-01 | `tooling--cli--command-surface`: canonical root grammar below, no legacy dispatch; old spelling errors name the exact replacement; root help create/add/run sequence | 5/7 |
| CLI06-02 | `tooling--project-scaffolding--beskid-new` and `--project-templates`: bundled default app, offline creation, safe existing directory rejection, list/help without provisioning | 5 |
| DEP06-01 | `tooling--manifests-and-lockfiles--project-manifest-contract`: direct add/remove preserve all unrelated text; idempotent same intent, reject conflicting intent; workspace ambiguity scenario | 2/4 |
| DEP06-02 | `compiler--resolution-and-projects--registry-and-overrides-contract`: exact coordinates, hash-bound immutable pins, strict missing/yanked/network/malformed failures; retain shipped archive protections | 1 |
| DEP06-03 | `compiler--resolution-and-projects--workspace-and-lock-contracts`: selected closure refresh, explicit all, exact intent changes only with version, remove retains shared transitives, dry-run no writes | 1/4 |
| DEP06-04 | Same lock capability: locked rejects missing/drift, offline forbids requests and requires verified cached bytes, frozen combines locked+offline; ordinary resolution retains valid pins | 1 |
| DEP06-05 | `tooling--manifests-and-lockfiles--workspace-and-lock-contracts`: manifest/lock transaction recovery and concurrent-edit rejection; failure/interrupt preserves original visible pair | 3/4 |
| CLI06-03 | `tooling--cli--build-analyze-run-contract`: forwarded argv/stdout/stderr/status, inherited stdin, cancellation and noninteractive completion | 6 |
| CLI06-04 | `tooling--cli--command-surface`: versioned machine results, stderr diagnostics/progress, quiet/verbose/color, provisioning scoped to semantic/build commands, read-only doctor | 6 |
| CLI06-05 | `tooling--vscode-extension--workspace-project-explorer`, CLI and registry/scaffolding contracts: all active callers use canonical routes, explicit capability negotiation | 7 |
| CLI06-06 | CLI acceptance: installed three-platform journeys and observed help discovery >=4/5 within 60 seconds; >=4/5 create/add/use/run within five minutes | 8 |

Exact root: `new`, `check`, `build`, `run`, `test`, `fmt`, `doc`, `add`, `remove`, `update`, `package`, `toolchain`, `doctor`, `dev`. `new <name> [--template <template>]`, `new --list`; `update <package> [--version <version>] [--dry-run]` or `update --all [--dry-run]`. Dependency commands accept `--project`; add additionally accepts `--path`. Package children: search/info/pack/publish/login/logout plus template list/install/uninstall (existing service, explicit credential operations). Toolchain status/update uses existing verified installation operations. Internal syntax parse/tree/clif, project fetch/lock/graph, corelib, runtime-kit, mod, lsp, bsol validate/migrate, backend build inspection and experimental repl live under dev. Foreign authoring routes coordinate with the required Rust Glue plan; do not hide a required ordinary library consumption operation under dev. No format alias is approved by this plan: use fmt and actionable migration errors.

Policy decisions: CLI-owned success=0, operation failure=1, usage=2; run preserves numeric child status, Unix signal status=128+signal, Windows cancellation=130. `--frozen` means locked+offline everywhere. Bare registry add selects the greatest non-yanked stable semantic version by semantic-version precedence and records that exact version; stable has no prerelease component. Equal-precedence build-metadata variants use lexicographically greatest full version text as deterministic tie-break. Malformed/missing version data is an error. This evidence-backed refinement uses the existing artifact-bound registry semantic-version contract and is frozen in `v06-cli-dependencies`; it supersedes the initial conditional server-response ordering proposal. No semantic-version range solving is introduced. Existing wildcard intent may select under this policy; newly added intent is exact. Selected update without --version keeps exact intent/pins; it may refresh eligible non-exact existing intent and necessary closure. `--all` is explicit refresh scope, not permission to rewrite exact intents. Range expressions and dependency Git flags are usage errors.

## File and interface boundaries

All compiler paths below are relative to `compiler/`.

- Existing `crates/beskid_analysis/src/projects/workflow/{prepare,registry,lockfile,archive,filesystem}.rs`: sole resolver, cache/integrity, portable lock and materialization authority. Add `resolution.rs` for staged plan and `transaction.rs` for pair commit/recovery; export via workflow.rs/projects/mod.rs.
- New `crates/beskid_analysis/src/projects/dependency_edit.rs`: typed intent/selection/mutation planner, consumes preserving BSOL editor. New `manifest_edit.rs`: span edits only, isolated behind EditManifest contract; shared bootstrap BSOL mechanism, not canonical writer.
- Existing `crates/beskid_cli/src/cli/{app,dev,docs}.rs`, cli.rs, main.rs, project_args.rs: grammar/help, dispatch, status and common flags. New `commands/{add,remove,check,package,toolchain,doctor}.rs`; update existing new/update/format/run; commands/mod.rs exports.
- New `crates/beskid_cli/src/output.rs`: versioned results/diagnostics and terminal policy. Existing `crates/beskid_tools/src/session.rs` and progress frontend consume policy without duplicating resolution. Existing `crates/beskid_aot/src/run.rs`: shared argument/capture execution; new CLI `commands/run_process.rs`: inherited-stream user subprocess and cancellation.
- Existing `crates/beskid_template/src/{service,instantiate,sources,post_actions}.rs`: bundled source and canonical post-actions. New `crates/beskid_template/bundled/app/` contains checked-in minimal app manifest/source/template metadata.
- Tests: new analysis `tests/{dependency_resolution_v06,dependency_edit_v06,dependency_transaction_v06}.rs`, CLI `tests/{command_surface_v06,automation_v06}.rs`; extend e2e `src/tests/{dependency_workflow,workflow_matrix,cli_cross_platform,failure_contracts}.rs` and harness/cli.rs. No duplicate resolver in test harness.

Public new interfaces use PascalCase identifiers per repo conventions; migrate modified legacy callers completely:

```rust
ResolutionPolicy { locked: bool, offline: bool, refresh: RefreshScope }
RefreshScope::{None, Selected(BTreeSet<String>), All}
ResolveDependencies(plan: &ProjectWorkspacePlan, policy: &ResolutionPolicy)
    -> Result<StagedResolution, ProjectError>
SelectDependencyProject(start: &Path, explicit: Option<&Path>)
    -> Result<PathBuf, ProjectError>
DependencyMutation::{Add(DependencyIntent), Remove(String), Update { package: Option<String>, version: Option<String>, all: bool }}
DependencyIntent { name: String, source: DependencyIntentSource }
DependencyIntentSource::{Registry { registry: Option<String>, version: String }, Path(PathBuf)}
EditManifest(original: &str, mutation: &DependencyMutation)
    -> Result<String, ProjectError>
PlanDependencyChange(manifest: &Path, mutation: &DependencyMutation,
    policy: &ResolutionPolicy) -> Result<DependencyChangePlan, ProjectError>
CommitDependencyChange(plan: DependencyChangePlan) -> Result<DependencyChangeReport, ProjectError>
RecoverDependencyTransaction(project_root: &Path) -> Result<(), ProjectError>
```

StagedResolution owns staged artifacts and serialized lock bytes, with no visible manifest/lock write. DependencyChangePlan owns original bytes/identity, replacement bytes, staged resolution and report; report lists deterministic added/removed/retained coordinates and old/new version+digest. Dry-run drops plan after reporting. Never rely on public access to private lock fields: use existing getters and add artifact_digest getter in lockfile.rs. Resolution APIs take a parsed workspace plan; staged manifest parsing uses existing parser/lowering with original parent directory as resolution base.

### Task 1: Strict resolution, scope and network policy

**Files:** workflow.rs; workflow/{resolution,registry,prepare,lockfile,filesystem}.rs; project_args.rs; beskid_tools/src/session.rs; tests/dependency_resolution_v06.rs.
**Interfaces:** Produce ResolutionPolicy, RefreshScope, StagedResolution and ResolveDependencies above; retain existing preparation entry points only until all callers migrate within this task, then remove superseded boolean refresh path.

- [ ] Write failing `dep06_strict_unpinned_failures`, `dep06_preserves_digest_and_exact_pin`, `dep06_selected_closure`, `dep06_offline_verified_cache`, `dep06_locked_and_frozen`: disposable registry includes exact missing/yanked, malformed JSON, 503, tampered same-coordinate ZIP, two independent dependencies with shared transitive. Assert errors/no substitution; selected refresh leaves unrelated coordinates byte-identical; offline request counter=0, warm valid cache succeeds, cold/tampered fails; missing/drift locked fails and frozen also forbids network.
- [ ] Run `cargo test -p beskid_analysis --test dependency_resolution_v06`; expect new policy behavior tests to fail on current implementation.
- [ ] Implement resolver plan/commit separation, stable selection policy, verified digest-addressed archive cache and selective closure pin reuse. Every required unresolved dependency is an error for application workflows; inspection warnings never authorize executable success. Existing ZIP/path/tree hardening remains in the shared path. Emit selected package/version/registry and recovery command without URL credentials.
- [ ] Run the focused test plus `cargo test -p beskid_analysis registry`; all pass, including shipped hardening coverage. Record DEP06-02/03/04 evidence and commit affected files after direct source impact/diff review.

### Task 2: Preserving intent edits and project selection

**Files:** projects/{manifest_edit,dependency_edit,discovery,parser}.rs; tests/dependency_edit_v06.rs; shared Rust BSOL editor seam agreed with R3.
**Interfaces:** Produce DependencyIntent, DependencyMutation, EditManifest, SelectDependencyProject; consume source spans from current BSOL parser, not serde/canonical writer.

- [ ] Write `dep06_preserves_bsol_bytes`, `dep06_ambiguous_project`, `dep06_add_conflict`, `dep06_path_base`: CRLF/Unicode/comments/attributes/unrelated blocks survive add and remove outside edit spans byte-for-byte; repeated identical add/remove is no-op; conflicting source/version fails unchanged; ambiguous workspace returns sorted manifest candidates and --project guidance; explicit member alone changes; relative path uses selected manifest parent; duplicate malformed dependency blocks reject before edit.
- [ ] Run `cargo test -p beskid_analysis --test dependency_edit_v06`; expect missing edit interface failures.
- [ ] Implement minimal insertion/replacement/removal using validated byte spans; preserve untouched text. Resolve unique projects through existing discovery/workspace rules, never first-member heuristics. Parse edited text again before resolution.
- [ ] Run the focused test and `cargo test -p beskid_analysis projects::parser`; pass; record DEP06-01 and commit after direct source impact/diff review.

### Task 3: Recoverable manifest/lock commit

**Files:** workflow/transaction.rs, dependency_edit.rs, workflow.rs; tests/dependency_transaction_v06.rs.
**Interfaces:** Produce PlanDependencyChange, CommitDependencyChange, RecoverDependencyTransaction and report; consume Tasks 1/2.

- [ ] Write `dep06_rollback_every_boundary`, `dep06_recover_interrupted_commit`, `dep06_concurrent_edit`: inject resolution/hash/fsync/first replacement/second replacement failures; assert original manifest/lock bytes and original missing-lock state restored; kill subprocess after first replace then next invocation recovers; externally changed source rejects commit without overwriting external edits. Dry-run leaves manifest/lock/materialized project paths absent or unchanged.
- [ ] Run `cargo test -p beskid_analysis --test dependency_transaction_v06`; expect failure on absent transaction implementation.
- [ ] Implement exclusive project transaction guard, same-filesystem temporary replacements and private recovery journal containing original pair, staged pair and commit state. Sync journal before visible replacement; sync directories; recover before project reads. Two file renames alone are not atomic. Ignore journal in source control; reject symlink/foreign-owned destinations. Cache staging may survive; do not expose partial materialized project success. Rollback/recovery failure is a terminal diagnostic with exact recovery guidance.
- [ ] Run focused tests on native targets (Windows rename semantics included); record DEP06-05 and commit after direct source impact/diff review.

### Task 4: Direct add/remove/update commands

**Files:** commands/{add,remove,update,mod}.rs; CLI tests/command_surface_v06.rs; e2e dependency_workflow.rs/workflow_matrix.rs.
**Interfaces:** Clap AddArgs/RemoveArgs/UpdateArgs construct DependencyMutation, call selection/planning once and commit once. Add returns exact selected intent; --dry-run on update reports the same plan without commit.

- [ ] Write `cli06_add_registry_and_path`, `cli06_remove_shared_transitive`, `cli06_update_scope`: new project adds fixture package, uses exported symbol, builds/runs; path addition needs no manual edit; repeated add/remove succeeds unchanged; removing direct package retains shared reachable transitive; bare update and package+--all conflict return 2 with guidance; exact change requires --version; --all leaves exact intent unchanged; dry-run has no visible writes. Missing/yanked/network/hash failures return 1 and identical original pair.
- [ ] Run `cargo test -p beskid_cli --test command_surface_v06` and `cargo test -p beskid_e2e_tests dependency_workflow`; expect new grammar failures.
- [ ] Implement commands atop Tasks 1–3, including package@version parsing and conflicting --path/version rejection; reject Git/ranges explicitly. Report mutation effects and command to run next.
- [ ] Repeat focused tests; DEP06-01 through DEP06-05 pass; commit after direct source impact/diff review.

### Task 5: Canonical command surface and bundled creation

**Files:** cli/{app,dev,docs}.rs, cli.rs, commands/{new,check,package,toolchain,doctor,format,mod}.rs; beskid_template files above; tests/command_surface_v06.rs.
**Interfaces:** check delegates shared semantic gate; package wrapper translates search/info/pack/publish/login/logout to existing registry services; toolchain wrapper delegates verified updater. Doctor gathers read-only tool/runtime-kit observations. New maps name to bundled app selector/output/name, with --template override and --list read-only.

- [ ] Write `cli06_root_help`, `cli06_legacy_guidance`, `cli06_new_offline`, `cli06_no_provision_help`: root set equals specified grammar; root help includes create/add/run; old root parse/tree/analyze/pckg/up/lsp etc return 2 and exact replacement; duplicate dev test/fmt/doc/update rejected; help/package search/doctor/new --list work without corelib; new app succeeds offline with empty template cache, existing nonempty directory fails unchanged; fmt default edits selected source and --check fails on needed edits.
- [ ] Run `cargo test -p beskid_cli --test command_surface_v06` and `cargo test -p beskid_template`; expect current route/default creation mismatches.
- [ ] Implement consolidated enum/dispatch, remove old handlers/routes and backend global logging, scope provisioning by command needs, add bundled app and move template management to package template. Preserve service capabilities via canonical dev routes where they are internal; do not leave hidden alias dispatch. Doctor never installs or writes credential configuration.
- [ ] Repeat focused tests; CLI06-01/02 pass; commit after direct source impact/diff review.

### Task 6: Streams, status, terminal behavior and JSON

**Files:** main.rs, cli/app.rs, output.rs, commands/{run,run_process,build,test,doctor}.rs; beskid_aot/src/run.rs; beskid_tools/src/session.rs and existing progress frontend; tests/automation_v06.rs.
**Interfaces:** new `CommandOutcome { exitCode: i32 }`; dispatch returns Result<CommandOutcome>; `RunProgram(path: &Path, args: &[OsString]) -> Result<CommandOutcome>` inherits stdin/stdout/stderr, forwards cancellation and reaps child. AOT captured helper gains args parameter and drains both pipes concurrently; migrate every caller. `EmitResult(writer: &mut dyn Write, result: &CommandResultV1) -> io::Result<()>` emits schemaVersion=1 NDJSON.

- [ ] Write `cli06_argv_status_streams`, `cli06_interrupt`, `cli06_redirected_plain`, `cli06_machine_output`: argv preserves empty argument/spaces/Unicode/leading dash after --; child exits 7 -> CLI 7, separate byte-exact output streams, stdin works; >pipe-capacity output completes; interrupt reaps child and nonzero status; redirected build/test no ANSI/alternate screen/prompt/key wait; help has no provisioning; JSON check/build/test/add/remove/update/doctor records schemaVersion=1, command, event, status, diagnostics or change data with stable code/span, no human text on stdout. run reserves stdout for child and rejects --json with guidance; do not envelope arbitrary child output.
- [ ] Run `cargo test -p beskid_cli --test automation_v06` and `cargo test -p beskid_aot run`; expect argv/status/output mismatches.
- [ ] Implement inherited-stream public execution without current unconditional 60-second timeout; captured bounded helper stays for tests/internal callers. OutputPolicy uses TTY detection, quiet/verbose and color auto/always/never; non-TTY implies plain. Route progress/compiler diagnostics to stderr and schema-controlled results to stdout. No success after cancellation or failed test subprocess.
- [ ] Repeat focused tests on three targets; CLI06-03/04 pass; commit after direct source impact/diff review.

### Task 7: Complete active consumer migration

**Files:** `beskid_vscode/src/commands/{registerCoreCommands,lspCommands,packageCommands}.ts`, current CLI launcher/services identified through direct source audit; `compiler/crates/beskid_template/src/post_actions.rs`; compiler e2e harness/tests and justfile; `scripts/ci/{cli-surface-inventory.mjs,linux-package-derivative.mjs}` and active native acceptance scripts; `site/website/src/data/pinned-cli-reference.json`, current docs/book/reference CLI pages and generated navigation; pckg site copy snippets.
**Interfaces:** canonical capability document generated from Clap (schemaVersion=1, CLI version, commands/output schemas), editor negotiates required canonical operations and fails with upgrade guidance when absent; no fallback invocation of retired grammar.

- [ ] Write migration tests: canonical pinned inventory equals installed help; editor launch arrays use dev lsp/check/package as appropriate; template post-actions invoke new paths; CI gate fixture expects check/fmt and canonical runtime-kit route. Audit active files with `rg -n 'beskid (analyze|format|fetch|lock|pckg|up|lsp|runtime-kit|corelib|validate-bsol|migrate-bsol)' scripts compiler beskid_vscode site/website`; classify historical 0.5 intent/provenance evidence separately and preserve its exact historical bytes.
- [ ] Run `node --test scripts/ci/cli-surface-inventory.test.mjs` (create focused test if absent); editor `pnpm test` and website `pnpm build` using their pinned package scripts; expect obsolete contract checks to fail before edits. Read package.json first and replace command with documented equivalent if test script differs; record exact chosen command in evidence.
- [ ] Migrate every active caller, including commands hidden in arrays/launch configs, release gates, docs copy buttons, templates and package UI. Generate inventory/navigation with existing repository generators. Publish explicit old-to-new table; preserve old versioned documentation as historical, clearly linked to 0.6 docs. Regenerate completions from canonical grammar.
- [ ] Repeat those checks plus `cargo test -p beskid_e2e_tests workflow_matrix`; active old dispatch reference audit has zero unexplained findings; CLI06-05 passes; commit each owning repository after direct source impact/diff review.

### Task 8: Installed and observed acceptance

**Files:** e2e harness/cli.rs and tests/cli_cross_platform.rs; new `scripts/ci/v06-cli-installed-acceptance.mjs` and test; release evidence ledger/candidate manifest maintained by coordinator.
**Interfaces:** harness accepts exact installed executable path, isolated HOME/cache/workspace and fixture registry URL, records argv/status/streams/artifact digests; no checkout fallback or public service mutations.

- [ ] Write `cli06_installed_journey` harness test with fake CLI first to prove failure/status/timeout and source identity enforcement. Run `node --test scripts/ci/v06-cli-installed-acceptance.test.mjs`; prove failed operation cannot produce accepted evidence.
- [ ] Implement actual scripted new/add/use/check/build/run/test/fmt/doc/remove/update/path/ambiguity/locked/offline/hash-tamper journey. Restore fixture workspaces per case; pin registry artifact bytes and toolchain/runtime-kit candidate digests. Execute installed Linux x64/macOS arm64/Windows x64 outside checkout using native candidate packages; no cross-host pass substitution.
- [ ] Run `node scripts/ci/v06-cli-installed-acceptance.mjs --manifest <frozen-candidate-manifest> --output <evidence-path>` on each native host; all required IDs pass with status/streams and identity-bound evidence. A failed cell blocks release and opens a reproduced fix; repeat only affected cells after fixes then freeze fresh source/artifact identities.
- [ ] Observe five fresh users with installed CLI and help alone: >=4/5 find add <=60 seconds and complete create/add/use/run <=five minutes. Record actual commands/time/failures without coaching or substituting snapshots. Coordinator supplies participants; automated correctness work proceeds independently until observations are available.
- [ ] Coordinator verifies all CLI06/DEP06 scenario evidence, updates changelog/docs and acceptance matrix; source-bound whole-branch review closes this slice. No publication is performed by this planning slice.

## Self-review and handoff

Coverage: every CLI design obligation maps to tasks/IDs; R2/R3/R4 native APIs and Rust Glue internals stay in their subsystem plans. CLI consumes shared manifest editing and Glue/runtime failure contracts. Interfaces defined above match consuming tasks; no range/Git implementation is implied. Transaction durability, span preservation, cache policy, cancellation and project ambiguity each have explicit red-green tests. Planning checks are source reads only; all implementation/installed commands above remain unrun.
