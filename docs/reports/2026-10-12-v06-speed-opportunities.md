# beskid 0.6.0 development-speed opportunities (read-only audit, 2026-10-12)

Scope: worktree `/Users/mikserek/.codex/worktrees/v06-release/beskid`, builder logs in `.build/*.log`
(rc26, w2-*, fv-*, c29-*, g7-modbuild-1), builder scripts `.build/rc-fast.sh`, `rc-prep.remote.sh`,
`fast-verify.sh`, `par-test.remote.sh`, `rgate-slot.sh`, and the compiler sources. No build was run.

Excluded (already in flight): query snapshot 64 MiB limit / persistence, location-independent Mod
artifacts, parallel ISLE/CLIF item emission, stable Corelib root for `library_target` /
`incremental` / `json_rpc_intellisense`, process-per-test runner, incremental slot builds,
CLI/kit/Mod reuse in rc prep. Where an item touches one of those it is said so.

Ranking is (expected time saved) / (risk x effort), lowest-impact changes first within a tier.
Savings are per full `rc-fast` pass on the NixOS builder (8 jobs, dev profile, `CARGO_PROFILE_DEV_DEBUG=0`)
unless stated. "CPU" means summed test time; "wall" means the serialized cargo test-binary sequence.

## Baseline numbers from the logs

| Measurement | Value | Source |
| --- | --- | --- |
| `cargo test --workspace` (minus interop/projects) binaries | 359 test binaries, 3791 test lines | `rc26-workspace.log` |
| Warm build of the workspace test set | 3 m 31 s | `rc26-workspace.log:771` |
| `beskid_tests_projects` in-process | 896 s (241 ok, 99 ignored) | `rc26-workspace.log` |
| same, process-per-test, 8 jobs | 476-504 s | `w2-b2.log` TIMING |
| `library_target` / `incremental` / `json_rpc_intellisense` | 553 s / 280 s / 267 s | `rc26-workspace.log` |
| `beskid_cli` lib tests | 151-178 s (4 tests take 84/84/85/177 s) | `w2-m-dev-beskid_cli.log` |
| engine/aot/codegen native binaries | 71, 75, 59, 59, 56, 53, 53, 53 s each | `rc26-workspace.log` |
| Runtime kit `build-native-host --profile debug` | 52-54 s | `w2-*.log` TIMING |
| Serialization Mod rebuild | 180-191 s; trace run 3 m 11 s of which `Generate CLIF` 1 m 51 s, `Link` 1.8 s | `w2-rcf4.log`, `g7-modbuild-1.log` |
| Corelib provisioning (`check corelib_runtime.bproj`) | 9 s | `w2-rcf1.log` |
| Full Corelib preparation inside one test process (dev) | about 290-310 s (`incremental` tests 297/298/307 s; `json_rpc` 292 s; `entry_less_library` 583 s = two preparations) | `w2-m-dev-*.log` |
| `beskid_tests_interop`, 3 threads | 5348-5432 s wall; every failing test stops at about 529 s | `rc26-interop.log`, `w2-rcf1.log` |
| Corelib matrix | 113 targets, 667 `test` blocks; per target `Generate CLIF` 15.8-33.6 s then one link per test | `rc26-mod-tests.log`, `corelib_tests.bproj` |

Note on profiles: `w2-m-gate.log` shows the `gate` profile slower than `dev` on the same tests
(`incremental` 418 s vs 307 s, `json_rpc_intellisense` 707 s vs 292 s). `compiler/Cargo.toml` defines only
`dev` and `release`; wherever `gate` is defined it loses the `[profile.dev.package."*"] opt-level = 2`
dependency optimization. Do not use it for timing-sensitive suites.

## Tier 1: small, low-risk changes with large savings

### 1. Share one runtime kit across test binaries instead of building it per process

Evidence: `compiler/crates/beskid_engine/tests/support/shared_kit.rs` ("One canonical native runtime kit
per test process", `OnceLock` + `build_native_host` into a temp prefix) is included by `native_kit`,
`fiber_value_transfer`, `foundation_io_native`, `external_wait_native`, `native_runtime_kit_smoke`;
`external_wait_native.rs:88-90` builds its own kit for a single test. A kit build is 52-54 s
(`w2-m-dev-kit.log`). Binaries in `rc26-workspace.log` with that fixed cost: `native_kit` 71 s (32 tests),
`foundation_io_native` 75 s, `runtime_fixture` 59 s, `fiber_value_transfer` 59 s, `native_sdk_factories` 56 s
(3 tests), `external_wait_native` 53 s (1 test), `runtime_fixture_scheduler_entry` 53 s (2 tests),
`parsed_project_isle_harness` 53 s. Cargo runs test binaries one after another, so these are wall seconds.
`rc-prep.remote.sh` already exports `BESKID_RUNTIME_PREFIX` to a kit keyed by the CLI digest, and
`beskid_tests_mod_host::stage_runtime_prefix` (`lib.rs:249-255`) already stages a kit on disk under a hash
with a file lock.

Change: in `shared_kit.rs`, resolve the kit from `BESKID_RUNTIME_PREFIX` when set (fail closed if its
`abi.json` is missing), otherwise call `beskid_tests_mod_host::shared_runtime_prefix()`; keep
`build_native_host` only in the tests that exercise kit construction (`runtime_kit/tests.rs`,
`native_runtime_kit_smoke`). Remove the private build in `external_wait_native.rs:88`.

Saving: about 5 x 52 s = 4-5 min wall per workspace pass (more if the four codegen/queries binaries at
53-59 s turn out to pay the same cost; they do not call `build_native_host` directly, so profile them first).
Risk: low (consumers are read-only on the kit; the lease mutex stays). Effort: small.

### 2. Build the `native_sdk` sample Mod once in the `compiler_mod` unit tests

Evidence: `compiler/crates/beskid_cli/src/commands/compiler_mod.rs:409,479,586,623` each rebuild
`beskid_tests_mods/fixtures/mods/native_sdk` through the real producer; `w2-m-dev-beskid_cli.log` times
them at 84.0, 84.0, 85.4 and 177.5 s (the last rebuilds twice). The rest of the 100 tests in that binary
total under 5 s. The rebuild cost is the Corelib `compiler_sdk` closure, not the sample Mod.

Change: one `OnceLock` fixture that rebuilds `native_sdk` into a shared temp Corelib copy; the four tests
assert on the produced artifact tree (reuse, staleness via a copied tree with a touched source, shipped
qualification, registrations). Keep exactly one real producer invocation plus one deliberate stale rebuild.

Saving: about 250 s CPU, 150 s wall per pass. Risk: low. Effort: small.

### 3. Run Corelib matrix targets in parallel worker shards

Evidence: `compiler/crates/beskid_cli/src/commands/matrix_test.rs:132-150` prepares targets in order and
executes them in order in a single worker process; `prepared_matrix.rs:218-231` is the serial
`prepare_targets` loop. Each target pays `lower_frozen_syntax_entrypoints` + `emit_native_test_object`
(`Generate CLIF` 15.8 s and 33.6 s for the two Serialization Mod targets in `rc26-mod-tests.log`); 113
targets therefore cost about 113 x 20 s = 35-40 min before any test runs. `rc-fast.sh` budgets
`--matrix-timeout 7200` for it. The parallel-emission work in flight speeds up one target; it does not
overlap targets. The supervisor already isolates the worker as a child process and reports per target, so
sharding is a scheduling change, not a reporting change.

Change: `supervise_worker` spawns N workers (`--shard i/N`, N = min(cores/2, targets)); each worker
prepares and runs its shard; the supervisor merges `TargetFinished` events in target order. The
`revision_snapshot` identity check already runs per worker (`prepared_matrix.rs:187,292`).

Saving: with N = 4 about 25 min of the matrix wall time per pass. Risk: medium (shared `obj/` cache,
runtime kit staging and Mod provisioning are already file-locked per `beskid_tests_mod_host`; the
dependency cache under `obj/beskid` must tolerate concurrent readers, which process-per-test already
exercises). Effort: medium.

### 4. Link and run matrix tests of one target concurrently

Evidence: `compiler/crates/beskid_cli/src/commands/test.rs` (`execute_prepared_target`, loop at the
`for (test, row_index, initial) in planned` site) calls `workspace.run_native_test` per test;
`prepared_matrix.rs:349-373` links one executable per test (`link_entry`) and runs it. 667 tests means 667
links and 667 process runs, serial. Each linked test is an independent process, so no runtime state is shared.

Change: after `prepare_native_tests`, link+execute the target's tests on a bounded thread pool (4-8),
collecting reports in row order; keep `check_budget` per test.

Saving: 3-6 min per matrix pass (link about 0.3-1 s each plus process start). Risk: low. Effort: small.

### 5. Merge Corelib matrix targets by package area

Evidence: `corelib/beskid_corelib/tests/corelib_tests/corelib_tests.bproj` has 113 targets with 667 tests
(5.9 per target): Console 19 targets, System 14, Core 14, Bsol 14, Collections 10, Text 7, Network 7,
Concurrency 7, Serialization 6, Http 4. The per-target fixed cost (lower + emit the Corelib closure the
target reaches) dominates the 1-2 s of test execution. Merging to about 30 targets removes roughly 80
fixed costs.

Change: fold same-area targets into one `target` per area with one entry unit that `use`s the sibling
test units (same test names, same tags). This is a test-suite change, not a compiler change; see the test
audit (`2026-10-12-v06-test-audit.md`) for the merge list.

Saving: about 80 x 20 s = 25 min CPU per matrix pass; combined with item 3 it shrinks the matrix to a
few minutes of wall time. Risk: low (test selection by tag and name is unchanged). Effort: medium (mechanical).

### 6. Stop rebuilding the Serialization Mod inside every `glue_owned` interop test

Evidence: `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs:201-236` runs every test in a
freshly staged private prefix (`stage_private_prefix`, kit copied from the qualified prefix) and
`glue_owned.rs:328` qualifies the Corelib's Serialization Mod against that prefix, which rebuilds it
(180-190 s) and prepares the Corelib again. All eleven failing tests in `rc26-interop.log` stop after
524-530 s, before the consumer build even starts emitting (the ICE at `glue_owned.rs:913` is thrown at
the end of `Generate CLIF`); the whole binary takes 5348 s at `--test-threads=3`. The rc prep's Mod reuse
(excluded item) does not reach these tests because the artifact is keyed to the private prefix path.

Change: stage one private prefix per test process (`OnceLock`), copy the prebuilt Mod artifact tree from
`BESKID_CORELIB_ROOT` (`.beskid/obj/mods/...`) into the staged Corelib so qualification succeeds without a
rebuild (the kit bytes are identical, so the digest check passes), and keep per-test prefixes only for
the four tamper/denial tests (`DriverStaging::Tampered`, `Missing`, `Symlinked` and the escape case).
This depends on the location-independent Mod artifact work only if the descriptor records the absolute
prefix; if it does, do the copy after that work lands.

Saving: about 14 x 3 min = 40 min CPU, 15-25 min wall per interop pass. Risk: medium (prefix admission
semantics are the subject under test; keep the denial tests isolated). Effort: medium.

## Tier 2: build and link time

### 7. Move the embedded Corelib out of `beskid_tools`

Evidence: `compiler/crates/beskid_tools/build.rs` copies the Corelib bundle into `OUT_DIR` and emits
`cargo:rerun-if-changed` for every member file; `beskid_tools/src/corelib.rs:20` embeds it with
`include_dir!`. `cargo tree -i beskid_tools` shows `beskid_cli`, `beskid_lsp`, `beskid_template`,
`beskid_tests_mod_host` (and through them every `beskid_tests_*` crate) as dependents. Any edit to a Corelib
library `.bd` therefore rebuilds `beskid_tools` and relinks the CLI, the LSP and every test binary;
`w2-b2.log` shows `cargo build -p beskid_cli` at 63-108 s after such an edit versus 8-9 s when unchanged.
(Nested test projects such as `tests/corelib_tests` are excluded by `corelib_bundle_inventory`, so
Corelib test edits do not trigger this.)

Change: a leaf crate `beskid_corelib_embed` (the `build.rs` plus `include_dir!`) depended on only by the
`beskid_cli` and `beskid_up` binaries; `beskid_tools::corelib` takes the bundle as a parameter
(`&'static Dir`) or reads `BESKID_CORELIB_ROOT`. Test crates then stop relinking on Corelib edits.

Saving: 60-100 s per Corelib-edit iteration for anyone running Rust tests; no effect on a clean pass.
Risk: medium (API change in `beskid_tools::corelib`, `beskid_lsp` needs the embed only for `beskid up`
style provisioning). Effort: medium.

### 8. Remove the second HTTP/zip stack from the compiler build

Evidence: `Cargo.lock` has 693 crates with duplicates: `reqwest` 0.12.28 (beskid_analysis, beskid_lsp,
beskid_pckg, beskid_up, opentelemetry) and 0.13.3 (vendored `cargo-cross`), `zip` 2.4.2 and 8.0.0
(`cargo-cross`), `object` 0.36/0.37/0.40, `hashbrown` 0.14/0.15/0.16/0.17, `rand` 0.8 (sqlx) and 0.9
(opentelemetry), `toml` 0.8/0.9, `syn` 2 and 3, `windows-sys` x5. `cargo-cross` is a normal dependency of
`beskid_aot`, `beskid_cli` and `beskid_up`; `opentelemetry-otlp` reaches every binary through
`beskid_telemetry`; `sqlx-postgres` is compiled by `--workspace` tests through `beskid_pckg_server`.

Change: put `cargo-cross` behind a `cross` cargo feature (off by default in dev), pin the vendored copy
to `reqwest 0.12` and `zip 2`, make the OTLP exporter a feature of `beskid_telemetry` (the CLI logs
`otel=false` on every run), and move `beskid_pckg*` out of the compiler gate's `--workspace` set (they are
not compiler crates; `fast-verify.sh` already selects by dependency).

Saving: 1-2 min on cold or dependency-changing builds, smaller binaries to link 359 times; nothing on a
warm pass. Risk: low. Effort: small to medium.

### 9. Linker and profile settings: nothing to gain on the builder, one gain on macOS

Evidence: `compiler/.cargo/config.toml` sets `rust-lld` for `aarch64-apple-darwin` and
`x86_64-pc-windows-msvc`; toolchain 1.98.1 already defaults `x86_64-unknown-linux-gnu` to `rust-lld`, and the
builder exports `CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`. `[profile.dev]` keeps
`opt-level = 1`, `debug = "line-tables-only"`, deps at `opt-level = 2`. The one unused lever is
`[profile.dev] split-debuginfo = "unpacked"` for local macOS builds (avoids `dsymutil` on every test binary
when debuginfo is on). No change recommended for the builder; add the macOS line to the justfile notes.

## Tier 3: compiler throughput (hot paths visible in the logs and source)

### 10. Instrument the typed-program build so the 290 s Corelib preparation has a phase breakdown

Evidence: `g7-modbuild-1.log` prints `Semantic analysis (79ms)`, `Lower to HIR (596ms)`,
`Generate CLIF (1m 51s)` and `Mod rebuild complete in 3m 11s`: about 78 s are spent outside any printed
phase (between the salsa snapshot rejection at +0.4 s and the first `assembly.unit` at +17.7 s, and between
the last `unit_imports` and the first ISLE event). In the test logs a full preparation costs 290-310 s
with no breakdown at all. The `beskid_queries` typed-program build (`build_typed_program`,
`semantic_diagnostics_for_roots`) is not wrapped in `beskid_pipeline::observe_phase`.

Change: wrap parse/expand, assembly discovery, resolution, typing, legality and ISLE input construction in
`observe_phase_result` so `--plain` output and `TimedPipelineObserver` report them; add the same
`TIMING`-style lines to `BESKID_COMPILER_TRACE`. Zero behavior change; it tells the parallel-emission and
persistence work where the remaining seconds are.

Saving: none directly; it is the prerequisite for every later throughput item. Risk: none. Effort: small.

### 11. Memoize `canonicalize` in assembly discovery and loading

Evidence: `compiler/crates/beskid_analysis/src/projects/assembly/discovery.rs:100` canonicalizes every
candidate file on every module-path lookup; `loader/orchestration.rs:60,80,96,205,213` canonicalize each
unit path as a map key; `roots.rs:144-146` canonicalizes six paths per dependency per check;
`projects/discovery.rs:160` per directory. The Corelib closure has about 1000 source files and lookups
repeat per `use`, so this is tens of thousands of `realpath` syscalls per preparation. The interned path
identity added for macOS `/var` aliases is the right place to cache.

Change: one `PathInterner` per assembly session (`HashMap<PathBuf, Arc<Path>>`) used by discovery, loader
and roots; canonicalize once per distinct path.

Saving: about 0.5-2 s per preparation (hundreds of preparations per pass). Risk: low. Effort: small.

### 12. Demote per-unit INFO tracing

Evidence: the default CLI subscriber prints one INFO line per assembly unit (`assembly.unit{unit=...}`,
2005 lines in a single glue consumer build, `rc26-interop.log:249-2334`) and one per `unit_imports`
(`beskid_queries::unit`), each 250-300 bytes, to stderr, which the test harness captures into memory.
`rc26-interop.log` is 3.4 MB for 21 tests mostly because of this.

Change: emit `assembly.unit` and `unit_imports` at DEBUG; keep `pipeline.phase` at INFO.

Saving: about 50-150 ms per invocation plus smaller logs. Risk: none. Effort: trivial.

### 13. Order ISLE fact probes so `aggregate_field_access` is not asked on every node

Evidence: in `g7-modbuild-1.log` the trace records 92 071 `ast.node` events, 1 524 `call.fact`
events and 15 168 `fact.unavailable` events, 14 341 of them `aggregate_field_access`. Every miss goes
through `isle_adapter/context.rs:57-67` and allocates an error with three `Arc` strings
(`semantic_contract/model/errors.rs:82-92`) before being discarded. The query itself is memoized by
Salsa, so the CPU cost is small (well under a second), but the ratio shows that a field-access rule is
tried before the node kind rules out the shape.

Change: guard the `aggregate_field_access` extractor with a cheap node-kind check (member expression
only), or make `SemanticQueryResult::unavailable` carry a static `&'static str` and build the `Arc`s only
when rendered.

Saving: under 1 s per Mod build. Risk: none. Effort: trivial. Listed because it is a correctness smell as
much as a cost.

### 14. Cache `verified_corelib_bundle_root` per process

Evidence: `beskid_abi/src/corelib_bundle.rs:87-115` hashes every regular file of the bundle with
SHA-256 on each call; `verified_corelib_bundle_roots` caches only within one call.
`beskid_cli/src/commands/compiler_mod.rs:820` (`bundled_mod_policy`) and `:890`
(`installed_toolchain_prefix_of`) run it on every Mod build of a bundled Mod; `beskid_up`, `doctor`,
`mod_host/load.rs:49` and `native_mods.rs:218` run it on error or install paths. The embedded bundle is
a few MB, so one hash is tens of milliseconds.

Change: a process-wide `OnceLock<Mutex<HashMap<PathBuf, (SystemTime, bool)>>>` keyed by the marker's
mtime. Saving: tens of ms per invocation. Risk: none. Effort: trivial. Low priority.

### 15. Nested `beskid build` inside interop tests pays a full Corelib preparation each time

Evidence: `rc26-interop.log:243-2334` shows the installed CLI resolving, materializing 24 path dependencies
(82 ms), then assembling the whole Corelib closure for the glue consumer; the Corelib part is identical
across the 18 tests. This is the same cost the excluded persistence work addresses (the snapshot is
rejected by version and the save fails on the byte limit in `g7-modbuild-1.log`), so no separate change is
proposed beyond item 6; it is recorded so the saving is attributed correctly once persistence lands.

## Observations without a recommended change

- `prepared_matrix.rs:422-485` (`revision_snapshot`) shells out to `git status`, `git diff --binary` and
  hashes every untracked file for the root, compiler and Corelib repositories, three times per matrix run.
  Measured locally at 0.35 s + 0.09 s + 0.06 s; `.build/` is ignored and the builder mirror is `rsync`ed
  from `git ls-files`, so it is cheap there too.
- `matrix_test.rs:24` polls the worker every 10 ms; `beskid_aot/src/run.rs:106` every 20 ms;
  `e2e harness/process.rs:27` every 20 ms. All bounded and cheap.
- `beskid_tests_projects/src/projects/registry_lock.rs:442` sleeps 1200 ms once (mtime granularity);
  `native_harness.rs:243,253` sleep 2 s and 30 s only inside child probes that the test kills.
- All `build.rs` scripts (`beskid_tools`, `beskid_abi`, `beskid_isle`, `beskid_analysis`) emit
  `rerun-if-changed` for their inputs; none reruns unconditionally.
- `.build/rgate-slot.sh` uses `CARGO_BUILD_JOBS=8` and `CARGO_INCREMENTAL=1`; `rc-fast.sh` runs the
  workspace, projects, interop and the two CLI matrices strictly one after another. Running the interop
  suite (`--test-threads=3`, mostly waiting on child processes) concurrently with the Corelib matrix
  would overlap the two longest phases; it is a script change in `rc-fast.sh` only (`&` + `wait`), and the
  slot already serializes everything else behind `flock`.

## Summary table

| # | Change | Saving per pass | Risk | Effort |
| --- | --- | --- | --- | --- |
| 1 | Shared runtime kit across engine/aot/codegen test binaries | 4-5 min wall | low | small |
| 2 | One `native_sdk` rebuild for the four `compiler_mod` tests | 150 s wall, 250 s CPU | low | small |
| 3 | Shard Corelib matrix targets over N workers | about 25 min wall | medium | medium |
| 4 | Concurrent per-test link+run inside a target | 3-6 min | low | small |
| 5 | Merge 113 matrix targets to about 30 | about 25 min CPU | low | medium |
| 6 | Reuse the prebuilt Serialization Mod in `glue_owned` tests | 15-25 min wall | medium | medium |
| 7 | Move the Corelib embed out of `beskid_tools` | 60-100 s per Corelib edit | medium | medium |
| 8 | Drop duplicate HTTP/zip stacks, gate OTLP and `cargo-cross` | 1-2 min cold | low | small |
| 9 | Linker/profile: already optimal on the builder | 0 | none | none |
| 10 | Phase instrumentation of the typed-program build | enables 11-15 | none | small |
| 11 | Path interner for `canonicalize` in discovery/loader | 0.5-2 s per preparation | low | small |
| 12 | Per-unit INFO tracing to DEBUG | 50-150 ms per invocation | none | trivial |
| 13 | Guard the `aggregate_field_access` probe | under 1 s per Mod build | none | trivial |
| 14 | Process cache for bundle fingerprint checks | tens of ms per invocation | none | trivial |
| 15 | Nested Corelib preparation in interop builds | covered by persistence work | - | - |
