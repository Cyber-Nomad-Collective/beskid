# Portable Project.lock v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make one committed `Project.lock` valid after relocating a checkout and across Linux, macOS, and Windows, without weakening dependency provenance or registry integrity.

**Architecture:** A strict v2 codec stores source-kind-specific, portable identities; the resolver validates those identities against the current graph and verified Corelib root before preparation or LSP replay. Registry resolution consumes version-and-digest pins from an existing v2 lock, while explicit CLI lock/update commands are the only v1 migration and refresh paths.

**Tech Stack:** Rust (`beskid_analysis`, `beskid_cli`, `beskid_lsp`, `beskid_tests_projects`), `sha2`, OpenSpec, Corelib fixtures; Linux builder, throttled macOS, key-only Windows VM.

**Spec:** [Portable Project.lock v2 design](../specs/2026-09-28-portable-project-lock-v2-design.md)

## Global Constraints

- The header is exactly `# Project.lock v2`; unknown headers and malformed v2 always fail.
- Entries contain `name`, `source=path|corelib|registry`, `project`, `manifest`, `source_root`, and `materialized_root`; registry also requires `registry`, `resolved_version`, and `artifact_digest=sha256:<64 lowercase hex>`.
- On disk, path separators are `/`; v2 rejects absolute, drive-prefixed, UNC, empty-segment, and unsafe traversal paths. Only a declared external `path` project may use normalized `..`.
- Encode UTF-8 values canonically: ASCII alphanumerics and `._/:-@+` remain literal; all other bytes use uppercase `%HH`.
- Resolve `corelib` only against a verified installed Corelib workspace root; a name or lock claim never grants Corelib provenance.
- Stable materialization IDs are SHA-256 of a length-delimited logical tuple, truncated to 128 bits; no machine path or `DefaultHasher` input.
- Registry dependencies pin version and artifact SHA-256; missing or mismatched pins fail closed without choosing a newer version.
- Registry preflight streams compressed archives into auto-cleaned scratch storage with a 64 MiB per-artifact cap; it rejects oversized responses before extraction or project preparation output.
- Registry extraction validates and stages the complete ZIP before changing a materialized package, rejects conflicting/special paths, and caps uncompressed output at 512 MiB per entry and 1 GiB total; failures preserve the prior package and lock.
- Registry ZIP preflight rejects more than 10,000 entries, names longer than 4,096 UTF-8 bytes, paths deeper than 256 components, or cumulative retained prefix-key bytes above 64 MiB. It rejects Unicode-normalized full-case-fold aliases and non-portable Windows components before publication.
- Digest-derived registry roots are immutable: rename fully staged output only into an absent root; reuse an existing root only after full path/type/byte equivalence, otherwise fail closed without modifying it.
- `beskid lock` and `beskid update` may migrate v1 from the current manifest graph. Other consumers never silently migrate; `--locked` and `--frozen` write nothing.
- Preserve user changes and unrelated generated files. Do not run heavy builds on this Mac; use the NixOS builder for them, and use macOS only with at least 20 GiB free.

## Review Focus

1. A copied lock with the same dependency names but different manifests must not replay materialized roots (Task 5).
2. A symlink inside `obj/beskid/deps/src` escaping that directory must not grant source authority (Task 5).
3. A valid pinned registry version with changed ZIP bytes must fail before extraction, without falling back (Task 4).
4. A lock containing percent-encoded delimiter aliases or duplicate keys must be rejected rather than reinterpreted (Task 2).
5. A checkout whose local path dependency has an explicitly declared `../sibling` must survive moving both together, while a missing sibling fails (Task 3).

---

### Task 1: Make the v2 contract normative

**Files:**
- Modify: `openspec/specs/tooling--manifests-and-lockfiles--workspace-and-lock-contracts/spec.md`
- Modify: `openspec/specs/compiler--resolution-and-projects--workspace-and-lock-contracts/spec.md`
- Modify: `openspec/catalog.json` only if the validator requires regeneration

**Interfaces:** Produces normative SHALL scenarios for schema, relocation, Corelib anchor, registry pins, explicit migration, strict modes, and replay containment. Compiler behavior in Tasks 2–6 must satisfy them.

- [ ] **Step 1: Write tooling SHALL requirements and GIVEN/WHEN/THEN scenarios.** Cover the exact v2 header/fields/encoding, relative anchors, explicit v1 migration, and read-only strict policy. Leave historical v1 text in informative provenance, but state that it is not the current accepted format.
- [ ] **Step 2: Write compiler SHALL scenarios.** Cover verified Corelib identity, graph-checked replay, stable materialization, digest-before-extract, and failure on missing/mismatched pinned artifacts.
- [ ] **Step 3: Validate.** Run `pnpm exec openspec validate --strict --no-interactive` for both edited capabilities, then `bun run openspec:validate` from the root worktree; expect both capabilities and the catalog validation to pass.
- [ ] **Step 4: Commit only the spec/catalog files** on the isolated root release branch.

### Task 2: Strict v2 codec and path model

**Files:**
- Modify: `compiler/crates/beskid_analysis/src/projects/workflow/lockfile.rs`
- Create: `compiler/crates/beskid_analysis/src/projects/workflow/lockfile/portable_path.rs`
- Modify: `compiler/crates/beskid_tests_projects/src/projects/lockfile.rs`

**Interfaces:** `ProjectLockDependencyEntry` gains `source: ProjectLockSource` (`Path`, `Corelib`, `Registry`); `ProjectLockfileV2::parse_v2(&str) -> Result<Self, ProjectError>` and `to_v2_content(&self) -> String` are the sole codec. `PortableLockPath::parse(field, value, base_kind) -> Result<Self, ProjectError>` stores normalized `/` paths; callers get a checked `resolve(base: &Path) -> Result<PathBuf, ProjectError>`. Preserve the v1 parser only for version detection and explicit migration diagnostics.

- [ ] **Step 1: Add failing codec tests.** Assert deterministic sorted round-trip, exact header, canonical `%HH`, lowercase-escape/delimiter/duplicate/unknown-field rejection, registry digest shape, and Windows drive/UNC/absolute/traversal rejection. Run `cargo test -p beskid_tests_projects --lib projects::lockfile -- --nocapture` on the builder; expect red tests.
- [ ] **Step 2: Implement the v2 codec and portable-path type.** Keep validation at parse boundaries, not in callers; reject duplicate destinations as part of full-lock parsing.
- [ ] **Step 3: Run the same focused test command; expect green.** Commit codec and tests on the compiler branch.

### Task 3: Relocatable path/Corelib entries and stable materialization

**Files:**
- Modify: `compiler/crates/beskid_analysis/src/projects/workflow/prepare.rs`
- Modify: `compiler/crates/beskid_analysis/src/projects/workflow/filesystem.rs`
- Modify: `compiler/crates/beskid_analysis/src/projects/graph/resolver.rs`
- Modify: `compiler/crates/beskid_tests_projects/src/projects/compile_plan/workspace.rs`

**Interfaces:** `portable_entry_for_dependency(plan: &CompilePlan, dependency: &ResolvedDependencyProject, verified_corelib_root: Option<&Path>) -> Result<ProjectLockDependencyEntry, ProjectError>` derives source kind from the resolved graph, not text in the lock. `materialized_dependency_id(name: &str, source: ProjectLockSource, portable_identity: &str) -> String` hashes length-delimited UTF-8 components with SHA-256 and returns a 128-bit lowercase suffix. `ResolvedDependencyProject` is the existing type in `model.rs`.

- [ ] **Step 1: Add failing workspace tests.** Generate locks for path and implicit Corelib dependencies, move the whole fixture tree, rematerialize with another verified Corelib location, and assert byte-identical lock plus materialized names. Add `../sibling` preserved-layout success and missing-sibling failure.
- [ ] **Step 2: Run `cargo test -p beskid_tests_projects --lib projects::compile_plan::workspace -- --nocapture` on the builder; expect red.**
- [ ] **Step 3: Replace absolute entry values and `DefaultHasher` with the interfaces above.** Derive a `corelib` entry only from canonical verified Corelib resolution; reject duplicate materialized destinations before copies.
- [ ] **Step 4: Run the focused workspace tests; expect green.** Commit the path/Corelib materialization slice.

### Task 4: Registry lock-first resolution and SHA-256 pinning

**Files:**
- Modify: `compiler/crates/beskid_analysis/src/projects/workflow/registry.rs`
- Modify: `compiler/crates/beskid_analysis/src/projects/workflow/prepare.rs`
- Create: `compiler/crates/beskid_tests_projects/src/projects/registry_lock.rs`
- Modify: `compiler/crates/beskid_tests_projects/src/projects/mod.rs`

**Interfaces:** `materialize_registry_dependency(unresolved, deps_root, workspace_rules, pinned: Option<&ProjectLockDependencyEntry>, refresh: bool)` returns a v2 entry and materialized project or a typed validation error; with a pin, request exactly `resolved_version`, hash the downloaded bytes, compare `artifact_digest`, and only then extract. A refresh intentionally queries versions. Registry identity includes alias, package, selected version, and digest; `None` aliases normalize to a stable default identity.

- [ ] **Step 1: Add failing local HTTP-fixture tests.** A pinned version remains selected when a newer version exists; changed bytes yield digest mismatch before extraction; missing version fails rather than falling back; update selects the new version and writes its digest. Keep network entirely local to the test.
- [ ] **Step 2: Run `cargo test -p beskid_tests_projects --lib projects::registry_lock -- --nocapture` on the builder; expect red.**
- [ ] **Step 3: Implement lock-first selection and digest verification.** Stop swallowing network/format errors when a pin exists; validate registry alias against current workspace rules. Stream into auto-cleaned scratch storage with a 64 MiB compressed-archive cap, hash before extraction, and retain only scratch handles through graph-wide destination preflight.
- [ ] **Step 4: Run focused registry tests; expect green.** Commit registry slice.

### Task 5: Strict migration policy and safe LSP replay

**Files:**
- Modify: `compiler/crates/beskid_analysis/src/projects/workflow/lockfile.rs`
- Modify: `compiler/crates/beskid_analysis/src/projects/workflow/prepare.rs`
- Modify: `compiler/crates/beskid_analysis/src/projects/assembly/roots.rs`
- Modify: `compiler/crates/beskid_analysis/src/projects/assembly/loader/tests.rs`
- Modify: `compiler/crates/beskid_analysis/src/services/project.rs`
- Modify: `compiler/crates/beskid_tools/src/pipeline/resolve_options.rs`
- Modify: `compiler/crates/beskid_tools/src/pipeline/frontend.rs`
- Modify: `compiler/crates/beskid_lsp/src/commands/project_explorer/graph.rs`
- Modify: `compiler/crates/beskid_cli/src/commands/lock.rs`
- Modify: `compiler/crates/beskid_cli/src/commands/update.rs`
- Modify: `compiler/crates/beskid_tests_projects/src/projects/compile_plan/workspace.rs`

**Interfaces:** Add `WorkspacePrepareOptions { frozen, locked, refresh_lock }` and `CliResolveOptions::with_lock_refresh(self) -> Self`; only CLI lock/update call the builder. Keep the current `services::resolve_project_with_policy` as a non-refresh wrapper and add `resolve_project_with_policy_and_refresh(..., refresh_lock: bool)` for the CLI frontend. `load_project_lock_dependencies_for_plan(lock_path, plan)` accepts only validated v2 and compares full resolved graph identity. `effective_roots_from_lockfile` returns current roots when a replay hint is absent or invalid. Explorer renders resolved current paths, never raw lock tokens.

- [ ] **Step 1: Add failing command/analysis tests.** Assert v1 fails on normal build/run/test with actionable migration text, `--locked`/`--frozen` leave v1 bytes unchanged, CLI lock/update migrate from current manifests, stale v2 fails without write, missing unlocked lock creates v2, and missing strict lock fails.
- [ ] **Step 2: Add failing replay tests.** Cover copied same-name lock, swapped manifest, missing materialized dir, outside-root path, symlink escape, forged Corelib source, and duplicate destination; assert fallback to the current graph with no service authority.
- [ ] **Step 3: Run focused `beskid_tests_projects` and `beskid_analysis` replay tests on the builder; expect red.** Use test names added in Steps 1–2, not a whole workspace run.
- [ ] **Step 4: Implement refresh-only migration, full graph comparison, containment, and explorer resolution.** Validate before creating `obj` or writing a lock in strict/rejected cases; never use v1 absolute paths as migration inputs.
- [ ] **Step 5: Run the focused tests; expect green.** Commit migration/replay slice.

### Task 6: Migrate tracked fixtures and prove release behavior

**Files:**
- Modify: tracked `compiler/**/Project.lock` and `compiler/corelib/**/Project.lock` fixtures that currently contain absolute v1 paths
- Modify: `compiler/crates/beskid_tests_projects/src/projects/compile_plan/workspace.rs` if end-to-end assertions need a dedicated fixture
- Modify: `docs/superpowers/reports/2026-09-27-v05-candidate-readiness.md`

**Interfaces:** Generated v2 locks are byte-for-byte stable across checkout location and platform. No fixture asserts machine-local absolute paths. Release reports bind exact compiler/Corelib/root commits and tested artifact hashes.

- [ ] **Step 1: Add a failing CLI integration assertion** that `beskid lock` on a copied fixture produces the same v2 bytes in two temporary roots, then `build --locked`, `run --locked`, and `test --locked` use that lock without mutation.
- [ ] **Step 2: Run the focused integration target on the builder; expect red, then migrate fixture locks with `beskid lock` on the intended projects and rerun to green.** Inspect `git diff` for only v2 locks and fixtures; do not bulk-clean unrelated generated user files.
- [ ] **Step 3: Verify exact-source Linux gates.** Run `cargo test --workspace --locked` with the established diagnostics scripts on the NixOS builder (at most four heavy jobs), then Corelib 81/81 and runtime 7/7 from a fresh verified kit. Record actual exceptions separately; do not label release eligible on partial evidence.
- [ ] **Step 4: Verify macOS and Windows on the same source pins.** Require at least 20 GiB macOS free; use `nice -n 19` and `-j 2`. Run locked CLI/Corelib/runtime matrix and path/lock tests on macOS and key-only Windows VM; compare fixture lock bytes and `git status` after tests.
- [ ] **Step 5: Run strict OpenSpec validation, `git diff --check`, and a fresh review.** Update the readiness report with commands, source hashes, logs, failures, and any owner waiver; commit only verified fixture/report changes. Update the superrepo compiler/Corelib gitlinks only after their isolated branches are reviewed.

## Integration order

Task 1 must precede behavior changes. Tasks 2–5 share the codec/resolver interface and should land serially with focused review after each commit. Task 6 is the exact-source release gate, not evidence that earlier tests alone completed the v0.5 release. No merge, push, or publication occurs merely because this plan passes.
