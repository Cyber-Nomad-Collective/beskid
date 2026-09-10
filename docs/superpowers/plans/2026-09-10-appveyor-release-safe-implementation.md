# AppVeyor Release-Safe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AppVeyor the release-safe validation and publication authority for compiler, CLI/runtime-kit, platform images, and packages while Watchtower remains the only production reconciler.

**Architecture:** Three native compiler/CLI jobs form an AppVeyor validation group. The Linux platform job fans in after that group, completes the remaining platform gates, pushes immutable image tags, publishes packages, then advances Watchtower-visible `production` tags and retains a digest manifest. One shared event-policy function authorizes every mutation and denies PRs, tags, manual/API builds, schedules, rebuilds, and incomplete reruns.

**Tech Stack:** AppVeyor YAML, Bash, PowerShell, Docker Buildx, pnpm, Rust/Cargo, shell contract tests.

**Spec:** `docs/superpowers/specs/2026-09-09-appveyor-watchtower-migration-design.md`; current provider-fit corrections are in `docs/research/2026-09-10-appveyor-deployment-model-fit.md`.

## Global Constraints

- AppVeyor validates compiler, CLI/LSP, runtime kits, OpenSpec, shared UI, integration, security, and package rehearsal.
- Only a new trusted webhook push to `main` may mutate either registry.
- `cr.beskid-lang.org/beskid/{site,learn,tracker,nexus,pckg}` is the only platform-image namespace.
- CI never invokes Compose, Coolify, Watchtower, or the production host.
- Watchtower observes only the five mutable `production` tags; immutable `sha-<full-commit>` tags remain the audit and rollback identities.
- Package publication must succeed before any `production` tag advances.
- No failing native job is optional, and no replay operation can roll production backward.
- Tests exercise script behavior with controlled fake commands; they do not merely assert source text where observable behavior is available.

---

### Task 1: Deny every non-push and replay mutation event

**Files:**
- Create: `scripts/ci/test/appveyor-event-policy.test.sh`
- Modify: `scripts/ci/lib/appveyor-event-policy.sh`
- Modify: `scripts/ci/test/run-cicd-foundation-tests.sh`

**Interfaces:**
- Consumes: AppVeyor's documented `APPVEYOR_*` event variables.
- Produces: `appveyor_is_trusted_main_push`, returning success only for a fresh, non-PR, non-tag webhook push to `main`.

- [ ] **Step 1: Write the failing behavioral test**

  Source the real policy and use a table of literal environments. Assert that exactly the clean `main` push returns success; feature branches, PRs, tags, forced/API builds, schedules, rebuilds, and incomplete reruns return failure. Name each scenario in failure output.

- [ ] **Step 2: Run the test to verify it fails**

  Run `bash scripts/ci/test/appveyor-event-policy.test.sh` and confirm the rebuild or incomplete-rerun case is incorrectly authorized.

- [ ] **Step 3: Implement the minimum policy change**

  Extend the shared predicate with case-insensitive checks for `APPVEYOR_RE_BUILD` and `APPVEYOR_RE_RUN_INCOMPLETE`. Do not duplicate the predicate in either publisher.

- [ ] **Step 4: Register and verify the test**

  Add the test to `run-cicd-foundation-tests.sh`, then run the focused test and the AppVeyor migration contract.

### Task 2: Gate publication on native validation and order mutations safely

**Files:**
- Modify: `appveyor.yml`
- Modify: `scripts/ci/appveyor-entrypoint.sh`
- Modify: `scripts/ci/appveyor-platform-publish.sh`
- Create: `scripts/ci/appveyor-platform-promote.sh`
- Create: `scripts/ci/appveyor-image-manifest.sh`
- Modify: `scripts/ci/test/appveyor-migration-contract.test.sh`
- Modify: `scripts/ci/security-policy-gate.sh`

**Interfaces:**
- Consumes: successful `compiler-validation` job group; immutable images at `sha-${APPVEYOR_REPO_COMMIT}`; `REGISTRY_USERNAME`, `REGISTRY_PASSWORD`, and `BESKID_PCKG_API_KEY` only on trusted pushes.
- Produces: five immutable image tags, published corelib/templates, five advanced `production` tags, and `.appveyor-reports/platform-images.json` containing source/build/job identity and registry digests.

- [ ] **Step 1: Extend the contract test and observe RED**

  Make the test parse `appveyor.yml` and require named compiler jobs in one `compiler-validation` group plus a Linux platform job depending on that group. Exercise fake Docker commands to prove image build/publish never pushes `production`, package failure prevents promotion, promotion consumes existing immutable tags without rebuilding, and the manifest contains five literal image records with the source SHA. Run the focused contract and confirm it fails for the current independent matrix and push order.

- [ ] **Step 2: Express AppVeyor fan-in**

  Add `job_name` to every row, `job_group: compiler-validation` to Linux/macOS/Windows compiler rows, `job_depends_on: compiler-validation` to Linux platform, and `max_jobs: 3`. Keep `matrix.fast_finish: false`, `test: false`, and `deploy: false`.

- [ ] **Step 3: Separate immutable publication from mutable promotion**

  Change `appveyor-platform-publish.sh` to build all five images, push only their `sha-*` tags on a trusted push, and write digest evidence. Add `appveyor-platform-promote.sh` that authenticates independently, pulls each immutable tag, retags it as `production`, pushes it, and logs out through a trap. Both scripts must call the shared event predicate and fail closed without credentials.

- [ ] **Step 4: Put package publication before promotion**

  Make the Linux platform entrypoint run: gates, package rehearsal, immutable image publication, live package publication, mutable image promotion, manifest finalization. A non-zero package result must stop the shell before promotion.

- [ ] **Step 5: Retain AppVeyor evidence**

  Generate `.appveyor-reports/platform-images.json` with `APPVEYOR_BUILD_ID`, `APPVEYOR_BUILD_VERSION`, `APPVEYOR_JOB_ID`, full source SHA, registry namespace, and five digest-backed immutable image entries. Declare `.appveyor-reports/**` as an AppVeyor artifact for the Linux platform job. Do not treat AppVeyor artifacts as the durable image store.

- [ ] **Step 6: Verify the slice**

  Run the migration contract, security policy gate, ShellCheck, AppVeyor YAML parse, and the complete CI/CD foundation suite.

### Task 3: Align operator documentation and release evidence

**Files:**
- Modify: `.github/README.md`
- Modify: `GUIDE.md`
- Modify: `GLOSSARY.md`
- Modify: `beskid_sites/deploy/README.md`
- Modify: `docs/research/2026-09-10-appveyor-deployment-model-fit.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: the finalized Task 1 and Task 2 behavior.
- Produces: one documented authority model and an operator checklist that matches executable ordering.

- [ ] **Step 1: Audit documentation against executable behavior**

  Remove claims that the independent Linux job publishes directly after its own gates. Document compiler fan-in, immutable-first publication, package-before-promotion, digest evidence, replay denial, hosted 60-minute proof, and Watchtower's eventual-convergence limitation.

- [ ] **Step 2: Maintain glossary and changelog**

  Update the existing AppVeyor authority definition rather than adding a synonym. Record the release-safety change under `[Unreleased]` using Keep a Changelog categories.

- [ ] **Step 3: Run final verification**

  Run `bash scripts/ci/test/run-cicd-foundation-tests.sh`, OpenSpec catalog/validation, docs procedure/blog tests, production Watchtower contract, compose render, `actionlint`, `shellcheck`, PowerShell parse, `git diff --check`, secret-shape scan, and GitNexus `detect_changes(scope: "compare", base_ref: "main")` before any commit.
