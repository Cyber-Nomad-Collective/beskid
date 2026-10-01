# Beskid 0.5.1 Template Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generated project paths, overwrite choices, and v2 lockfile ownership agree without manual repair.

**Architecture:** Substitute and validate output path components while building write plans, before filesystem mutation. Pass an affirmative overwrite decision through the existing instantiate request as effective force; preserve ordinary conflict behavior on decline or non-TTY. Keep lock generation after final filenames exist.

**Tech Stack:** Rust (`beskid_template`, `beskid_cli`), Beskid project manifests and lockfiles, Linux CLI smoke.

**Spec:** `docs/superpowers/specs/2026-10-01-beskid-051-cli-interaction.md`

## Global Constraints

- Base compiler work on `origin/main` at or after `44a07aed`, not the stale root checkout `887669f5`.
- No GitNexus, push, merge, publication, user-project deletion, or credential access.
- Keep builds off the Mac; focused Linux jobs run on the NixOS builder, at most four heavy jobs total.
- Preserve v2 lockfile strict owner checks; do not weaken them to accept a wrong manifest.

## Review Focus

- A token in a nested filename is substituted, not only the destination prefix.
- A missing symbol in a filename fails before any output is written.
- Two source paths becoming the same output after substitution fail before writes.
- An affirmative overwrite updates planned files and lockfile; a decline/non-TTY conflict leaves existing files unchanged.
- Path substitution cannot escape the chosen output root with `..`, absolute paths, or symlink redirection.

---

### Task 1: Filename substitution and preflight

**Files:**
- Modify: `compiler/crates/beskid_template/src/sources.rs`
- Modify: `compiler/crates/beskid_template/src/substitute.rs` only if a focused reusable path helper is needed
- Test: focused `beskid_template` unit/integration tests adjacent to the changed code

**Interfaces:**
- Consumes: `plan_source_writes(..., values, ...)` and existing `SourceWritePlan`.
- Produces: write plans whose `relative_output` is the fully substituted, validated filename relative to `output_root`.

- [ ] **Step 1: Write failing tests** for `content/{{name}}.bproj` → `MyApp.bproj`, nested workspace-name paths, unresolved tokens, post-substitution collisions, and traversal/absolute output rejection. Assert planned paths and absence of writes on error.
- [ ] **Step 2: Run the focused tests on Linux and capture RED**: each added case fails for the expected path behavior, not setup failure.
- [ ] **Step 3: Substitute every relative source path component** in `plan_source_writes`, then normalize and validate the final relative path. Apply the same validation to rename and target paths; preflight collisions before `apply_write_plans`.
- [ ] **Step 4: Rerun focused and crate suites on Linux, then commit this task** on its isolated compiler branch.

### Task 2: Confirmed overwrite authority

**Files:**
- Modify: `compiler/crates/beskid_template/src/service.rs`
- Modify: `compiler/crates/beskid_template/src/instantiate.rs` only if the existing `force` flow needs separation
- Test: focused `beskid_template` tests and a PTY CLI integration smoke

**Interfaces:**
- Consumes: `InstantiateTemplateRequest.force`, `confirm_overwrite`, and `InstantiateOptions.force`.
- Produces: one effective overwrite decision that is forwarded through instantiation.

- [ ] **Step 1: Add a failing test** proving an affirmative overwrite allows regeneration in a non-empty output while decline and non-interactive mode preserve existing bytes. Capture RED on Linux.
- [ ] **Step 2: Make confirmation set effective force** for the existing instantiation/write-plan path. Do not silently overwrite paths not in the plan.
- [ ] **Step 3: Run focused and crate suites; verify a real PTY `beskid new` y/n sequence** in isolated scratch, including resulting manifest filename and v2 lock owner; then commit.

### Task 3: Released-template integration gate

**Files:**
- Test: add or extend `compiler/crates/beskid_tests_projects/src/projects/templates/` integration coverage
- Test: release/CI template smoke script under `scripts/ci/` if existing CI lacks an equivalent

**Interfaces:**
- Consumes: first-party template archive/source and the CLI built from the candidate compiler.
- Produces: a release gate that fails on filename tokens, lock owner mismatch, or missing Corelib closure.

- [ ] **Step 1: Add a failing non-default-name console/workspace fixture test** that instantiates, checks exact `.bproj`/`.bws` paths, locks, and replays `--locked` after relocation.
- [ ] **Step 2: Observe RED against baseline, then GREEN with Tasks 1–2** on Linux.
- [ ] **Step 3: Run full relevant compiler/project suites, record exact counts, and commit** the integration gate.
