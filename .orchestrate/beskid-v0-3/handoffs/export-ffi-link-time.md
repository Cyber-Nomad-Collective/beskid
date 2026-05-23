# Handoff — export-ffi-link-time (subplanner A3)

- **Track**: `export-ffi-link-time` (subplanner A3 of `beskid-v0-3`)
- **Branch**: `orch/beskid-v0-3/export-ffi-link-time` (from `main`)
- **Subplan**: `.orchestrate/beskid-v0-3/orch/export-ffi-link-time/plan.json`
- **Mission**: `[Export]` lowering + callback registration with GC-safe trampolines + link-time extern via the project `link` block; un-ignore and pass the three `ffi_v03_link_time.rs` engine tests on Linux tier-1; refresh export/callback + link-time spec verification-and-traceability.

## Status (planner phase)

| Item | State |
| --- | --- |
| Branch created from `main` (superrepo + compiler submodule) | done |
| Subplan authored (`orch/.../plan.json`) | done |
| Workers + verifier defined | done (2 workers + 1 verifier) |
| Implementation | pending (delegated to spawned workers) |
| Verification | pending (delegated to verifier) |

Planners do not code. Implementation is delegated to the two workers below; the verifier runs the required test commands at the end of the track.

## Decomposition

### Worker 1 — `export-ffi-spec-traceability`

Spec-only worker that refreshes verification-and-traceability across the export/callback + C ABI link-time pages once the impl worker has named the real modules. Touches only MDX files under `language-meta/interop/`.

- Allowed paths: see `plan.json` `pathsAllowed`. ADR pages, `extern-contracts-and-linking.mdx`, `export-attribute.mdx`, and other normative siblings are forbidden.
- Verify: `cd site/website && bun run verify:trudoc -- --preset ci` and `bun run verify:platform-spec-content -- --strict`.

Notes for the worker:

- The current `export-and-callbacks/verification-and-traceability.mdx` opens with "v0.3 Standard text precedes full codegen and linker support" — replace that caveat with a Reference compiler status table once the impl worker lands the modules; cite real file paths in backtick prose so trudoc's `remark-inline-repo-paths` plugin linkifies them.
- Do **not** touch `## Decisions` blocks or ADR pages. Only update verification anchors / reference compiler status sections.
- `lastReviewed` should be bumped to the change date on every page touched.
- If the impl worker hasn't merged yet, leave TODO markers (concrete enough for the verifier to confirm/replace) rather than fabricating file or symbol names.
- Escape angle-bracket generics in MDX tables and prose (e.g. `` `Spanned<HirFunctionDefinition>` ``).

### Worker 2 — `export-ffi-link-time-impl`

The heavy implementation worker. Splits responsibilities across:

- **Codegen** — recognise `[Export(Abi:"C", Symbol:"...")]` on `pub` functions, expose `CodegenArtifact::exports`, add `lowering/expressions/export.rs`, validate FFI signatures using the existing `validate_ffi_signature` allowlist (no duplication).
- **AOT** — new `beskid_aot/src/export_table.rs` re-exported from `lib.rs`; new `AotBuildRequest::external_libraries: Vec<String>` field consumed by `linker.rs` as `-l<library>` / `<lib>.lib`; new `AotError::UnresolvedExternLibrary` diagnostic for missing libs; `object_module.rs` keeps `Linkage::Export` for user functions with a documented rationale aligned with the parity test.
- **Runtime + ABI** — new `builtins/callback.rs` with `beskid_register_callbacks(version, table, count) -> i32`, validating the new `BESKID_USER_FFI_LAYOUT_BAND` from `beskid_abi`; GC-safe trampoline entry that calls `enter_runtime_scope()` before invoking Beskid code; new `SYM_BESKID_REGISTER_CALLBACKS` const added to `RUNTIME_EXPORT_SYMBOLS` and `BUILTIN_SPECS`; re-exported from `beskid_runtime::lib`.
- **Engine consumer-side** — `beskid_engine` plumbs `manifest.link.libraries` (when the foreign-lib branch's `ProjectLinkSection` model field exists) into `AotBuildRequest.external_libraries`. Defensive `if let Some(link) = &manifest.link` keeps the branch buildable when `foreign-lib-import-cli` hasn't merged.
- **Tests** — rewrite `compiler/crates/beskid_engine/tests/ffi_v03_link_time.rs` to drop `#[ignore]` and assert: (1) link-time `getpid` round-trip executes via `-lc`; (2) `[Export]` SharedLib symbol visible to linker (`nm -D` or `dlopen`); (3) callback registration band version gate returns 0 for correct band and 1 for mismatch. New `compiler/crates/beskid_tests/src/interop/{export,callback}.rs` cover portable assertions (artifact shape, ABI exports). `compiler/crates/beskid_tests/src/analysis/ffi_v03_spec.rs` gets at most one or two small additions for `[Export]` on a non-`pub` function.

Constraints:

- Stay strictly inside `pathsAllowed`. Forbidden: `composition_policy.rs`, `composition/**`, `mod_host/**`, `beskid_analysis/src/projects/**` (foreign-lib's domain), `beskid_cli/src/commands/**`, `abfall/**`, corelib `Collections`/`System` paths.
- Linux tier-1 only. macOS/Windows-only failures are acceptable behind `#[cfg]` gates; the spec defers them.
- `BESKID_RUNTIME_ABI_VERSION` is frozen — do not bump it. `BESKID_USER_FFI_LAYOUT_BAND` is a new, independent constant.
- Phase A single-mutator invariant: trampolines must `enter_runtime_scope()` and install heap/root TLS before invoking Beskid code; never allocate from a non-runtime-scoped thread.
- Run the JIT extern regression suite after edits (`extern_tests`, `extern_security`, `extern_bad_sig`, `extern_frontend_validation`) — it must stay green.

### Verifier — `verify-export-ffi-link-time-subtrack`

Runs the parent track's three required commands plus regressions and grep anchors. Mirrors the parent `verify` block:

```bash
cd compiler && cargo test -p beskid_engine ffi_v03 -- --test-threads=1
cd compiler && cargo test -p beskid_tests interop:: -- --test-threads=1
cd site/website && bun run verify:trudoc -- --preset ci
```

Additionally:

```bash
cd compiler && cargo test -p beskid_engine extern -- --test-threads=1
cd compiler && cargo test -p beskid_tests analysis::ffi_v03 -- --test-threads=1
rg -n 'lastReviewed' site/website/src/content/docs/platform-spec/language-meta/interop/export-and-callbacks/verification-and-traceability.mdx
rg -n 'beskid_register_callbacks|BESKID_USER_FFI_LAYOUT_BAND' compiler/crates/beskid_abi/src/symbols.rs
rg -n 'SYM_BESKID_REGISTER_CALLBACKS' compiler/crates/beskid_abi/src/builtins.rs
rg -n 'external_libraries' compiler/crates/beskid_aot/src/api.rs compiler/crates/beskid_aot/src/linker.rs
rg -n '#\[ignore' compiler/crates/beskid_engine/tests/ffi_v03_link_time.rs   # must be empty
```

Live-UI smoke (Linux runner only):

```bash
# 1. Build the SharedLib export fixture, assert symbol presence:
nm -D <fixture>.so | rg beskid_plugin_init

# 2. Link the getpid fixture and run it; exit code must match calling process PID:
./<fixture-getpid> ; echo $?
```

Report `unit-test-verified` when the five cargo runs and all greps pass; promote to `live-ui-verified` only when the Linux runner actually executes both smokes.

## Spec anchors (read-only context)

- `site/website/src/content/docs/platform-spec/language-meta/interop/export-and-callbacks/index.mdx` — Standard feature hub; ADRs `D-LMETA-EXPORT-0001..0004` are normative.
- `site/website/src/content/docs/platform-spec/language-meta/interop/export-and-callbacks/export-attribute.mdx` — Standard; `[Export(Abi:"C", Symbol:"...")]` placement rules.
- `site/website/src/content/docs/platform-spec/language-meta/interop/export-and-callbacks/callback-registration.mdx` — Standard; `beskid_register_callbacks(version, table, count)` registration shape, host must reject unknown `version` against `BESKID_USER_FFI_LAYOUT_BAND`.
- `site/website/src/content/docs/platform-spec/language-meta/interop/export-and-callbacks/verification-and-traceability.mdx` — Standard; currently says reference compiler trails — Worker 1 refreshes this.
- `site/website/src/content/docs/platform-spec/language-meta/interop/c-abi-profile/link-time-linking.mdx` — Standard; mandates link-time resolution via project `link` metadata, AOT/JIT parity, version-script export policy.
- `site/website/src/content/docs/platform-spec/language-meta/interop/c-abi-profile/extern-contracts-and-linking.mdx` — Standard read-only; already names `ExternImport` in `compiler/crates/beskid_codegen/src/lowering/context.rs`.
- `site/website/src/content/docs/platform-spec/language-meta/interop/ffi-and-extern/**` — Beskid syntax for extern contracts; worker 1 adds a single cross-reference paragraph on link-time resolution.

## Initial-state notes (subplanner phase)

- Repo root: `/Users/mikserek/Projects/beskid`
- Superrepo branch: `orch/beskid-v0-3/export-ffi-link-time`, tracking `origin/main`.
- Superrepo HEAD (before subplan commit): `e68fa94c2939ddad6047c4fd124761bbf3286412` (carries sibling `codegen-coverage-dynamic-types` orchestration artifacts that landed in the shared workspace; these are orchestration-only and do not conflict with this track).
- Compiler submodule branch: `orch/beskid-v0-3/export-ffi-link-time`, tracking `origin/main`.
- Compiler submodule HEAD: `6ae272bac6264b196e6d2500138db8981cc1b65f` (matches `origin/main`).
- Working directory has a local stash named `wip-foreign-lib-link-block-preexisting` carrying the sibling `foreign-lib-import-cli` worker's in-progress `ProjectLinkSection` model addition; do not unstash on this branch.
- `compiler/crates/beskid_aot/src/export_table.rs`, `compiler/crates/beskid_codegen/src/lowering/expressions/export.rs`, `compiler/crates/beskid_codegen/src/lowering/expressions/extern_call.rs`, and `compiler/crates/beskid_runtime/src/builtins/callback.rs` do **not** exist yet (Worker 2 creates them).
- `compiler/crates/beskid_tests/src/interop/mod.rs` currently wires only `mod dispatch;`; Worker 2 adds `mod export;` and `mod callback;`.
- `compiler/crates/beskid_engine/tests/ffi_v03_link_time.rs` currently has three `#[ignore = "v0.3 FFI impl: ..."]` placeholders (`Ok(())` bodies). Worker 2 rewrites them to real Linux assertions.
- Existing extern path (JIT dlopen) flows through `compiler/crates/beskid_engine/src/engine.rs` `resolve_extern_symbols` behind `feature = "extern_dlopen"`. v0.3 link-time path is a NEW path through `beskid_aot::linker` and `AotBuildRequest.external_libraries`; do not collapse them.
- `compiler/crates/beskid_aot/src/api.rs` `AotBuildRequest` currently has no `external_libraries` field — Worker 2 adds it.
- `compiler/crates/beskid_aot/src/linker.rs` already implements export-policy version scripts (`-Wl,--version-script=<file>` on Linux, `-Wl,-exported_symbol,_<sym>` on macOS, `-Wl,/EXPORT:<sym>` on Windows). Worker 2 reuses these paths; `[Export(Symbol:"...")]` seeds `ExportPolicy::Explicit`.
- `compiler/crates/beskid_codegen/src/lowering/context.rs` `CodegenArtifact` currently has fields `functions`, `type_descriptors`, `string_literals`, `extern_imports`. Worker 2 adds `exports: Vec<ExportEntry>`.
- `compiler/crates/beskid_codegen/src/lowering/lowerable.rs` `lower_program` collects `extern_imports` from `collect_extern_imports`. Worker 2 adds a parallel `collect_exports` helper and populates the new `exports` field.
- `compiler/crates/beskid_runtime/src/interop/dispatch_table.rs` is the closest existing precedent for the callback table layout (tag-driven host handlers). Worker 2 should mirror its `#[repr(C)]` style for `CallbackTableEntry`.
- `compiler/crates/beskid_abi/src/builtins.rs` is the canonical `BUILTIN_SPECS` list (currently 54 entries spanning alloc, GC, fibers, channels, hubs, mutex, wait group, syscalls). Worker 2 appends `SYM_BESKID_REGISTER_CALLBACKS`; keep `BUILTIN_SPECS` alphabetical-by-domain ordering (currently grouped by domain, not strictly alphabetical).
- `compiler/crates/beskid_abi/src/symbols.rs` `RUNTIME_EXPORT_SYMBOLS` is consumed by JIT module builders; Worker 2 appends `SYM_BESKID_REGISTER_CALLBACKS` so the JIT host can also register foreign callbacks.

## Acceptance traceability (parent task)

| Parent acceptance line | Owner | Where it lands |
| --- | --- | --- |
| `[Export]` on `pub fn` emits a public symbol callable from a C host | Worker 2 | `beskid_codegen/src/lowering/expressions/export.rs`, `beskid_codegen/src/lowering/context.rs` (`exports` field), `beskid_aot/src/export_table.rs`, `beskid_engine/tests/ffi_v03_link_time.rs::export_plugin_init_visible_to_linker` |
| Callback registration table + GC-safe trampoline | Worker 2 | `beskid_runtime/src/builtins/callback.rs`, `beskid_abi/src/symbols.rs` (`SYM_BESKID_REGISTER_CALLBACKS`, `BESKID_USER_FFI_LAYOUT_BAND`), `beskid_abi/src/builtins.rs` (`BUILTIN_SPECS`), `beskid_engine/tests/ffi_v03_link_time.rs::host_registers_callbacks_with_layout_band` |
| Link-time `getpid()` via project `link` block, no dynamic resolution | Worker 2 | `beskid_aot/src/api.rs` (`external_libraries`), `beskid_aot/src/linker.rs` (`-l<lib>`), `beskid_engine/src/**` (manifest-link consumer), `beskid_engine/tests/ffi_v03_link_time.rs::link_time_extern_getpid_matches_platform_spec` |
| Three previously `#[ignore]` engine tests un-ignored and passing on Linux | Worker 2 | `beskid_engine/tests/ffi_v03_link_time.rs` |
| Spec verification-and-traceability for export-and-callbacks + link-time-linking updated | Worker 1 | `language-meta/interop/export-and-callbacks/verification-and-traceability.mdx`, `c-abi-profile/link-time-linking.mdx`, `export-and-callbacks/index.mdx`, `export-and-callbacks/callback-registration.mdx`, `ffi-and-extern/index.mdx` |
| `cargo test -p beskid_engine ffi_v03`, `cargo test -p beskid_tests interop::`, `verify:trudoc --preset ci` green | Verifier | three commands above (+ regression + grep anchors) |

## Coordination with sibling tracks

- **`foreign-lib-import-cli`** owns the `beskid_analysis/src/projects/**` link block model + the `beskid import lib` CLI. Worker 2 must NOT touch those paths; it consumes the model defensively (`if let Some(link) = &manifest.link`) so the branch builds on `main` before foreign-lib merges. Aggregate-merge will reconcile.
- **`compiler-mod-execution`** lands the `mod.collect` / `mod.generate` / `mod.analyze` / `mod.rewrite` pipeline. No file-level overlap; both tracks share `compiler/crates/beskid_analysis/src/analysis/**` but our usage is read-mostly (one or two analysis tests for `[Export]` on non-`pub`).
- **`native-di-codegen-runtime`** and **`runtime-phase-b-gc-syscall`** and **`codegen-coverage-dynamic-types`** share `beskid_runtime/src/lib.rs` and `beskid_runtime/src/builtins/mod.rs` for re-exports. Aggregate-merge should union-merge those files; our additions (`pub use builtins::callback::beskid_register_callbacks`) are additive.

## Return artefacts

- **Branch**: `orch/beskid-v0-3/export-ffi-link-time`
- **SHA at planner handoff**: filled by the commit message that adds this handoff (see git log on the branch).
- **Subplan**: `.orchestrate/beskid-v0-3/orch/export-ffi-link-time/plan.json`
- **Handoff**: `.orchestrate/beskid-v0-3/handoffs/export-ffi-link-time.md` (this file)
- **Tests required by parent**:
  - `cd compiler && cargo test -p beskid_engine ffi_v03 -- --test-threads=1`
  - `cd compiler && cargo test -p beskid_tests interop:: -- --test-threads=1`
  - `cd site/website && bun run verify:trudoc -- --preset ci`

## Follow-ups for downstream

- Aggregator (`aggregate-merge-all`) merges this branch third in the documented order. Conflicts in `compiler/crates/beskid_codegen` against `native-di-codegen-runtime`, `runtime-phase-b-gc-syscall`, and `codegen-coverage-dynamic-types` should prefer the version with most-complete acceptance coverage; this track only adds new files in `lowering/expressions/` plus targeted edits to `context.rs`, `lowerable.rs`, `function.rs`, `cranelift_host.rs`, and `module_emission.rs`, so most conflicts should be resolvable as union merges.
- Aggregator must union-merge `compiler/crates/beskid_runtime/src/lib.rs` and `compiler/crates/beskid_runtime/src/builtins/mod.rs` between this track and the other runtime-touching tracks. Same for `compiler/crates/beskid_abi/src/{builtins.rs,symbols.rs}`.
- Aggregator must union-merge `compiler/crates/beskid_aot/src/lib.rs` re-exports (new `export_table` module).
- If `foreign-lib-import-cli` lands AFTER this track, the engine's manifest-link consumer will start populating `external_libraries` for real; until then, link-time linking only fires when the engine consumer is invoked with an explicit `external_libraries` Vec (which is what the un-ignored `link_time_extern_getpid` test does).
- `BESKID_USER_FFI_LAYOUT_BAND` is initialised at `1`. Future bumps require updating the corresponding `beskid_register_callbacks` rejection threshold and adding a migration note in the callback-registration spec page.
- Spec page `extern-contracts-and-linking.mdx` already references `ExternImport` in codegen; if the implementation worker renames or moves `ExternImport`, Worker 1 must follow up (otherwise leave it untouched — that page is in this track's `pathsForbidden`).
