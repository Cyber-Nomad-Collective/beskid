# v0.6 compile time, rounds 2 and 3

Date: 2026-10-13. Compiler `release/v0.6.0`: round 2 is commit `bf912ccf` (on top of `a3cc98fc`,
round 1); round 3 is commit `3a837a47` (see [Round 3](#round-3-shared-declaration-tables-name-table-unit-index)).

## Result

All runs used the builder slot w2 with a private source mirror (`v06-src-ct`) and a private state
directory, so both sides of each comparison built the same sources and the same Corelib. The
builder was shared with two or three other jobs (load average 15 to 27), so every row is the
mean of two to six runs. CPU time is given where it shows what wall time hides.

| Workload | Before `a3cc98fc` | Before this round | After `bf912ccf` | Change this round |
|---|---|---|---|---|
| `beskid test` serialization_mod_tests, `SerializationModGenerationTests` | 180 s | 22.8 s (user 24.5 s) | 14.4 s (user 13.6 s) | -37% |
| `beskid check` `corelib/packages/compiler-sdk` | 77 s | 27.6 s (user 16.6 s, sys 10.9 s) | 11.5 s (user 10.9 s, sys 0.5 s) | -58% |
| `beskid dev mod rebuild` serialization_mod | 150 s | 27.3 s (user 32.5 s) | 12.5 s (user 12.7 s) | -54% |
| `beskid dev runtime-kit build-native-host` | n/a | 8.8 s | 6.0 s | -32% |
| `beskid test` corelib_tests, `SerializationSuite` | n/a | 7.9 s | 6.7 s | -15% |

After round 3 (`3a837a47`), `beskid check` compiler-sdk is 8.3 s (77 s before round 1); the other
workloads stay at the round-2 figures within noise.

Test results did not change: 37/37 Mod generation tests and 33/33 SerializationSuite tests in
every run, and `cargo test --locked -p beskid_analysis -p beskid_queries -p beskid_codegen
--no-fail-fast` passes (1741 passed, 0 failed, 1 ignored) on the committed state.

## Method

- The previous round's sampler: the builder container has no `perf` or `gdb`, so the host's
  nix-store `gdb` attaches to the running `beskid` process about once a second and dumps all
  thread stacks. Samples are aggregated by inclusive frame and by caller chain
  (`scratchpad/stk.py`, `callers.py`, `thr.py`). Baseline and final sample files are
  `/var/lib/beskid-codex-build/work/ct-samples-base.txt` and `ct-samples-s5.txt` on the builder host.
- Each change was staged into the private mirror on its own (stages s0 to s7 below) and measured
  with the same script: two `beskid test` runs (cold, then warm Salsa snapshot), two `beskid check`
  runs, SerializationSuite, one explicit Mod rebuild, one runtime kit build.
- The shared release tree changed under the measurements (other agents committed three times and
  edited Corelib Mod sources). Stage results are therefore compared only within one source
  snapshot: snapshot A for the per-change walk, snapshot B for the final A/B.

### Baseline profile (sample share of each command)

| Hotspot | check | test | mod rebuild |
|---|---|---|---|
| `canonicalize` (readlink) from `unit_path_key`, `same_file` in resolver seeding and rule stage 5 | 26% | - | - |
| own-unit rule pass (`own_unit_rule_diagnostics`, all stages) | 84% | - | - |
| `concrete_nominal_declaration_of_kinds` -> `stable_declaration_identity` (incl. lock contention) | - | 12 thread samples | 27 thread samples |
| `ids_of_kind` full-unit scans (type and function lookups) | - | 8 | 5 (kit) |
| `build_typed_program`: serde_json fingerprint, canonical SDK re-parse, tree clone | 6% | 17% | 4% |
| `sync_tree` fsync of the staged Mod artifact (288 files) | - | - | 20% |
| Cranelift (verifier, regalloc, `Context::compile`) | 0 | 0 | 0 |
| malloc/free/realloc | <5% | <5% | <5% |

## Changes, one at a time

Snapshot A, wall seconds (noisy; the internal `Generate CLIF` phase timer is more stable and is
given in brackets):

| Stage | Change | test (cold/warm) | check (x2) | mod rebuild | kit |
|---|---|---|---|---|---|
| s0 | baseline | 23.4 / 28.5 [CLIF 8.9] | 31.2 / 36.7 | 30.8 [CLIF 15.4] | 10.1 |
| s1 | cached canonical unit path keys | 25.0 / 28.5 [9.0] | 17.3 / 16.0 | 41.9 [16.1] | 9.0 |
| s2 | + per-kind syntax index | 28.9 / 23.5 [7.3 warm] | 15.5 / 16.8 | 25.1 [11.6] | 7.2 |
| s3 | + nominal-declaration name prefilter | 28.1 / 19.9 [5.2] | 20.2 / 22.6 | 22.6 [7.5] | 9.6 |
| s4 | + cheap typed-program re-registration | 14.4 / 17.1 [4.8] | 14.1 / 15.1 | 21.7 [5.3] | 6.8 |
| s5 | + one-pass known type names | 15.0 / 23.2 [4.7] | 22.8 / 15.8 | 26.4 [5.2] | 16.6 |

Snapshot B, A/B with CPU time (wall / user / sys):

| Stage | test1 | check1 | mod rebuild | Mod "Link native artifact" phase |
|---|---|---|---|---|
| s0 (two runs) | 23.9 / 25.2 / 3.9; 22.2 / 23.2 / 4.1 | 27.4 / 16.3 / 10.8; 26.5 / 15.5 / 10.8 | 28.8 / 34.8; 25.7 / 30.1 | 2.8 s |
| s5 | 13.7 / 13.0 / 3.4 | 11.2 / 10.8 / 0.5 | 13.0 / 12.9 | 2.0 s |
| s6 (child_at, rejected) | 13.6 / 13.2 / 3.5 | 12.4 / 11.9 / 0.5 | 15.9 / 13.0 | 4.6 s |
| s7 (+ concurrent fsync) | 13.9 / 13.0 / 3.7; 13.4 / 12.9 / 3.4 | 11.2 / 10.6 / 0.4; 11.7 / 11.1 / 0.5 | 11.3 / 11.9; 13.7 / 13.7 | 1.0 s |
| committed | 15.4 / 14.3 / 3.8 | 11.0 / 10.5 / 0.5 | 12.5 / 12.6 | - |

### 1. Cached canonical unit path keys (`beskid_analysis/src/paths.rs`)

`unit_path_key` and `same_file` called `Path::canonicalize` (one `readlink` per path component)
from `Resolver::set_current_source_path`, `collect_program_in_module` and rule stage 5, for every
unit of every own-unit rule pass. Existing absolute paths are now canonicalized once per process
(the same rule as round 1's `SourceUnitId` cache: relative and not-yet-existing paths are never
cached). `ScopedPathIdentity` deliberately keeps uncached `canonicalize`: the first verification
run failed `v06_scoped_lookup_symlink_retarget_uses_current_file_identity`, which requires a
scoped lookup to follow a retargeted symlink. Effect: `check` 31-37 s -> 16-17 s; its system time
10.8 s -> 0.5 s.

### 2. Per-kind syntax index (`beskid_analysis/src/syntax_query/syntax_index.rs`)

`SyntaxIndex::ids_of_kind` filtered the whole node metadata vector on each call, and type and
function lookups (`unique_public_type_in_unit`, `unique_nominal_type_in_unit`,
`unique_function_in_unit`, about 100 production call sites) call it per resolution. The index now
stores node ids per `NodeKind` in pre-order, built in the same pass. Effect: Mod rebuild
`Generate CLIF` 16 s -> 11.6 s; kit build 9-10 s -> 7 s.

### 3. Name prefilter in `concrete_nominal_declaration_of_kinds` (`beskid_queries/src/semantic_contract/contracts.rs`)

For each field access it computed `stable_declaration_identity` for every type of every unit of
the generation; each call scans the whole module registry under the global registry mutex, so the
parallel emit threads contended (11 of 27 thread samples in `lock_contended`). A stable identity
always ends with the declaration's own name, so only same-named declarations are tested now; the
selected candidates are the same. Effect: test `Generate CLIF` 9 s -> 5.2 s; Mod rebuild CLIF
11.6 s -> 7.5 s.

### 4. Cheap typed-program re-registration (`beskid_queries/src/db/syntax.rs`, `typed_program.rs`)

`build_typed_program` runs several times per build. For every unit it deep-cloned the tree,
computed `expanded_syntax_fingerprint` (serde_json `Value` of the whole tree, span stripping,
re-encoding) twice, and for each canonical SDK and Dynamic unit re-parsed the source and set a new
revision, which also invalidated that unit's Salsa dependents. Now:

- an unchanged registration is recognized by tree equality before any fingerprint is computed;
  the fingerprint is computed once when it is needed, and the tree is cloned only when it is
  registered (`ensure_borrowed_expanded_syntax_unit`);
- a revision that already carries the SDK or Dynamic source authority for the same source and the
  same tree keeps it; any new revision clears the authority and is re-proved by a fresh parse as
  before.

Effect: test 20-28 s -> 14-17 s (CLIF 5.2 s -> 4.8 s); Mod rebuild CLIF 7.5 s -> 5.3 s.

### 5. One-pass known type names (`beskid_analysis/src/analysis/rules/staged/definitions.rs`)

`collect_known_type_names` walked each assembly unit three times (types, enums, contracts) for
every own-unit rule pass. One traversal now collects all three. Small effect (inside noise on
`check`); kept because it removes two thirds of that work at no cost.

### 6. Concurrent flush of the staged Mod artifact (`beskid_aot/src/mod_artifact.rs`)

`sync_tree` flushed the 288 staged files one after another. The files are independent, so they now
flush on up to 16 scoped threads; directories still flush after all files and before publication,
so durability is unchanged. Effect: "Link native artifact" 2.0-4.6 s -> 1.0 s.

## Rejected

- **Index-based `child_at` for `SyntaxIndex::node_at`** (derive-generated O(fields) child
  selection instead of enumerating all siblings). Implemented and verified equivalent over every
  Corelib package source, but s6 showed no gain after the per-kind index (check 11.2 -> 12.4 s,
  inside noise), so it was reverted: 155 lines of derive code without a measured benefit.
- **pest upgrade or pest's `LineIndex`.** pest 2.9.2 already has the shared `Rc<LineIndex>` that
  makes `Pair::line_col` a binary search; it arrived with "Add `LineIndex` ... (#785)", merged
  2023-02-05 ([commits](https://api.github.com/repos/pest-parser/pest/commits?path=pest/src/iterators/line_index.rs&per_page=5),
  [pair.rs](https://raw.githubusercontent.com/pest-parser/pest/master/pest/src/iterators/pair.rs)).
  It covers only `Pair` starts. `Position::line_col` still rescans from the input start
  ([docs](https://docs.rs/pest/latest/pest/struct.Position.html),
  [position.rs](https://raw.githubusercontent.com/pest-parser/pest/master/pest/src/position.rs)),
  and the AST needs span ends too, so round 1's own line-start table stays. 2.9.3 adds no
  performance items ([releases](https://github.com/pest-parser/pest/releases)); there is no
  "fast-line-col" feature ([features](https://docs.rs/crate/pest/latest/features)). Parsing is now
  3 to 7% of samples, so grammar tuning (`@`/`$`/`_` rules, ordered choice,
  [book](https://pest.rs/book/grammars/syntax.html)) was not attempted; `pest::set_call_limit` is
  a safety limit, not a speed-up ([docs](https://docs.rs/pest/latest/pest/fn.set_call_limit.html)).
- **Cranelift settings.** `enable_verifier` defaults to true and `Context::compile` verifies again
  through `verify_if`, so the explicit `verify_function` in `beskid_isle` and the object
  compile both verify ([settings](https://docs.rs/cranelift-codegen/latest/cranelift_codegen/settings/struct.Flags.html),
  [context.rs](https://raw.githubusercontent.com/bytecodealliance/wasmtime/main/cranelift/codegen/src/context.rs)).
  No Cranelift frame (verifier, regalloc, `compile`) appeared in any sample of any workload, so
  dropping the duplicate verification or switching `regalloc_algorithm` would save nothing
  measurable and would weaken the stock-verifier-clean contract. Dev builds already use
  `opt_level = none`.
- **mimalloc.** malloc, free and realloc stayed under 5% of samples in every workload. The crate
  needs a C build step ([mimalloc_rust](https://github.com/purpleprotocol/mimalloc_rust)); the
  builder can fetch crates (it has network and `CARGO_HOME=/cargo`), but no profile supports the
  dependency. No `Cargo.toml` or `Cargo.lock` change was made.
- **Salsa durability, `returns(ref)`, LRU, upgrade.** The vendored salsa is 0.26.2
  (`compiler/vendor/salsa-patched`). Durability lets queries that read only `HIGH` inputs skip deep
  verification after a `LOW` change ([Durability](https://docs.rs/salsa/latest/salsa/struct.Durability.html)).
  The profiles show no deep-verification or memo-clone cost after change 4: the remaining Salsa
  frames are first executions (`execute_query`, `fetch_cold`). Change 4 removed the per-build
  `set_revision` churn on SDK and Dynamic units, which was the only measured recomputation
  source. salsa 0.27 to 0.28.5 has performance work (lazy memo slots, never-change durability,
  sharded synchronization) and a use-after-free fix
  ([CHANGELOG](https://raw.githubusercontent.com/salsa-rs/salsa/master/CHANGELOG.md)), but
  upgrading means porting `BESKID-PATCH.md`; that is a separate task.
- **rayon for per-unit parsing.** Parsing is under 7% of samples and cold parses are mostly served
  by the AST store; no gain to collect.
- **Skipping fsync for Mod artifacts.** Durability of the immutable cache entry is a design
  decision; concurrent flushing (change 6) got the time without changing it.

## Round 3: shared declaration tables, name table, unit index

Coordinator ruling on the former remaining cost 1: units of one package see each other, so
excluding the entry unit from its dependencies' view is a quirk, not a language rule.

### Changes

1. **Assembly declaration tables, resolved once** (`beskid_analysis/src/projects/assembly/module_index/resolution.rs`,
   `services/prepare/spine.rs`, `analysis/rules/core.rs`, `staged/name_resolution.rs`).
   `ModuleIndex::assembly_declaration_tables` seeds one resolver with every unit of the assembly
   and resolves each unit's declaration annotations under its own module and import scope.
   `own_unit_rule_diagnostics` computes the tables once and hands them to every per-unit rule run
   through `AnalysisOptions::assembly_declaration_tables`; `resolve_entry_program` merges the
   tables of every unit but its entry. Callers without shared tables (the production entry
   resolution, tests) compute the same tables for their own assembly, so every path uses one rule.
   The entry resolver itself is still seeded per analyzed unit (it collects the entry at the root
   and every other unit in its module), which remains the main per-unit cost of `check`.
2. **Per-unit name table** (`beskid_analysis/src/syntax_query/syntax_index.rs`). `SyntaxIndex`
   keeps declaration ids per kind and name for types, enums, contracts, functions and methods
   (`ids_named`). `unique_public_type_in_unit`, `unique_nominal_type_in_unit`,
   `lexical_type_in_unit`, `unique_function_in_unit`, `unique_public_function_in_unit`, the
   lexical module and function lookups in `resolution.rs`, and
   `concrete_nominal_declaration_of_kinds` now visit only same-named declarations.
   `public_reexport_units` reads the import list without cloning binding names.
3. **Generation-scoped unit index** (`beskid_queries/src/db.rs`, `typed_program.rs`). The
   registry writes modules only through `publish_modules`, which keeps each generation's unit list
   and each unit's least module path. `concrete_nominal_declaration_of_kinds`, the Dynamic pack
   unit scan and `stable_declaration_identity` use them instead of scanning every module of every
   generation under the registry lock.

### Diagnostics equivalence

`beskid check --project <p> --offline --plain --json` ran before and after over 61 projects: every
`.bproj` under `corelib/` (all Corelib packages, their test projects, the corelib_tests project and
its compile-fail fixtures, the Mod packages, the networking repros), `runtime/beskid/tests/runtime_semantics`,
and every `beskid_tests_projects` fixture project. The JSON records (diagnostics and results) are
byte-identical for all 61 projects and the exit codes match (17 projects fail before and after,
all expected compile-fail or repro projects). Only log timestamps and phase timings in stderr differ.
No diagnostic changed, so no correctness fix had to be justified.

### Measurements

Snapshot C, private mirror, two before/after pairs (wall / user seconds):

| Workload | Before (round 2) | After (round 3) |
|---|---|---|
| `beskid check` compiler-sdk | 13.6 / 13.1; 13.1 / 12.2; 12.2 / 11.6; 12.6 / 12.0 | 8.3 / 7.7; 9.1 / 8.3; 7.7 / 7.0; 8.1 / 7.5 |
| `SerializationModGenerationTests` | 16.9, 16.6, 13.9, 14.9 | 13.7, 14.6, 15.6, 16.8 |
| `dev mod rebuild` | 13.6, 11.9 | 17.9 (load spike; user 12.1), 12.8 |
| `runtime-kit build-native-host` | 9.5, 6.5 | 6.9, 6.0 |
| SerializationSuite | 7.3, 6.6 | 7.0, 6.8 |

`check` drops from 12.9 s to 8.3 s (-36%; -61% user CPU against the 16.6 s before round 2). The
name table and unit index make the remaining lookups proportional to same-named declarations,
but on these workloads their effect is inside run-to-run noise: after round 2 the lookups were no
longer a visible share of the profile.

Verification: `cargo test --locked -p beskid_analysis -p beskid_queries -p beskid_codegen
--no-fail-fast` on shared slot w2 (worktree state at commit time): 1743 passed, 0 failed,
1 ignored.

## Remaining costs

1. **Per-unit entry seeding in `check`.** Each own-unit analysis still seeds a fresh resolver with
   every other unit (`seed_resolver_from_assembly`) before resolving the analyzed unit's bodies.
   Sharing one seeded resolver needs `Resolver: Clone` (or a seeded-state snapshot) and a way to
   collect the entry at the root without duplicating the items it already has in its module, so it
   is a resolver design change rather than a cache.
2. **Salsa 0.28** (see Rejected) for lower per-query overhead once the remaining work is first
   executions of tracked queries.

## Reproduce

```sh
# builder, slot w2, private mirror and state (see scratchpad ct/runc.sh)
SLOT=w2 RGATE_MIRROR=v06-src-ct RGATE_NOSYNC=1 RGATE_ENV='TAG=x STATE=/workspace/v06-ct-state2' \
  .build/rgate-slot.sh ct-x --sh "$(cat .build/rc-prep.remote.sh) <measurement body>"
# verification (cwd compiler/)
cargo test --locked -p beskid_analysis -p beskid_queries -p beskid_codegen --no-fail-fast
```
