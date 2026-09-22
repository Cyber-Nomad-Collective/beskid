# F6 Source-Origin Provenance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve source origin separately from canonical semantic identity so only compiler-owned Corelib source obtains generation-bound service authority.

**Architecture:** Source units carry an uncanonicalized request origin and the existing canonical key. One binder rebases every cold and cached parse result onto the current request; typed-program construction alone evaluates direct or materialized trust using origin, canonical target, exact bytes, and unique candidate evidence.

**Tech Stack:** Rust 2024, Salsa-backed semantic queries, Beskid project assembly, existing ABI Corelib-source inventory, Rust integration tests, Windows x64 native harness.

**Spec:** `docs/superpowers/specs/2026-09-21-f6-source-origin-provenance-design.md`; diagnosis: `.superpowers/sdd/2026-09-21-f6-native-descriptor-contract/f6-service-origin-design.md`.

## Global Constraints

- Preserve `SourceUnit.path` as the canonical semantic key; `origin_path` is request evidence, never a second key or service capability.
- The typed-program service registry is the sole authority owner. Builders, caches, and loaders transport evidence only.
- A user origin is never made trusted by canonicalizing it, suffix/prefix matching, `same_file`, a raw import allowlist, or a lowering fallback.
- Preserve the ABI-owned Corelib source inventory as the single mapping from logical path to declared and canonical identities.
- Direct and materialized source authorization requires exact embedded bytes and fails closed when an identity cannot be established.
- Do not modify Core.IO, descriptor logic, ISLE rules, native workers/fixtures, ABI manifests, public APIs, dependency graph alias policy, or credentials/remote configuration.
- Use an isolated compiler worktree, no push/merge/publish, and record the independent Windows JIT relocation limitation as unavailable rather than green.

## Review Focus

- A user file symlink to Core/Syscall/Syscall.bd must not become a CorelibService after UnitBuilder canonicalizes its target.
- A user directory symlink and an aliased loader entry must remain denied, not merely final-file symlinks.
- Cache hit order must not allow a formerly canonical unit to lend authority to a copied/symlinked request.
- A real Corelib source under normal and Windows extended canonical paths must retain `__syscall_write -> syscall_write` authority.
- An explicit loader-issued materialized dependency may retain authority, while a user alias to its destination may not.

### Task 1: Bind source origin with canonical semantic identity

**Files:**
- Modify: `compiler/crates/beskid_analysis/src/projects/assembly/mod.rs`
- Modify: `compiler/crates/beskid_analysis/src/projects/assembly/unit_builder.rs`
- Modify: existing analysis assembly/unit-builder tests adjacent to the builder

**Interfaces:**
- Produces: `SourceUnit { logical_name, origin_path, path, source, program }`, where `origin_path` is the request spelling and `path` is `unit_path_key(origin_path)`.
- Produces: one binder/constructor used by all cold and cache reconstruction paths.

- [ ] **Step 1: Write a failing builder-origin test**

Create a temporary real source and a user-controlled symlink to it. Build from
the symlink with the normal `UnitBuilder`; assert `unit.origin_path` is the
symlink request path and `unit.path` is its canonical target. Add the inverse
order test (real then symlink) so content reuse cannot choose the first
request's origin.

- [ ] **Step 2: Run the new test red**

Run: `cargo test -p beskid_analysis <exact_builder_origin_test> -- --exact --nocapture`

Expected: failure because `SourceUnit` has no request-specific origin and the
existing builder stores only the canonical key.

- [ ] **Step 3: Add the required evidence field and binder**

Add `origin_path: PathBuf` to analysis `SourceUnit`. Introduce one constructor
or rebind method with the effective shape:

```rust
fn bind_request_unit(
    origin_path: PathBuf,
    logical_name: String,
    source: String,
    program: Arc<Program>,
) -> SourceUnit {
    SourceUnit { path: unit_path_key(&origin_path), origin_path, logical_name, source, program }
}
```

Use it for fresh parse and disk snapshot reconstruction. Do not persist or
trust snapshot path metadata as origin.

- [ ] **Step 4: Run builder and affected analysis tests green**

Run the exact new tests plus the existing unit-builder/assembly suite selected
by the repository's current test module. Expected: cold and disk paths return
the current request origin with unchanged canonical `path` behavior.

- [ ] **Step 5: Commit the analysis transport seam**

Commit analysis model, binder, constructor migration, and tests only:

```bash
git add crates/beskid_analysis/src/projects/assembly crates/beskid_analysis/tests
git commit -m "fix(analysis): retain source request origin"
```

### Task 2: Preserve entry origin and rebind content-cache returns

**Files:**
- Modify: `compiler/crates/beskid_analysis/src/projects/assembly/loader/orchestration.rs`
- Modify: `compiler/crates/beskid_queries/src/materializer.rs`
- Modify: `compiler/crates/beskid_queries/src/unit.rs`
- Modify: their existing loader/materializer/unit tests

**Interfaces:**
- Consumes: Task 1 binder and `SourceUnit.origin_path`.
- Produces: every loader, materializer, and public unit-query result rebound to the current request.

- [ ] **Step 1: Write failing loader and cache regressions**

Use a user symlink as the ImportClosure entry and separately as a WorkspaceScan
entry. Assert the yielded unit retains the user origin but canonical key. Add
content-identical real/copy requests in both orders through the disk store,
Salsa materializer, and public parse facade; assert every returned unit has the
current request origin, never the cached request's origin.

- [ ] **Step 2: Run exact tests red**

Run the selected loader, materializer, and unit-query test names. Expected:
entry canonicalization or content-cache return leaks a canonical/previous
origin.

- [ ] **Step 3: Keep raw entry path and rebind all cache returns**

Queue raw entry paths for loading. Derive a separate canonical key only for
`seen`, physical de-duplication, and entry-text selection. After every disk,
Salsa, materializer, or public content-cache hit, invoke the Task 1 binder
with the caller's path/logical identity. Do not change `unit_path_key` or cache
keys.

- [ ] **Step 4: Run green cache/loader tests and constructor migration checks**

Run the exact regressions, affected analysis/query crate test suites, and
`cargo check -p beskid_analysis -p beskid_queries --tests`. Expected: all
constructors compile; aliases remain distinguishable as origins while canonical
semantic keys remain identical.

- [ ] **Step 5: Commit cache and loader transport**

Commit only source-origin transport and its tests:

```bash
git add crates/beskid_analysis/src/projects/assembly/loader crates/beskid_queries/src/materializer.rs crates/beskid_queries/src/unit.rs
git commit -m "fix(queries): rebind source provenance per request"
```

### Task 3: Require origin evidence at service admission

**Files:**
- Modify: `compiler/crates/beskid_abi/src/runtime_source/corelib_services.rs`
- Modify: `compiler/crates/beskid_queries/src/typed_program.rs`
- Modify: `compiler/crates/beskid_analysis/src/projects/assembly/loader/trusted_paths.rs`
- Modify: `compiler/crates/beskid_queries/tests/semantic_facts/runtime_authority.rs`
- Modify: existing trusted-path/ABI source-inventory tests

**Interfaces:**
- Consumes: direct `origin_path`, canonical `path`, loader-issued materialized paths, and ABI identity resolver.
- Produces: CorelibService facts only when direct or materialized provenance is exact.

- [ ] **Step 1: Write failing end-to-end authority tests**

Through normal UnitBuilder and loader paths, create file and directory symlinks
to actual Core/Syscall/Syscall.bd and assert `__syscall_write` has no
`CallLowering::CorelibService`. Retain copied/altered denials. Add an allowed
real compiler-source case under canonical Windows path spelling and an allowed
loader-issued materialized source case; add a denied user alias to that
materialized file.

- [ ] **Step 2: Run direct authority tests red**

Run Windows: `cargo test -p beskid_queries --test semantic_facts <exact_symlink_authority_test> -- --exact --nocapture`.

Expected before this task: a normal-builder alias is admitted because its
canonical `path` is the Corelib target and no separate origin is checked.

- [ ] **Step 3: Extend the ABI-owned identity resolver and typed admission**

Make the existing logical-path inventory return compiler-declared source
location and canonical target from one mapping. In typed admission, retain
embedded-byte and unique-candidate checks, then require:

```rust
direct_origin_is_compiler_owned(&unit.origin_path, &expected.declared_path)
    && unit.path == expected.canonical_path
    && final_target_is_regular(&unit.path)
```

For materialized units require the explicit loader-issued destination matches
both `origin_path` and `path`; do not derive trust from source bytes or user
canonicalization. Fail closed when either identity is missing.

- [ ] **Step 4: Run green authority and materialized-path suites**

Run exact symlink/copy/altered/materialized tests, ABI inventory tests, trusted
path tests, and relevant queries semantic-facts suite. On Windows run direct
normal and extended canonical path positives plus both file/directory symlink
negatives. Expected: only declared direct or explicitly materialized source
receives `CorelibService`.

- [ ] **Step 5: Commit the sole admission change**

Commit the ABI identity projection, typed admission predicates, trusted-path
alignment, and authority tests together:

```bash
git add crates/beskid_abi/src/runtime_source/corelib_services.rs crates/beskid_queries/src/typed_program.rs crates/beskid_analysis/src/projects/assembly/loader/trusted_paths.rs crates/beskid_queries/tests/semantic_facts
git commit -m "fix(queries): require Corelib source origin evidence"
```

### Task 4: Verify native behavior and review the provenance branch

**Files:**
- Modify: the existing F6 evidence report/ledger only after commands complete
- Test: `compiler/crates/beskid_engine/tests/foundation_io_native.rs`

**Interfaces:**
- Consumes: Tasks 1–3 source provenance and typed authority.
- Produces: accurate target matrix evidence, never a surrogate JIT result.

- [ ] **Step 1: Run focused local compiler verification**

Run:

```bash
cargo test -p beskid_analysis
cargo test -p beskid_queries --test semantic_facts
cargo test -p beskid_abi --lib runtime_source::tests::embedded_service_sources_and_service_descriptors_have_one_exact_path_inventory -- --exact
git diff --check
```

Expected: source-origin transport and authority suites pass; unrelated existing
failures, if any, are named and not hidden.

- [ ] **Step 2: Run native Windows evidence**

On the authorized Windows x64 guest, record revision/toolchain/source closure,
then run the Windows semantic authority symlink tests followed by:

```bash
cargo test -p beskid_engine --test foundation_io_native -- --nocapture --test-threads=1
cargo test -p beskid_engine --test external_wait_native -- --nocapture --test-threads=1
cargo test -p beskid_abi --test external_owner_transport -- --nocapture --test-threads=1
```

Expected: source/AOT/shared routes pass. Preserve Windows JIT `PosOverflow`
as the separately tracked Cranelift blocker if it recurs; do not recast it as
a provenance or descriptor failure.

- [ ] **Step 3: Require independent review before evidence promotion**

Review the entire provenance range for origin loss at every cache/loader path,
alias authority, constructor migration, materialized trust, Windows path
representation, and scope drift. Amend findings test-first; do not update
OpenSpec completion markers or CHANGELOG until the complete cross-platform
release matrix is truly satisfied.

## Self-Review

- Spec coverage: Task 1 provides the data model/binder; Task 2 covers loader and all content caches; Task 3 makes typed-program the sole authority owner; Task 4 provides target and review evidence.
- Placeholder scan: every task names exact seams, command families, expected red/green conditions, and commit boundaries.
- Type consistency: `origin_path: PathBuf` is request evidence; `path: PathBuf` remains canonical semantic identity; `CorelibService` continues to be generation-bound typed-program output.
- Review focus: Task 2 owns entry/cache aliases; Task 3 owns direct/materialized authority; Task 4 owns Windows path and native behavior claims.

## Execution Handoff

Use subagent-driven development as previously authorized for this release program. The user has authorized in-repository implementation and overnight design decisions; continue task-by-task with an independent reviewer after each task. Pushes, merges, publishing, credential changes, destructive cleanup, external service changes, and a broader dependency-graph alias policy remain outside this plan.
