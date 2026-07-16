# v0.4 Release Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every repository-controlled v0.4 release blocker and produce precise evidence for the remaining operator-controlled production checks.

**Architecture:** Three isolated worktrees divide responsibility between compiler/corelib correctness, artifact-delivery correctness, and release governance. Each workstream adds a regression test before code changes, retains existing public contracts, and commits independently for controlled integration.

**Tech Stack:** Rust/Cargo/Just, Beskid corelib, Bun/TypeScript/Vite/Astro, GitHub Actions/Shell, OpenSpec and Tracker JSON.

## Global Constraints

- `openspec/` is the sole normative behavior authority; observable behavior changes require an OpenSpec delta.
- Do not expose credentials, tokens, or production secret values.
- Use PascalCase public types/functions/methods and camelCase locals/parameters.
- Run an upstream impact check before modifying an existing symbol and report a HIGH or CRITICAL result before editing.
- Follow red-green-refactor for Rust and TypeScript behavior changes.
- Preserve user changes and existing submodule work; each worker edits only its assigned worktree scope.
- Every commit runs focused verification and a changed-scope audit.

---

### Task 1: Restore corelib release gate

**Files:**
- Modify: `compiler/` sources and tests only, as identified by the failing Corelib gate.
- Test: the focused compiler/corelib regression tests plus `just corelib` or the workflow-equivalent `scripts/ci/corelib-gate.sh`.

**Consumes:** Current CI symptoms: missing expression type information in terminal/text parsing targets, generic type diagnostics, then an all-targets segmentation fault.

**Produces:** A compiler/corelib commit for which focused regressions and the all-targets path no longer fail for the diagnosed causes.

- [ ] Write focused regression tests reproducing each distinct failure before changing production code.
- [ ] Run each regression test and record the expected failure.
- [ ] Use GitNexus impact analysis, implement the smallest compiler/corelib correction, and rerun the focused tests.
- [ ] Run the matrix-equivalent gate and record every remaining failure separately from fixed failures.
- [ ] Commit the scoped work with its regression tests.

### Task 2: Restore build, package, and editor delivery gates

**Files:**
- Modify: `.github/workflows/`, `site/`, `beskid_nexus/`, `beskid_vscode/`, and `beskid_web_common/` only as required for the failing delivery contracts.
- Test: Docker/build workflow equivalents, package resolution tests, and Open VSX publication decision tests.

**Consumes:** Current CI symptoms: missing platform-spec lockfile build input, unresolved `trudoc/book`, unpublished/unresolvable `@beskid/ui-react/settings`, Windows `ExternImport` warning-as-error, and duplicate Open VSX artifact failures.

**Produces:** A delivery commit with deterministic build inputs and idempotent publication behavior.

- [ ] Add a failing focused test or workflow-contract assertion for each corrected failure mode.
- [ ] Verify the failure is real before changing production code.
- [ ] Use impact analysis, implement minimal contract fixes, and run focused builds/tests.
- [ ] Run the workflow-equivalent validation for affected images and extension targets.
- [ ] Commit the scoped work with its regression coverage.

### Task 3: Make release orchestration auditable and retry-safe

**Files:**
- Modify: `.github/workflows/distribute.yml`, release scripts/tests, `beskid_tracker/data/v0.4/`, `CHANGELOG.md`, and release documentation only.
- Test: distribution workflow/shell contract tests and OpenSpec/release-manifest validation.

**Consumes:** Current CI symptom: `DISTRIB_GH_PAT` is missing; current distribution stamps before platform fan-out completes.

**Produces:** A release-orchestration commit that fails before mutation on missing credentials, records completed publications safely, defines the remaining operator acceptance checklist, and keeps v0.4 tracker evidence current.

- [ ] Add failing contract tests that prove missing prerequisites do not mutate release markers and partial platform failure remains retryable.
- [ ] Run them to verify the current failure.
- [ ] Implement the smallest retry-safe state transition and documentation/Tracker evidence update.
- [ ] Run workflow/shell tests and release manifest validation.
- [ ] Commit the scoped work with its regression coverage.

## Integration gates

1. Merge/replay the three commits onto one release branch.
2. Run strict OpenSpec validation, focused affected tests, and the full local release-gate commands available in the checkout.
3. Trigger or inspect CI for Compiler, Corelib, Platform delivery, Open VSX, and Distribution.
4. Record only the operator blockers that cannot be completed locally: configured secrets, GitHub package ownership/permission, Open VSX publication ownership, and live Coolify/OAuth/webhook smoke evidence.
