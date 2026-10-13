# 0.6.0 release case binding plan

Date: 2026-10-13. Read-only analysis of the worktree at `/Users/mikserek/.codex/worktrees/v06-release/beskid`; no builds, no Cargo, no git state changes. This document decides how each of the 85 unbound cases in `scripts/ci/release-cases-v06.json` is bound or moved to the provisional set, what the release matrix machinery must gain to accept those bindings, and how the work splits into three parallel slices with disjoint files. It is a plan, not evidence: nothing here qualifies a case.

## 1. Summary

Coordinator ruling applied (2026-10-13): the Glue spec was split. Delivered 0.6 Rust Glue is the in-process checked C ABI owned path (`openspec/changes/v06-rust-glue-integration`); the stdio bridge and the seven Glue Mod contracts moved to the provisional change `openspec/changes/v06-glue-stdio-bridge-provisional` (no 0.6 obligation, fail closed) and the contracts were deleted. Consequently R4-IO-01..12 and R4-GEN-04..06 leave the 0.6 mandatory set (section 6.4), the `rust_profile.transport: "stdio"` field and `required_obligations.stdio` are removed, and 70 cases remain to bind.

| Decision | Cases | Count |
| --- | --- | --- |
| (a) bind to existing native Beskid tests, no new test needed | BSOL-06-03, BSOL-06-05, BSOL-06-06, BSOL-06-07, SER-06 | 5 |
| (b) native Beskid tests, existing plus new tests in a named `corelib_tests` target | SER-01, SER-02, SER-03, SER-05, DYN-06-01..05, BSOL-06-02, BSOL-06-04, BSOL-06-08, BSOL-06-09, R4-PROC-01..06 | 20 |
| (c) host-level obligation: new execution kind `installed_host_harness` (Rust test executable driving the installed candidate) | CLI06-01..05, CLI06-06 (scripted half), DEP06-01..05, MOD-06-01, MOD-06-02, SER-04, BSOL-06-01, R4-BIND-01..04, R4-ABI-01..12, R4-CALL-01..04, R4-GEN-01..03, R4-TOOL-01..08 | 44 |
| (d) not machine-verifiable as written: CLI06-06 five-user observation | CLI06-06 (observation half) | 1 (same ID as the scripted half) |
| (e) moved to the provisional change, recorded but not evaluated | R4-IO-01..12, R4-GEN-04..06 | 15 |

Three facts drive the plan:

1. Only one execution kind exists today (`installed_native`), and the reader `ValidateV06FeatureEvidence` accepts only `harness_language` `node` or `beskid`. 44 cases are host-level (CLI journeys, registry transactions, Mod host failures, Rust Glue toolchain and generation). They need a second execution kind. The precedent already exists in source: `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` is a Rust harness that fails closed without `BESKID_V06_QUALIFIED_PREFIX`, runs only the installed CLI (`run_installed_build`, line 1342) and never the build-tree binary.
2. The reader contract (`scripts/ci/woodpecker-release-evidence.mjs:336-470`) was proven only against synthetic fixtures. Several of its equalities cannot hold for real evidence across three targets (section 3.2). They must be corrected before any real binding can validate, independent of which cases are bound.
3. Two existing Beskid test projects that hold candidate assertions are not in the installed prefix: `compiler/runtime/beskid/tests/runtime_semantics` (DYN cases) and the shared BSOL corpus in `beskid_bsol/conformance/cases` (BSOL-06-01/03/04/09). The bundle ships only the Corelib workspace (`compiler/corelib/CoreLib.bws` members; `scripts/ci/build-release-artifact.sh:137-160`). DYN tests therefore move into `corelib_tests`; the corpus becomes a retained packet input.

## 2. Inputs read

- `scripts/ci/release-cases-v06.json` as checked in (101 cases before the provisional move, `state: binding_required`, policy block, `rust_profile` 17 x 2 x 2, `required_obligations` 5/7/6/12).
- `scripts/ci/woodpecker-release-evidence.mjs` (schema-2 reader, `V06_CASE_MANIFEST_SHA256` pin at line 188), `scripts/ci/test/v06-release-matrix.test.mjs`, `scripts/ci/woodpecker-feature-evidence.mjs` (v1 producer: `beskid test --plain --json --project <bundle>/beskid_corelib/CoreLib.bws --target <T>`), `scripts/ci/woodpecker-build-platform.sh`, `scripts/ci/woodpecker-aggregate-release.mjs`, `scripts/ci/release-publication-eligibility.mjs`, `scripts/ci/windows-installer-owner-waiver.mjs` and its consumer `scripts/ci/woodpecker-release.sh:181-197`.
- `docs/research/2026-10-06-v06-acceptance-binding-audit.md`, `docs/reports/2026-10-12-v06-test-audit.md`, `docs/reports/2026-10-06-v06-handoff.md`.
- OpenSpec changes `v06-cli-dependencies`, `v06-serialization-bsol`, `v06-rust-glue-integration`, `v06-release-qualification` (specs, tasks, design) and the provisional `v06-glue-stdio-bridge-provisional` (proposal, tasks 1.2: "Remove R4-IO-01..12 and R4-STDIO-12..22 from the 0.6 required release cases, or mark them provisional").
- Native suites under `compiler/corelib/beskid_corelib/tests/corelib_tests/src/**` (667 `test` items in 113 targets per the test audit; target list in `corelib_tests.bproj`), `compiler/corelib/mods/serialization_mod/Tests/*.bd`, `compiler/runtime/beskid/tests/runtime_semantics/src/*.bd`.
- Rust tests: `beskid_cli/tests/*.rs`, `beskid_analysis/tests/dependency_*_v06.rs`, `beskid_analysis/tests/structural_contribution_arena.rs`, `beskid_analysis/tests/native_mod_*_v06.rs`, `beskid_codegen/tests/{glue_binding_facts,rust_glue_backend}.rs`, `beskid_aot/tests/glue_*_v06.rs`, `beskid_glue/tests/stdio_peer.rs`, `beskid_abi/tests/process_transport_v06.rs`, `beskid_tests_interop/src/interop/glue_owned.rs`, `beskid_tests_interop/fixtures/glue/manual/**`.

## 3. Matrix machinery: what exists and what must change

### 3.1 Existing execution kind `installed_native`

Cell production (v1, `woodpecker-feature-evidence.mjs:76-90`): for each case run the installed CLI from the extracted bundle with `test --plain --json --project <bundle>/beskid_corelib/CoreLib.bws --target <Target> --target-timeout 900`; the JSON report has `target`, `summary`, `tests[].qualified_name/outcome`. Test ids are bare `test` names when the file declares no module (`beskid_queries/src/semantic_contract/syntax_facts.rs:386`), which matches the 16 baseline bindings. `beskid test` selects by `--include-tag`/`--exclude-tag`/`--group` only (`beskid_cli/src/commands/test.rs:30-40`); there is no per-name filter.

Reader acceptance for a native binding: `harness_language: "beskid"`, `harness_source` is a retained flat packet file whose bytes contain `test <id>` at a line start followed by `{` (lines 399-408), `command.argv[0]` is the installed CLI (line 414), and executed ids equal `required_test_ids` exactly (line 425).

### 3.2 Reader contract corrections (required before any real binding validates)

Implemented 2026-10-13 (slice B) together with the review findings of `docs/research/2026-10-13-binding-plan-review.md`: executed outcomes derived from retained raw output (subset rule), installed invocation proof lines, flat `cli.relative_path` plus `packet_copy` receipt fields compared by segments, sibling build-log directory for exact packet closure, release-series schema dispatch, canonical manifest bytes as the digest input, and library-level tests as `related_evidence`.

These were acceptable for the synthetic fixture (which writes outputs first and bindings second) but are impossible for a frozen manifest shared by three targets:

| Line | Current rule | Problem | Correction |
| --- | --- | --- | --- |
| 411 | `equalValue(row.command, binding.command)` | `binding.command.argv[0]` is an absolute packet path; it differs per target and per packet root, so one frozen manifest digest cannot hold | Binding stores a template: `argv: ["{installed_cli}", "test", ...]`, `tool_file: "{cli}"`; the reader substitutes `expected.installed_cli` / `installed.cli.path` before comparing |
| 417-421 | `row.stdout_sha256 === binding.stdout.sha256` (same for stderr, artifact) | Output digests are only known after execution and differ per target | Binding pins inputs only (`harness_source`, `input`); the row carries `stdout_sha256`, `stderr_sha256`, `artifact_sha256`, each verified against the retained packet file and the 8 MiB bound. `artifact` becomes a per-target entry (section 3.4) |
| 425 | executed ids must equal `required_test_ids` exactly | `beskid test` runs a whole target; `CoreSuite` has 94 tests but `foundations.core_bytes` requires 10. The 16 baseline bindings already violate this | `required_test_ids` must be a subset of the executed passed ids; every executed test in the row must still be `passed` (no failed, skipped, filtered_out, timed_out entry anywhere in the target). RED test: a required id absent from the executed set rejects; a non-required failed test in the same target rejects |
| 394, 399 | `harness_language` in `{node, beskid}` | No Rust declaration grammar | Add `rust`: declaration `fn <id>(` at a line start whose preceding line is exactly `#[test]`; the bytes after the declaration must match `/^\)\s*(->\s*[^{]+)?\{/` |
| 414 | `argv[0] === expected.installed_cli` for every case | A host harness executable is argv[0] | Dispatch on `item.execution` (section 3.3) |
| 601 | `manifest.packet_files` is one flat list | Harness executables carry `.exe` on Windows; executed artifacts differ per target | `packet_files` (target-neutral) plus `target_packet_files[target]` |
| 353 | `not_applicable` must be exactly `{dotnet_glue: "stretch"}` | Correct, keep | None |

The manifest `state` stays `binding_required` until the freeze tool (section 3.5) writes `frozen`; the reader keeps rejecting unfrozen manifests.

### 3.3 New execution kind `installed_host_harness`

Purpose: run a reviewed Rust test executable, built from the same compiler commit, against the installed candidate prefix on each target. The policy intent is preserved: the only compiler the harness may invoke is `<prefix>/bin/beskid`; the harness fails closed when the prefix is absent (no skip); every assertion is a `#[test]` declaration in retained consumed source; the harness executable and the executed fixture artifact are digest-pinned per target.

Manifest additions:

```json
"harness_executables": {
  "beskid_tests_release": { "crate": "beskid_tests_release", "source_root": "compiler/crates/beskid_tests_release" },
  "beskid_tests_interop": { "crate": "beskid_tests_interop", "source_root": "compiler/crates/beskid_tests_interop" }
},
"target_packet_files": {
  "x86_64-unknown-linux-gnu": ["harness-beskid_tests_release", "harness-beskid_tests_interop", "fixture-beskid_release_fixture"],
  "aarch64-apple-darwin": ["harness-beskid_tests_release", "harness-beskid_tests_interop", "fixture-beskid_release_fixture"],
  "x86_64-pc-windows-msvc": ["harness-beskid_tests_release.exe", "harness-beskid_tests_interop.exe", "fixture-beskid_release_fixture.exe"]
},
"provisional_cases": [
  { "id": "R4-IO-01", "spec_change": "v06-glue-stdio-bridge-provisional", "moved_from": "v06-rust-glue-integration",
    "reason": "stdio bridge is provisional for 0.6; fails closed, not evaluated" },
  "... R4-IO-02..12, R4-GEN-04..06 in the same shape"
]
```

`policy.all_cases_mandatory` stays `true` and keeps its meaning: every entry of `cases` is mandatory. The provisional IDs are removed from `cases` (86 remain: 16 baseline plus 70 to bind) and listed under `provisional_cases`, which the reader treats as a deny list: an evidence row, profile row or obligation row naming a provisional id rejects (`provisional case cannot be evaluated`), and the reader never requires one. `required_obligations.stdio` and `rust_profile.transport` are deleted; `rust_profile.process_scheduler` stays because R4-PROC remains mandatory. Section 6.4 lists the moved cases.

Case binding shape (host kind):

```json
{ "id": "DEP06-02", "execution": "installed_host_harness",
  "binding": { "harness": "beskid_tests_release", "harness_language": "rust",
    "harness_source": { "path": "source-beskid_tests_release-dependency_journeys_v06.rs", "sha256": "<source bytes>" },
    "required_test_ids": ["dep06_02_exact_request_fails_without_substitution", "..."],
    "command": { "argv": ["{harness}", "--exact", "{test_id}", "--test-threads=1"], "tool_file": "{harness}",
      "installed_cli": "{installed_cli}", "env": { "BESKID_V06_QUALIFIED_PREFIX": "{installed_prefix}" } },
    "input": { "path": "input-dep06-registry-fixtures.tar", "sha256": "..." },
    "assertion_provenance": [ { "test_id": "...", "source": {...}, "start": 0, "end": 0, "declaration": "fn ...(" } ],
    "reviewed_source_binding": true, "log": "case-DEP06-02.json" } }
```

Cell production on each target (new `scripts/ci/woodpecker-release-cases-v06.mjs`, section 3.4):

1. The harness executables are built once per target in `scripts/ci/build-release-platform.sh` with `cargo test --no-run --locked --release --target <T> -p beskid_tests_release -p beskid_tests_interop --message-format=json`, with `BESKID_COMPILER_DRIVER_BUILD_RECEIPT` set to the driver receipt of the same build (required by `glue_owned.rs:14-17`). Executables are copied into the platform output as `harness-<crate>[.exe]`; the fixture binary (section 6.3) as `fixture-beskid_release_fixture[.exe]`.
2. For each case the producer runs one process per required id: `<harness> --exact <id> --test-threads=1` with `BESKID_V06_QUALIFIED_PREFIX=<extracted bundle>`, `BESKID_V06_RELEASE_FIXTURE=<fixture path>`, the pinned Rust tool variables for Glue (`BESKID_V06_GLUE_CARGO/RUSTC/LINKER`), a private `BESKID_HOME`/`BESKID_CONFIG_DIR`, and a bounded timeout. libtest output is stable text: `running 1 test` and `test result: ok. 1 passed` mean `passed`; `running 0 tests` means `not_executed`; nonzero exit means `failed`; expiry means `timed_out`. No nightly JSON format is needed.
3. Per case the producer retains concatenated stdout/stderr (bounded), the per-id outcomes, `command` with the resolved argv/env, `artifact_sha256` of the fixture binary, and `case-<id>.json`.

Reader verification for this kind: `row.command.argv[0]` is the packet harness file named by `harness_executables[binding.harness]` and present in `target_packet_files[target]` with digest `tool_sha256`; `row.command.installed_cli === expected.installed_cli`; `row.command.env.BESKID_V06_QUALIFIED_PREFIX === installed.prefix`; `harness_source` bytes are the retained `.rs` file and every provenance span is a `#[test]`-preceded `fn <id>(`; executed ids cover `required_test_ids`, all `passed`.

What this kind does not permit: invoking a build-tree `beskid_cli` (`env!("CARGO_BIN_EXE_beskid_cli")`, as `beskid_cli/tests/glue_rust_build_v06.rs:60` does today), reading `BESKID_RUNTIME_PREFIX` fallbacks, or skipping. The harness crates' `lib.rs` provides one `installed_prefix()` helper that panics with the exact missing variable.

### 3.4 Producer gaps (v2 evidence does not exist yet)

`woodpecker-build-platform.sh` emits `woodpecker-build-result.json` without `installed_cli` and `runtime_abi_sha256`, and no `installed-prefix.json`, `runtime-kit.json`, `runtime-abi.json`, `feature-evidence-v2.json` or `release-cases-v06.json` copy; the reader requires all of them (lines 363-375, 600-614). The new producer `woodpecker-release-cases-v06.mjs` (selected when the version starts with `0.6.`; v1 stays for 0.5 history) writes them, keeps `installed_prefix.fallback_used: false` by refusing to run when `<prefix>/lib/beskid-runtime/abi-5/<target>/release/abi.json` is absent, and sets `BESKID_BSOL_CORPUS` to a temp extraction of the retained `input-bsol-corpus.tar` (the corpus lives in the `beskid_bsol` gitlink, pinned by the superrepo commit, and packet files must be flat).

### 3.5 Freeze tool

Byte offsets in `assertion_provenance` cannot be hand-written. Add `scripts/ci/freeze-release-cases-v06.mjs`: it merges binding fragments from `scripts/ci/release-case-bindings/{corelib,host,glue}.json` into `release-cases-v06.json`, copies each harness source into its flat packet name, computes `sha256`, locates each declaration (`test <id>` + `{` for Beskid, `#[test]\nfn <id>(` for Rust), fails on a missing or duplicated declaration, writes `state: "frozen"`, prints the manifest digest for `V06_CASE_MANIFEST_SHA256`, and refuses to freeze while any case has `binding: null`. The fragments are the hand-off contract between slices (section 8).

### 3.6 Spec label gaps to close before freeze

- `v06-cli-dependencies` specs label scenarios CLI06-01, -02, -04, -05, -06 and DEP06-01..05; no scenario carries CLI06-03. Label the `Stable CLI command families`, `Ordinary terminal interaction` and `Program arguments streams and outcome` scenarios (`tooling--cli--command-surface`, `tooling--cli--build-analyze-run-contract`) as CLI06-03.
- `compiler--codegen-and-ir--dynamic-types-and-mapping` scenarios carry no DYN-06-0x labels; section 5.2 proposes the mapping to write in.
- `language-meta--interop--*` specs label only ranges (`R4-ABI-01..12`, `R4-CALL-01..04`); section 6.1 proposes one scenario label per ID so each case has a distinct obligation. The `v06-rust-glue-integration` specs still contain stdio text (`language-meta--interop--beskid-glue/spec.md`, `rust-abi-profile` "terminates the bridge" wording, `backends-jit-aot` Glue Mod scenarios R4-GEN-04..06); the coordinator's split must leave those files free of R4-IO/R4-GEN-04..06 scenarios and of `R4-STDIO-*` references before the manifest freeze, or the OpenSpec gate and the manifest disagree.
- The audit's item 5 stands for the remaining families: R4-OWN-*, R4-PROC-07..19 and R4-ABI-18..21 are normative leaf scenarios outside the manifest IDs. They are linked below under the coarse IDs they refine (R4-ABI-10, R4-PROC-01..06, R4-CALL-03/04) rather than expanding the manifest. R4-STDIO-12..22 moved with the provisional change.

## 4. Fix for `scripts/ci/test/v06-release-matrix.test.mjs:121`

Line 121 asserts `planned.cases.every(item => item.binding === null || item.binding.required_test_ids === null)`. The 16 baseline cases now carry non-null `required_test_ids`, so the first test fails on the current manifest. Replace the test body:

```js
test("the draft manifest retains all mandatory IDs and only reviewed bindings", () => {
  assert.equal(planned.cases.length, 86);
  assert.equal(planned.cases.filter(item => item.spec_change === null).length, 16);
  assert.equal(new Set(planned.cases.map(item => item.id)).size, 86);
  assert.equal(planned.provisional_cases.length, 15);
  assert(planned.provisional_cases.every(item => item.spec_change === "v06-glue-stdio-bridge-provisional"));
  assert(!planned.cases.some(item => planned.provisional_cases.some(moved => moved.id === item.id)));
  assert.equal(planned.rust_profile.transport, undefined);
  assert.equal(planned.required_obligations.stdio, undefined);
  const bound = planned.cases.filter(item => item.binding !== null);
  for (const item of bound) {
    const ids = item.binding.required_test_ids;
    assert(Array.isArray(ids) && ids.length > 0 && new Set(ids).size === ids.length, `${item.id} binding must list unique test ids`);
    assert(typeof item.binding.target === "string" || typeof item.binding.harness === "string", `${item.id} binding must name a target or harness`);
  }
  if (planned.state === "frozen") assert.equal(bound.length, planned.cases.length);
  else assert(planned.cases.some(item => item.binding === null), "an unfrozen manifest has at least one unbound case");
  assert(!planned.cases.some(item => item.binding?.project === "reader-fixture"), "synthetic fixture bindings never enter the manifest");
});
```

The same file needs, in the same slice: `fixture()` must build kind-aware bindings (native, host, baseline) rather than one shape for all cases; the fixture's obligation placement (`R4-IO-01` for stdio) and the stdio loop in `every ownership failure process and stdio obligation...` go away; new RED tests for the section 3.2 corrections (template substitution, subset rule, `rust` declaration grammar, `target_packet_files`, `installed_cli`/env checks); a RED test that a feature row, profile row or obligation row naming a provisional id (for example `R4-IO-01`) rejects; and `nativeDeclarationFixture` keeps using the real `SerializationWireTests.bd` declaration. The test `unbound obligations and the v0.5 Glue exemption cannot qualify 0.6` stays: the provisional move is not an exemption of a mandatory case, and `not_applicable` still admits only `dotnet_glue`.

## 5. Per-case decisions: CLI, dependencies, serialization, Mod, Dynamic, BSOL

Legend: target names are `corelib_tests.bproj` targets unless stated; `NEW` marks a test to write; harness names refer to section 3.3.

### 5.1 CLI06 and DEP06 (all execution kind `installed_host_harness`, harness `beskid_tests_release`)

The existing Rust tests (`offline_policy_v06.rs`, `dependency_*_v06.rs`, `cli_inventory.rs`, `toolchain_ownership_v06.rs`) prove behavior with the build-tree CLI or at the library layer. None runs the installed candidate, so none can be bound as-is. The harness crate `compiler/crates/beskid_tests_release` (new) re-homes them against `<prefix>/bin/beskid` and adds the scenario tests the specs name. Fixture support (loopback registry, fault injection, CRLF/Unicode manifests) comes from the existing `beskid_tests_support`/`beskid_tests_projects` helpers as dev-dependencies.

| Case | Spec scenarios | Decision | Harness file and test ids |
| --- | --- | --- | --- |
| CLI06-01 | First-use help | (c) NEW | `tests/cli_journeys_v06.rs`: `cli06_01_root_help_shows_add_example_and_new_add_run_sequence`, `cli06_01_add_help_explains_effects_project_targeting_and_recovery` |
| CLI06-02 | Offline default, Template override, Existing output | (c) port + NEW | `cli06_02_new_offline_bundled_app_builds_checks_runs` (port of `v06_new_explicit_offline_uses_bundled_app_without_registry_requests` plus `check`/`build`/`run` of the result), `cli06_02_new_template_override_binds_name_and_output`, `cli06_02_new_nonempty_output_rejected_byte_for_byte`, ports of `v06_new_offline_local_template_resolves_without_network`, `v06_new_offline_installed_template_checks_bytes_before_output`, `v06_template_install_rejects_symlink_payload_and_cycle_before_cache_writes` |
| CLI06-03 | Canonical grammar, argv/status/streams (label to add, section 3.6) | (c) port + NEW | `cli06_03_inventory_matches_canonical_grammar` (port of the three `cli_inventory.rs` tests), `cli06_03_run_reserves_stdout_for_program_output_and_exit_codes_0_1_2`, `cli06_03_dev_repl_and_dev_project_graph_are_the_only_internal_routes` |
| CLI06-04 | No unrelated provisioning, Machine mutation, Child JSON rejection, Read-only doctor | (c) NEW | `cli06_04_help_new_list_doctor_without_corelib_or_network_make_no_provisioning_writes`, `cli06_04_update_dry_run_json_stdout_has_only_schema_version_1_records`, `cli06_04_run_json_exits_2_before_executing`, `cli06_04_doctor_reports_missing_kit_without_installing_or_touching_credentials` |
| CLI06-05 | Editor negotiation, Active consumers | (c) NEW, CLI half only | `cli06_05_dev_capabilities_json_lists_version_canonical_commands_and_schemas`, `cli06_05_completions_and_help_match_capability_inventory`. The editor half (VS Code refuses retired commands) is not a native cell; it stays in `scripts/ci/vscode-gate.sh` and the case binding records that gate as `related_evidence` |
| CLI06-06 | Qualification (scripted journeys) | (c) NEW | `cli06_06_create_add_use_check_build_run_outside_checkout`, `cli06_06_path_dependency_workflow_outside_checkout`. The uncoached-user half is section 7 |
| DEP06-01 | Text preservation, Repetition and conflict, Unsupported sources, Workspace ambiguity, Explicit member path | (c) port + NEW | `tests/dependency_journeys_v06.rs`: installed `add`/`remove` over the fixtures of `dependency_edit_v06.rs` (`dep06_01_add_preserves_crlf_unicode_comments_outside_edited_span`, `dep06_01_repeated_add_is_noop_and_conflicting_source_fails_without_rewrite`, `dep06_01_git_and_range_selectors_return_usage_guidance`, `dep06_01_workspace_ambiguity_lists_sorted_candidates_and_writes_nothing`, `dep06_01_explicit_member_with_spaced_relative_path_changes_only_that_member`) and `dep06_01_path_report_keeps_source_coordinates_without_manufacturing_a_version` (port of `dep06_path_report_describes_actual_added_and_removed_coordinate`) |
| DEP06-02 | Exact request, Required unavailable, Stable policy | (c) port | loopback registry: `dep06_02_exact_request_fails_without_substitution_and_pair_unchanged`, `dep06_02_malformed_response_and_503_fail_without_warning_success`, `dep06_02_bare_add_selects_greatest_stable_independent_of_response_order` (ports of `dependency_registry_v06.rs` bare-add/unavailable/yanked tests) |
| DEP06-03 | Scope and exact intent, Explicit version, Shared removal, Dry-run | (c) NEW | `dep06_03_update_without_scope_exits_2`, `dep06_03_selected_and_all_refresh_preserve_exact_intent_and_unrelated_pins` (extends `dep06_registry_selected_refresh_preserves_unselected_pin`), `dep06_03_update_version_changes_only_selected_intent_and_reachable_closure`, `dep06_03_removing_one_direct_keeps_shared_transitive_locked`, `dep06_03_update_dry_run_reports_effects_and_changes_no_bytes` |
| DEP06-04 | Locked network, Offline warm and cold, Frozen drift | (c) port | `dep06_04_build_locked_fetches_exact_pin_without_lock_write`, `dep06_04_build_offline_warm_succeeds_cold_and_tampered_fail_with_zero_requests`, `dep06_04_build_frozen_rejects_missing_or_stale_lock_without_requests` (ports of `v06_offline_cold_registry_fails_before_everyday_command_preparation_without_http`, `v06_frozen_direct_add_cold_registry_fails_without_http_or_intent_writes`, the three `dep06_ordinary_prepare_offline_*` tests) plus `dep06_04_doc_offline_fails_before_network_or_output` |
| DEP06-05 | Resolution rollback, Replacement rollback, Interrupted recovery, Concurrent preservation | (c) port + NEW | `dep06_05_registry_failure_during_add_leaves_original_pair` (installed CLI, registry returns 503 after manifest plan), `dep06_05_interrupted_pair_is_recovered_by_next_installed_command_before_reads` (the harness uses the pinned `beskid_analysis` transaction in-process to die after the first replacement, as `dep06_pair_recovers_process_death_after_first_replace` does, then runs installed `beskid check`), `dep06_05_concurrent_manifest_edit_fails_commit_without_overwrite`, plus the 13 `dependency_transaction_v06.rs` fault-injection tests moved unchanged into the harness crate (library-level; they do not need the prefix but execute on all three targets, which the Windows security-state scenario requires) |

### 5.2 Dynamic (DYN-06-01..05)

`runtime_semantics` is not in the bundle. Port its 10 Dynamic tests into a new `corelib_tests` target `DynamicSuite` (`src/dynamic/DynamicSuite.bd`). `DynamicV1Tests.bd` already uses only public APIs (`Core.Dynamic.Dynamic`, `Core.Memory.Managed`) plus `GcCollect`; in `corelib_tests` use `Assert.CollectGarbage()` (used by `SerializationSuite.bd:181`). `DynamicTests.bd` negative probes use a raw `[Extern(Abi:"C", Library:"beskid_runtime")]` contract; `corelib_tests` already allows native externs in separate targets (`CoreMathTests`, README), so `DynamicSuite` stays its own target. Open item: `DynamicV1Tests.bd` imports a generated `DynamicFixtureMetadata` mapping contribution with no checked-in source; Slice A must confirm which Mod emits it and that the same path works inside `corelib_tests` before porting.

Proposed ID mapping (write these labels into the dynamic spec scenarios):

| Case | Obligation phrase | Target and test ids |
| --- | --- | --- |
| DYN-06-01 | zero and null tokens rejected before dereference | `DynamicSuite`: `dynamic_zero_shape_is_rejected`, `dynamic_null_input_fails_closed`, `dynamic_v1_zero_tokens_and_unknown_mapping_fail_closed` |
| DYN-06-02 | checked cast against registered shape | `dynamic_unknown_source_shape_is_checked`, `dynamic_cell_rejects_unregistered_payload`, NEW `dynamic_v1_cast_to_wrong_registered_shape_rejects_without_alias` |
| DYN-06-03 | fresh lossless mapping | `dynamic_v1_registered_mapping_is_fresh_and_preserves_source`, `dynamic_mapping_rejects_zero_token_without_source_alias`, `dynamic_mapping_rejects_unknown_token_without_source_alias` |
| DYN-06-04 | incompatible mapping rejected atomically | NEW `dynamic_v1_incompatible_mapping_registration_rejects_and_publishes_nothing` (register a mapping between shapes whose field types conflict; assert error, source unchanged, destination registry unchanged) |
| DYN-06-05 | forced GC retention | `dynamic_v1_registered_cell_only_root_survives_collection`, `dynamic_box_preserves_canonical_descriptor_across_collection` |

### 5.3 Serialization (SER-01..06) and Mod host (MOD-06-01/02)

The Serialization Mod tests (`compiler/corelib/mods/serialization_mod/Tests/*.bd`, three `kind = Test` targets in `serialization_mod_tests.bproj`) prove generated typed AST shape and eligibility; they do not execute generated adapters in an installed program (audit item 3). Slice A must verify that `corelib_bundle_inventory` (`beskid_abi/src/corelib_bundle.rs:455`) copies the nested `Tests/` project of the `serialization_mod` member; if it does not, the three targets move into `corelib_tests` as `SerializationModSuite` with a `serialization_mod` path dependency.

| Case | Spec scenarios | Decision | Binding |
| --- | --- | --- | --- |
| SER-01 | Full shape matrix executes in an installed program | (b) NEW target `SerializationGeneratedSuite` (`src/serialization/GeneratedTests.bd`): `[Serialize]` generic records covering every supported shape (bool, i8..u64, f32/f64, char, string, bytes, unit, nested instantiated generic record, array, list, string-key map, payload enum, optional nested array, declared-width word). Ruling (review section 4): a native case names exactly one target, so the three `SerializationModGenerationTests` structural proofs are `related_evidence`, not required ids | `serialization_generated_full_shape_record_roundtrips_through_bsol`, `serialization_generated_variant_identity_and_field_order_survive_roundtrip`, `serialization_generated_word_requires_declared_width` |
| SER-02 | Unsupported shape diagnostic at field span | (a) + (c) | `SerializationModEligibilityTests`: `serialization_eligibility_rejects_ineligible_declared_types_with_field_spans`, `serialization_closure_rejects_non_string_map_keys`, `serialization_closure_rejects_nested_opaque_references_and_resources`, `serialization_closure_rejects_host_gated_resources`; `SerializationModGenerationTests`: `serialization_every_supported_primitive_reads_and_ineligible_ones_fail_closed`. The installed `beskid check` diagnostic on a pointer/closure field is one host test in `beskid_tests_release/tests/serialization_host_v06.rs` (`ser02_installed_check_rejects_pointer_field_at_declaration_span`); because a case has one execution kind, bind SER-02 to the native targets and record the host test under SER-04 (below) |
| SER-03 | Independent format metadata, Format floating policy | (b) NEW in `SerializationGeneratedSuite` | `serialization_generated_record_uses_one_descriptor_for_bsol_and_json`, `serialization_generated_f32_and_f64_bits_survive_both_formats_without_coercion`; existing `SerializationSuite`: `serialization_value_retains_float_width_and_negative_zero_bits`, `serialization_float_f32_direct_width_roundtrips`, `serialization_float_decimal_direct_f32_avoids_double_rounding` Ruling: SER-03 binds to `SerializationGeneratedSuite` (the two NEW tests); the three `SerializationSuite` float tests are `related_evidence` |
| SER-04 | Source output rejected before lowering; stale semantic handle | (c) harness `beskid_tests_release`, `tests/serialization_host_v06.rs` | `ser04_installed_build_rejects_generator_code_string_output_before_lowering` (fixture Mod returning a CodeString), `ser04_stale_or_foreign_structural_handle_rejects` (moves `structural_materialization_rejects_foreign_owner_generation_and_kind` and `closed_structural_arena_rejects_existing_and_new_handles` from `beskid_analysis/tests/structural_contribution_arena.rs` into the harness, library-level), `ser02_installed_check_rejects_pointer_field_at_declaration_span` |
| SER-05 | Limit boundary, Cycle and allocation failure, Missing default duplicate fields, Precision Unicode | (b) `SerializationSuite` + NEW | existing: `serialization_default_limits_match_public_contract`, `serialization_signature_limit_returns_checked_error`, `serialization_graph_signature_budget_failure_does_not_publish`, `serialization_integers_above_two_pow_53_are_exact_in_both_signs`, `serialization_unsigned_decimal_retains_all_u64_bits`, `serialization_value_distinguishes_bytes_strings_and_unicode_scalars`, `serialization_float_rejects_every_nonfinite_encoding_and_spelling`, `serialization_integer_text_rejects_non_canonical_forms`; NEW `serialization_each_configured_limit_succeeds_and_plus_one_returns_limit_exceeded_without_partial_output`, `serialization_cycle_rejects_and_acyclic_alias_copies_by_value`, `serialization_record_missing_required_duplicate_and_unknown_fields_reject_optional_and_default_apply`, `serialization_non_bmp_and_invalid_utf8_surrogates`. Allocation-failure injection: if no public injection seam exists, keep `wire_encoder_prepares_fallible_work_before_nonallocating_commit` and `serialization_failure_publication_has_no_mutable_payload` (in `BsolSerializationWireTests`) as the bound proof and note the gap; do not fabricate an injection API |
| SER-06 | Collision rejection | (a) `SerializationSuite` | `serialization_registration_conflict_is_atomic_and_owned`, `serialization_signature_sha256_exact`, `serialization_shape_id_preserves_complete_digest_and_rejects_noncanonical_text`, `serialization_graph_missing_edge_keeps_existing_table`, `serialization_graph_admits_complete_recursive_closure` |
| MOD-06-01 | Required native failure, Real native generator | (c) harness `beskid_tests_release` | `mod06_01_installed_build_fails_on_missing_mod_object_symbol_or_null_result_without_stub` (installed CLI against a tampered copy of the prefix's shipped `serialization_mod` descriptor), `mod06_01_installed_build_executes_real_generator_and_lowers_contribution` (ports `v06_qualified_mod_worker_generates_callable_and_generic_record_for_real_host`), library-level ports of the four `native_mod_dispatch_v06.rs` tests |
| MOD-06-02 | Structural handle validation, Instantiated facts authority | (c) harness `beskid_tests_release` | the remaining five `structural_contribution_arena.rs` tests (`static_function_and_generic_record_materialize_without_source`, `structural_arena_enforces_aggregate_node_budget`, `structural_arena_aggregate_boundary_is_atomic_and_preserves_published_handles`, `structural_arena_concurrent_insertions_share_one_aggregate_budget`, `structural_arena_enforces_limits_before_publishing_handle`), plus `mod06_02_installed_build_of_instantiated_generic_helpers_fails_before_lowering_when_facts_are_missing` |

### 5.4 Native BSOL (BSOL-06-01..09)

All `installed_native` on `corelib_tests` targets except BSOL-06-01, which includes a dependency-inspection obligation. Note from `beskid_bsol/conformance/README.md`: the constraint and builtin-profile corpus cases are authored RED and "not yet native-qualified"; those targets must pass before freeze, which is implementation work outside this plan.

| Case | Spec scenarios | Decision | Binding |
| --- | --- | --- | --- |
| BSOL-06-01 | Shared tooling surface; no Rust forwarding | (c) harness `beskid_tests_release`, `tests/bsol_host_v06.rs` | `bsol06_01_installed_corelib_bsol_declares_no_extern_to_rust_bsol` (scan `<prefix>/beskid_corelib/packages/bsol` for `Extern`/`Library:` referencing the Rust crate), `bsol06_01_rust_and_native_agree_on_corpus_syntax_and_diagnostics` (runs the `bsol-syntax` grammar tests of `beskid_bsol` against the retained corpus and the installed CLI's `validate-bsol` on the same files). Native coverage of the same corpus is required under BSOL-06-02/09 via `bsol_shared_corpus_values_and_runtime_manifest` |
| BSOL-06-02 | Syntax distinction (parse, write, parse) | (b) `BsolSuite` | `bsol_ordered_blocks_assignments_and_byte_spans`, `bsol_attributes_references_empty_map_inline_blocks_and_numbers`, `bsol_aggregate_nodes_include_comment_entries`, `bsol_writer_output_may_exceed_original_input_cap`, `bsol_shared_corpus_values_and_runtime_manifest`; NEW `bsol_parse_write_parse_preserves_kinds_labels_attributes_and_references_across_whitespace_and_comments` |
| BSOL-06-03 | Profile self-validation | (a) Ruling: `BsolSchemaTests` is the single bound target; the two builtin-profile tests move into it (`BsolBuiltinProfilesTests.bd` is absorbed) | `bsol_native_profile_v1_and_v2_declared_rule_load`, `bsol_native_schema_valid_primitives_return_checked_document`, `bsol_native_schema_missing_required_field`, `bsol_native_schema_duplicate_field_keeps_both_spans`, `bsol_native_schema_unknown_field_rejects_without_extras`, `bsol_native_schema_wrong_primitive_kind_and_integer_range`, `bsol_native_schema_invalid_profile_fails_at_profile_boundary`, `bsol_all_fourteen_canonical_profiles_parse_and_compose`, `bsol_all_fourteen_builtin_profiles_validate_real_documents` |
| BSOL-06-04 | Attribute permissions, Constraints variants, Pattern parity, Composition diamond/cycle/conflict/refinement/budget | (b) four targets today (`BsolSchemaStructuredTests` 7, `BsolSchemaConstraintTests` 6, `BsolSchemaPatternTests` 13, `BsolSchemaCompositionTests` 14); merge into one `BsolSchemaRulesSuite` target (`src/bsol/SchemaRulesSuite.bd`) as the README's suite pattern already does for `BsolSuite` | all 40 test ids of those four files; NEW `bsol_schema_pattern_native_and_rust_parity_corpus` reading `cases/schema-patterns` through `BESKID_BSOL_CORPUS` |
| BSOL-06-05 | Explicit offline host configuration, Offline locked imports, Import security failures, Locked bytes declare a different profile, Resolved closure survives validation and migration, Imported default arena, Qualified imported reference syntax | (a) `BsolSuite` | the 16 `bsol_import_*` / `bsol_imported_*` / `bsol_import_graph_*` tests listed in `BsolSuite.bd` plus `bsol_typed_write_reowns_profile_before_invoking_binding`; `BsolSchemaImportTests` (2) merge into `BsolSuite` so the case has one target |
| BSOL-06-06 | Default ownership and canonical aliases, Reference resolution, Ambiguous missing wrong kind | (a) Ruling: `BsolSchemaRulesSuite` (the BSOL-06-04 merge target) is the single bound target | `bsol_schema_reference_resolves_to_document_owned_index`, `bsol_schema_syntax_reference_cycles_do_not_expand_owned_values`, `bsol_schema_reference_missing_duplicate_and_ambiguity_reject`, `bsol_schema_references_traverse_lists_maps_and_inline_blocks`, `bsol_schema_default_reference_retains_checked_field_owner`, `bsol_schema_reference_kind_and_rule_alias_share_canonical_target` |
| BSOL-06-07 | Safe migration, Route collision and atomic failure | (a) `BsolMigrationTests` | all 8 `bsol_migration_*` tests |
| BSOL-06-08 | Full typed representation, Invalid typed tags shape | (b) `BsolSerializationWireTests` + `BsolTypedBindingTests` (merge the 3 typed-binding tests into the wire file) | the 15 `bsol_serialization_*` tests, the 3 `bsol_explicit_typed_binding_*`/`bsol_typed_binding_*` tests; NEW `bsol_generated_full_shape_record_write_then_read_serialization_v1` (uses the SER-01 `[Serialize]` fixture through `Core.Bsol.Typed.Write<T>`/`Read<T>`) |
| BSOL-06-09 | Corrected lexical matrix, Invalid lexical input, Bounds and float precision, Unicode allocation failure | (b) `BsolSuite` | `bsol_strict_escaped_unicode_and_invalid_surrogates`, `bsol_limits_fail_before_unbounded_work`, `bsol_normative_limits_defaults_are_explicit`, `bsol_scalar_limit_uses_decoded_utf8_bytes`, `bsol_output_limit_is_independent_of_input_limit`, `bsol_shared_corpus_values_and_runtime_manifest`; NEW `bsol_lexical_matrix_rejects_bracket_attributes_invalid_escapes_leading_zero_and_nonfinite`, `bsol_each_default_limit_plus_one_rejects_atomically`, `bsol_float_output_is_shortest_roundtrip_and_keeps_negative_zero_at_both_widths`. Rust-side parity of the same matrix is the BSOL-06-01 host test |

## 6. Per-case decisions: Rust Glue R4 families

### 6.1 Proposed per-ID obligations and binding kinds

The specs give ranges only. The following assignment gives each remaining ID one checkable obligation and places the five ownership, seven failure and six process obligations of `required_obligations` on specific cases. Write these labels into the `v06-rust-glue-integration` scenarios before freeze. Delivered Glue evidence anchors named by the coordinator: `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` and `src/interop/export.rs` (`export_metadata_populates_codegen_artifact`, `export_table_from_artifact_matches_codegen_exports`, `export_on_non_pub_function_fails_codegen`); both files are library-level today except the `glue_owned.rs` prefix harness, and both move under the host kind.

| Case | Obligation | Kind | Binding |
| --- | --- | --- | --- |
| R4-BIND-01 | ownership and direction change the normalized identity | (c) `beskid_tests_interop`, `tests/glue_host_v06.rs` (new file) | `r4_bind_01_identity_differs_by_ownership_and_direction` (installed `beskid build --backend glue-rust` of two fixtures, compare artifact packet identities); library-level ports `canonical_glue_facts_preserve_logical_managed_and_scalar_identity`, `canonical_glue_metadata_is_closed_and_unique` |
| R4-BIND-02 | target and library change the identity | (c) | `r4_bind_02_identity_differs_by_target_and_library`, `canonical_glue_handle_brand_retains_qualified_owner_and_arguments`, `canonical_glue_type_closure_bounds_wide_signatures` |
| R4-BIND-03 | mismatched owner and consumer identities fail admission before call (in-process) | (c) | `r4_bind_03_mismatched_owner_binding_identity_fails_admission_before_dispatch` (consumer built against an owner whose binding identity differs); ports of `v06_glue_owned_denies_missing_import_row`, `export_metadata_populates_codegen_artifact`, `export_table_from_artifact_matches_codegen_exports`, `export_on_non_pub_function_fails_codegen` |
| R4-BIND-04 | Extern and Glue on one item is a source diagnostic | (c) | `r4_bind_04_installed_check_rejects_extern_and_glue_on_one_contract`; port `glue_declarations_select_only_manifest_glue_libraries` |
| R4-ABI-01 | C-compatible shapes and matching bands (signature inspection) | (c) | `r4_abi_01_manual_and_generated_wrappers_use_c_shapes_and_bands` |
| R4-ABI-02 | i8/i16/i32/i64 extrema and zero | (c) | matrix cells `v06_glue_{manual,generated}_{import,export}_{i8,i16,i32,i64}` (16) |
| R4-ABI-03 | u8/u16/u32/u64 extrema and zero | (c) | 16 matrix cells |
| R4-ABI-04 | f32/f64 bit patterns incl. negative zero and NaN payloads | (c) | 8 matrix cells |
| R4-ABI-05 | bool 0/1; obligation `invalid_bool` | (c) | 4 cells + `r4_abi_05_invalid_bool_byte_returns_invalid_status_without_effects` |
| R4-ABI-06 | char Unicode limits; `invalid_unicode_scalar` | (c) | 4 cells + `r4_abi_06_surrogate_and_out_of_range_scalar_rejected` |
| R4-ABI-07 | utf8_view; `invalid_utf8`, `null_length_bounds` | (c) | 4 cells + `r4_abi_07_invalid_utf8_view_rejected_before_effects`, `r4_abi_07_null_view_allowed_only_for_zero_length_and_bounds_checked_first` |
| R4-ABI-08 | byte_view bounds and embedded NUL | (c) | 4 cells |
| R4-ABI-09 | unit has no physical storage | (c) | 4 cells |
| R4-ABI-10 | opaque_handle ownership; `borrowed_call`, `owned_transfer`, `release_exactly_once`, `stale_generation_reject` (R4-OWN-01..03, -12, -13) | (c) | 4 cells + `r4_abi_10_borrowed_call_survives_owner_release` (from `v06_glue_owned_opaque_borrow_survives_release`), `r4_abi_10_owned_transfer_releases_exactly_once_through_admitted_library`, `r4_abi_10_stale_generation_token_rejected_without_touching_live_allocation`, ports of `v06_glue_owned_rejects_foreign_owner_brand`, `v06_glue_owned_denies_consumer_without_owner_domain`, `v06_glue_owned_denies_duplicate_owner_library` |
| R4-ABI-11 | native_width needs declared wire width; `target_width_mismatch` | (c) | 4 cells + `r4_abi_11_target_width_mismatch_fails_before_call` |
| R4-ABI-12 | forced GC during adapter body; obligation `forced_gc` | (c) | `r4_abi_12_forced_collection_inside_managed_adapter_keeps_owners_and_results` |
| R4-CALL-01 | manual import == generated import (results, errors, releases) | (c) | `r4_call_01_manual_and_generated_import_matrix_results_errors_releases_equal` |
| R4-CALL-02 | manual export == generated export | (c) | `r4_call_02_manual_and_generated_export_matrix_results_errors_releases_equal` |
| R4-CALL-03 | invalid managed input publishes nothing (checked status, zeroed output) | (c) | `r4_call_03_invalid_input_returns_status_and_zeroed_output_without_token` (R4-ABI-18/19 variants folded here) |
| R4-CALL-04 | panic caught at the C boundary; abort is a typed process failure of the hosting process; `foreign_panic`, `foreign_error` | (c) | `r4_call_04_caught_panic_returns_declared_failure`, `r4_call_04_owner_abort_is_observed_as_typed_process_failure_by_the_harness_child` (the consumer runs in a child process of the harness; no stdio bridge is involved), `r4_call_04_declared_owner_error_reaches_checked_caller` |
| R4-GEN-01 | byte-identical output for reordered equivalent bindings | (c) | `r4_gen_01_reordered_bindings_emit_identical_files_and_manifest` |
| R4-GEN-02 | escaping, absolute and duplicate generated paths rejected before effects | (c) | `r4_gen_02_escaping_absolute_and_duplicate_paths_rejected_before_effects` |
| R4-GEN-03 | digest-invalid files rejected; atomic promotion | (c) | `r4_gen_03_digest_mismatch_rejects_and_partial_output_is_never_promoted` |
| R4-GEN-04..06 | Glue Mod contract execution | (e) | moved to the provisional change (6.4) |
| R4-TOOL-01 | explicit `--rust-toolchain` XOR `--cargo`+`--rustc`, plus `--linker` | (c) | ports of `glue_rust_without_tool_flags_names_the_required_form`, `rust_toolchain_conflicts_with_cargo`, `cargo_without_rustc_is_rejected`, `missing_linker_is_rejected` (installed CLI) |
| R4-TOOL-02 | target validation of the probed toolchain | (c) | `r4_tool_02_wrong_target_toolchain_is_rejected_before_build` |
| R4-TOOL-03 | nonexecutable or drifted tool rejected | (c) | `r4_tool_03_nonexecutable_and_drifted_tool_hash_rejected` |
| R4-TOOL-04 | probe exceeding limits is terminated and reaped | (c) | `r4_tool_04_timed_out_probe_child_is_terminated_and_reaped` |
| R4-TOOL-05 | ambient Cargo configuration excluded | (c) | ports of `v06_glue_cli_ignores_inherited_rust_environment`, `v06_glue_cli_rejects_ancestor_cargo_config` |
| R4-TOOL-06 | published image admission fails closed on substitution | (c) | port of `v06_glue_cli_published_images_fail_closed_on_substitution` |
| R4-TOOL-07 | rebuild replaces, failed rebuild preserves | (c) | port of `v06_glue_cli_rebuild_replaces_and_failed_rebuild_preserves` |
| R4-TOOL-08 | driver admitted only from a complete private prefix | (c) | ports of the five `v06_glue_driver_*` tests, plus `glue_dotnet_is_unavailable`, `non_shared_kind_is_rejected`, `app_and_test_targets_are_rejected` |
| R4-PROC-01 | `argv_unicode_no_shell` (R4-PROC-07) | (b) `ProcessSuite` (new `corelib_tests` target, `src/process/ProcessSuite.bd`) | `process_spawn_passes_unicode_space_and_metacharacter_argv_exactly_with_cwd_and_replace_env` |
| R4-PROC-02 | `binary_partial_pipes` (R4-PROC-13/14) | (b) | `process_binary_stdin_stdout_roundtrip_with_partial_transfers_preserves_order`, `process_competing_write_returns_busy_without_replacing_pending_bytes` |
| R4-PROC-03 | `stderr_flood` (R4-PROC-11/12) | (b) | `process_stderr_flood_is_drained_without_deadlock`, `process_run_capture_rejects_invalid_utf8_and_over_budget_with_typed_error_and_reaps` |
| R4-PROC-04 | `exit_wait` (R4-PROC-16/17/18/19) | (b) | `process_wait_returns_exit_code_once_and_reaps`, `process_run_missing_executable_and_nonzero_exit_are_typed`, `process_spawn_until_expiry_is_reported_distinctly_after_cleanup` |
| R4-PROC-05 | `cancel_terminate_reap` (R4-PROC-08/09) | (b) | `process_cancelled_wait_terminates_tree_reaps_and_releases_within_five_seconds`, `process_timed_out_and_cancelled_are_distinct_without_stale_transfer` |
| R4-PROC-06 | `idempotent_close_setup_cleanup` (R4-PROC-15) | (b) | `process_close_is_idempotent_through_aliases_and_scoped_dispose_propagates_cleanup_failure`, `process_failed_spawn_setup_leaves_no_child_or_pipe` |
| R4-IO-01..12 | stdio framing, handshake, cancellation, close, stale tags, GC cleanup | (e) | moved to the provisional change (6.4); `corelib_tests/src/glue/BinaryCodecTests.bd` and `ControlEnvelopeTests.bd` and `beskid_glue/tests/stdio_peer.rs` stay informative unit tests, unbound |

### 6.2 Rust profile matrix and obligation matrix

`rust_profile` requires 17 representations x {manual, generated} x {import, export} = 68 dimension rows, each pointing at an executed test id with a matching `profile_assertions` entry. One omnibus test (`v06_glue_owned_roundtrip_all_representations`) would satisfy the reader but not the design note ("real assertion bindings must name which representations... they exercise"). Generate 68 distinct `#[test]` functions with a `macro_rules!` in `beskid_tests_interop/tests/glue_matrix_v06.rs`, named `v06_glue_<impl>_<dir>_<rep>`; each cell asserts the representation's boundary set. `profile_assertions` and the ABI-02..11 `required_test_ids` list those names. The manual implementation is the hand-written C ABI basis in `fixtures/glue/manual` (its `native_gate.py` runner is not a release harness and is replaced by Rust tests that invoke the installed CLI to build `manual_tests.bproj`); the generated implementation is `--backend glue-rust`.

`obligation_assertions` placement: ownership on R4-ABI-10 (`borrowed_call`, `owned_transfer`, `release_exactly_once`, `stale_generation_reject`) and R4-ABI-12 (`forced_gc`); failure on R4-ABI-05/06/07/11 (`invalid_bool`, `invalid_unicode_scalar`, `invalid_utf8` and `null_length_bounds`, `target_width_mismatch`) and R4-CALL-04 (`foreign_panic`, `foreign_error`); process on R4-PROC-01..06 one each. The stdio obligation list is deleted with the provisional move. The reader already requires every obligation to link to an executed assertion of the named case, and the synthetic fixture's placement (R4-ABI-02, R4-PROC-01, R4-IO-01) must change to this real placement in the kind-aware fixture.

### 6.3 Fixture binary `beskid_release_fixture`

R4-PROC native tests need a deterministic child. A hidden `beskid dev` subcommand would change the CLI surface receipt that `scripts/ci/woodpecker-cli-surface-evidence.mjs` pins, so the child is instead a small Rust binary built from pinned source: `compiler/crates/beskid_tests_interop/src/bin/release_fixture.rs` (binary name `beskid_release_fixture`; it no longer needs `beskid_glue`, so it lives in the interop crate that Slice C owns), modes selected by argv: `echo-argv-json`, `cat-binary [--chunk N]`, `flood-stderr <bytes>`, `exit <code>`, `sleep-forever`, `grandchild-inherits-pipes`. The producer passes its path as `BESKID_V06_RELEASE_FIXTURE`; Beskid tests read it with `Environment.Get` (the `BESKID_BSOL_CORPUS` precedent at `BsolSuite.bd:433`). Its digest is the per-target `artifact_sha256` of every R4-PROC row. Interface contract between slices: the variable name, the mode list above, and exit code 0 on `exit 0`.

### 6.4 Provisional cases (moved out of the 0.6 mandatory set)

| Moved case | Former obligation | Where it lives now |
| --- | --- | --- |
| R4-GEN-04 | registered Glue Mod implementations execute and change the artifact | no spec change: the Glue Mod contracts are deleted in 0.6.0 (`v06-rust-glue-integration`) and the provisional stdio change does not retain them; listed in `provisional_cases` with `spec_change: null` until a new change reinstates Glue Mod execution |
| R4-GEN-05 | absent or invalid Mod output is terminal | same as R4-GEN-04 |
| R4-GEN-06 | deterministic Mod invocation across discovery order | same as R4-GEN-04 |
| R4-IO-01..12 | stdio framing, limits, handshake identity, cancellation and late reply, close with pending calls, stale tags, GC cleanup, bit fidelity | same; informative anchors `corelib_glue` (`Envelope.bd`, `BinaryCodec.bd`, `Pump.bd`, `Session.bd`) and `beskid_glue` with their unit tests |

Manifest expression (section 3.3): remove the fifteen entries from `cases`, add them to `provisional_cases` with `spec_change: "v06-glue-stdio-bridge-provisional"`, `moved_from: "v06-rust-glue-integration"` and a reason; delete `rust_profile.transport` and `required_obligations.stdio`. `policy.all_cases_mandatory` is unchanged and true for `cases`. The reader denies any row that names a provisional id, so a later packet cannot smuggle a provisional cell in as evidence, and the aggregate neither requires nor reports them as delivered. When the provisional change is promoted (0.6.x or later), the ids return to `cases` through the ordinary freeze path with real bindings; the sketches for R4-IO native tests (a `GlueSessionSuite` target driven by a fixture peer) and for R4-GEN-04..06 host tests remain valid starting points but are out of scope here. The `v06-glue-stdio-bridge-provisional/tasks.md` item 1.2 is discharged by this manifest edit.

## 7. CLI06-06: the five-user observation

The requirement `Installed beginner workflow acceptance` (`tooling--cli--command-surface/spec.md:95-103`) has two halves. The scripted installed journeys on three targets are machine-verifiable and bound in 5.1. The five fresh uncoached users with 4-of-5 thresholds are a human observation; the audit (item 4) and the design note both say a native assertion cannot substitute. Beskid has no users, but fresh participants (people with no prior Beskid exposure) are obtainable, so the threshold should not be waived.

Recommended: reword and split through an OpenSpec change to `v06-cli-dependencies`.

- Scenario `CLI06-06 Qualification` keeps the scripted journeys and becomes the native cell bound above.
- New scenario `CLI06-06-OBS Uncoached observation`: "GIVEN a frozen candidate and five participants with no prior Beskid exposure, WHEN each receives only the installed CLI and its help, THEN an identity-bound observation record shows at least four finding `add` within 60 seconds and at least four completing create/add/use/run within five minutes." Evidence is one record per candidate, not a per-target matrix cell.
- New validator `scripts/ci/release-user-observation.mjs` modelled on `windows-installer-owner-waiver.mjs`: exact key set (`schema_version`, `version`, `compiler_commit`, `superrepo_commit`, `candidate_cli_sha256` per target, `recorded_utc`, `observer`, `participants`); exactly five participants, each with a pseudonymous id, target, `help_only: true`, `add_found_seconds`, `journey_completed`, `journey_seconds`, `commands[]`, `failures[]`; thresholds enforced (count of `add_found_seconds <= 60` is at least 4; count of `journey_completed && journey_seconds <= 300` is at least 4); identity must match the aggregate's version and commits and the candidate CLI digests in `validated-evidence.json`. `woodpecker-release.sh` consumes it through `BESKID_V06_USER_OBSERVATION_FILE` exactly as the Windows waiver (`woodpecker-release.sh:181-197`) and fails closed when absent for a 0.6 version. The matrix reader treats CLI06-06 as satisfied only when its native cells pass and `release-state.json` carries a validated observation.

Not recommended: an owner waiver entry. A waiver would leave a SHALL unmet while publishing; the observation is cheap relative to the rest of qualification. If the release owner still chooses a waiver, use the same validator shape with `decision: "release-owner-user-observation-waiver"`, `scope: "cli06-06-uncoached-observation-only"`, and record it in `release-state.json`; nothing else in the matrix may read it.

## 8. Implementation slices

The three slices touch disjoint files. Bindings are exchanged as JSON fragments under `scripts/ci/release-case-bindings/` (one file per slice) and merged by the freeze tool (3.5), so only Slice B edits `release-cases-v06.json`. Shared interface contracts: the `installed_host_harness` schema (3.3), the fixture binary modes and `BESKID_V06_RELEASE_FIXTURE` (6.3), `BESKID_BSOL_CORPUS` pointing at an extracted `input-bsol-corpus.tar`, and `BESKID_V06_QUALIFIED_PREFIX`.

### Slice A: native Beskid tests (corelib)

Owns: `compiler/corelib/beskid_corelib/tests/corelib_tests/corelib_tests.bproj`; `compiler/corelib/beskid_corelib/tests/corelib_tests/src/dynamic/DynamicSuite.bd` (new), `src/serialization/GeneratedTests.bd` (new), `src/process/ProcessSuite.bd` (new), `src/bsol/SchemaRulesSuite.bd` (new; absorbs the four schema rule files), `src/bsol/BsolSuite.bd`, `src/bsol/SerializationWireTests.bd` (absorbs `TypedBindingTests.bd`), `src/bsol/SchemaTests.bd`, `src/serialization/SerializationSuite.bd`; `compiler/corelib/mods/serialization_mod/Tests/*.bd` only if new structural tests are needed; `beskid_bsol/conformance/cases/**` additions (lexical matrix cases); `compiler/corelib/ci/normalize_corelib_test_imports.py` run; OpenSpec label edits in `openspec/changes/v06-serialization-bsol/specs/**` (DYN-06 and per-ID SER/BSOL labels); `scripts/ci/release-case-bindings/corelib.json` (new).

Deliverables: all (a)/(b) rows of sections 5.2-5.4 and R4-PROC of 6.1; confirmation of the two open items (nested `Tests/` project in the bundle inventory; `DynamicFixtureMetadata` provenance). Dependency on Slice C: the fixture binary modes; until it exists, `ProcessSuite` tests fail closed on the missing variable, which is the intended RED. `src/glue/*.bd` is not touched (provisional).

### Slice B: matrix scripts, reader, freeze tool, CLI and dependency host harness

Owns: `scripts/ci/woodpecker-release-evidence.mjs`, `scripts/ci/test/v06-release-matrix.test.mjs` (section 4 fix and kind-aware fixtures), `scripts/ci/woodpecker-release-cases-v06.mjs` (new producer), `scripts/ci/freeze-release-cases-v06.mjs` (new), `scripts/ci/release-user-observation.mjs` (new) and its test, `scripts/ci/woodpecker-build-platform.sh`, `scripts/ci/build-release-platform.sh`, `scripts/ci/build-release-artifact.sh` (harness and fixture build steps), `scripts/ci/woodpecker-release.sh` (observation consumer), `scripts/ci/woodpecker-aggregate-release.mjs` (copy v2 packet files), `scripts/ci/release-cases-v06.json` (schema additions, provisional move of 6.4, final merge), `scripts/ci/release-case-bindings/host.json` (new); `openspec/changes/v06-glue-stdio-bridge-provisional/tasks.md` (tick 1.2); `compiler/crates/beskid_tests_release/**` (new crate: `Cargo.toml`, `src/lib.rs` with the fail-closed `installed_prefix()` helper, `tests/cli_journeys_v06.rs`, `tests/dependency_journeys_v06.rs`, `tests/serialization_host_v06.rs`, `tests/bsol_host_v06.rs`); `compiler/Cargo.toml` workspace member list; OpenSpec edits in `openspec/changes/v06-cli-dependencies/specs/**` (CLI06-03 label, CLI06-06 split) and `openspec/changes/v06-release-qualification/**` (execution kinds, observation record); `docs/reports/2026-10-04-v06-decisions.md` entry for the subset rule and the host kind.

Deliverables: sections 3.2-3.5, 4, 5.1, 5.3 (c) rows, BSOL-06-01, 6.4 manifest move, section 7. The provisional move is the first commit of the slice because every other matrix test depends on the 86-case shape. RED first: matrix tests for every reader change before the reader changes; the producer is exercised against a locally extracted bundle in the CI test shell (`scripts/ci/test/run-woodpecker-tests.sh`), never by publishing.

### Slice C: Rust Glue R4 host harness and fixture binary

Owns: `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` (refactor: one staged prefix per process as the test audit item 1 recommends; per-test prefixes only for the four tamper/denial tests), `compiler/crates/beskid_tests_interop/tests/glue_matrix_v06.rs` (new, 68 macro-generated cells plus CALL equivalence), `compiler/crates/beskid_tests_interop/tests/glue_host_v06.rs` (new: BIND, GEN-01..03, TOOL ports from `beskid_cli/tests/glue_rust_build_v06.rs`, `beskid_codegen/tests/glue_binding_facts.rs`, `beskid_aot/tests/glue_declarations_v06.rs`, `src/interop/export.rs`, all against the installed CLI), `compiler/crates/beskid_tests_interop/Cargo.toml`, `compiler/crates/beskid_tests_interop/fixtures/glue/**` (manual matrix rebuilt as `.bproj` fixtures driven by the installed CLI; retire `native_gate.py`/`build.py` as release evidence), `compiler/crates/beskid_tests_interop/src/bin/release_fixture.rs` (new); OpenSpec label edits in `openspec/changes/v06-rust-glue-integration/specs/**` (per-ID scenarios of 6.1, removal of leftover stdio and R4-GEN-04..06 text if the coordinator's split left any); `scripts/ci/release-case-bindings/glue.json` (new). Not touched: `compiler/crates/beskid_glue/**`, `corelib/packages/glue/**` (provisional).

Deliverables: all (c) rows of 6.1 for BIND/ABI/CALL/GEN-01..03/TOOL, the profile and obligation assertion lists of 6.2, the fixture binary of 6.3. Known cost risk: each private-prefix child today rebuilds the Serialization Mod (about 525 s per test, test audit item 1); the producer runs one process per required id, so the warm template (`BESKID_V06_GLUE_TEMPLATE_PROJECT`, `BESKID_V06_GLUE_OWNER_IMAGE_CACHE`) must be produced once per target by a dedicated `--exact v06_glue_warm_template` run that the producer executes first and whose outputs it passes to every later id.

Integration (serialized, after all three slices): regenerate `compiler/Cargo.lock` once (Slices B and C both add crate entries), run the freeze tool, update `V06_CASE_MANIFEST_SHA256`, run `scripts/ci/test/run-woodpecker-tests.sh`, then one full producer run per target on the builders.

## 9. Freeze checklist

1. Section 3.2 reader corrections land with RED matrix tests; `v06-release-matrix.test.mjs` passes on the current manifest (section 4).
2. The 15 provisional cases are moved (6.4); the matrix test asserts 86 mandatory and 15 provisional ids.
3. All 70 bindings exist as fragments; the freeze tool finds every declaration; no `binding: null` remains; `state: frozen`; `V06_CASE_MANIFEST_SHA256` updated in the same commit.
4. OpenSpec labels added (3.6), the CLI06-06 split accepted, no stdio or R4-GEN-04..06 scenario left in `v06-rust-glue-integration`; `openspec/catalog.json` regenerated.
5. Each target produces `feature-evidence-v2.json` with 86 success rows, 68 profile rows, 18 obligation rows, retained packet closure, no `fallback_used`, and no row naming a provisional id.
6. `release-user-observation-v06.json` validated against the same candidate identities.
7. Known RED that must turn green before step 5: `BsolSchemaConstraintTests`, `BsolBuiltinProfilesTests` (corpus README), the generated-adapter installed roundtrip (SER-01/BSOL-06-08), the manual fixture's in-process `required_unproven_obligations` (`fixtures/glue/manual/qualification.json`, minus the stdio entry).

## 10. Risks and open questions

- `DynamicFixtureMetadata` provenance (5.2) and nested `Tests/` bundle inclusion (5.3) are verification items, not assumptions; both change the DYN/SER target choice if they fail.
- Allocation-failure injection (SER-05, BSOL-06-09 "Unicode allocation failure") has no public seam visible in the corelib tests read here; the plan binds the existing nonallocating-commit proofs and records the gap rather than inventing an API.
- Windows builders need cargo, rustc and a linker in the producer environment for Glue cells; `build-release-artifact.sh` already runs cargo there, so the tools exist, but the hermetic-owner tests (R4-TOOL-05) must receive explicit tool paths through the pinned variables.
- The per-id process model multiplies harness start-up cost; `--test-threads=1` plus the warm template keeps Glue cells bounded, and CLI/dependency cells are cheap. Budget a per-cell timeout of 900 s like the v1 producer and a per-target matrix budget in the producer.
- Running `cargo test --no-run` on release builders adds a compile of the test crates per target; it is the price of executing host-level obligations natively rather than claiming them from one machine.
- The provisional move changes the manifest shape that `v06-release-matrix.test.mjs` and the design note of `v06-release-qualification` describe (101 cases). Both must be updated in the same slice so the reader, the test suite and the normative text agree on 86 mandatory cases; the OpenSpec `conformance-evidence-policy` requirement text ("manual plus generated bidirectional Rust Glue primitive, ownership, subprocess and stdio lifecycle behavior") needs the word "stdio" removed through the same OpenSpec change that records the split.
