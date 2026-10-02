# First-party JavaScript Woodpecker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move shared-package and Tree-sitter validation and GitHub Packages publication from their submodule GitHub workflows into source-bound root Woodpecker lanes.

**Architecture:** A token-free shell runner validates the exact root-pinned submodules with their locked package managers. A separate Node runner stages fixed package identities and versions, rewrites only staged local sibling dependencies to exact registry versions, packs immutable tarballs, records a source-bound checksum receipt under `/woodpecker-output`, and lets only protected final steps publish those prebuilt bytes.

**Tech Stack:** Woodpecker 3.18 workflow YAML, Bash, Node.js 22, pnpm 10.17.1, Bun 1.3.0, npm, GitHub Packages.

**Spec:** `/private/tmp/beskid-v051-firstparty-woodpecker-brief.md`

**Execution record (2026-10-02):** Tasks 1-4 are implemented on the isolated
Woodpecker migration branch. Focused fixtures, the complete root Woodpecker
fixture suite, and real NixOS shared-package and Tree-sitter validation passed.
The real Tree-sitter gate established that the official Bun-only Node fallback
cannot load the grammar and Debian Node 18 is too old for the native toolchain;
the workflow therefore uses pinned Node 22.16.0, checksum-pinned Bun 1.3.0,
lock-resolved `node-gyp@12.1.0`, explicit execution of only the pinned
Tree-sitter CLI and repository native lifecycle scripts, and a two-job native
build bound. No
publication, secret provisioning, push, merge, or service activation occurred.
The checked task steps record implementation and verification on this isolated
branch; they do not record parent acceptance, integration, or publication. A
fresh parent review remains required after the final scoped correction.

## Global Constraints

- Root Woodpecker is the only first-party CI/publish authority; remove only the owned common and Tree-sitter GitHub workflows.
- Use the exact root gitlinks for `beskid_web_common` and `beskid_treesitter`; do not rename packages or change their authored versions.
- Shared validation uses pnpm 10.17.1 and `pnpm-lock.yaml` with `--frozen-lockfile`; there is no Bun or non-frozen fallback.
- Tree-sitter validation uses Bun 1.3.0, `bun.lock`, native build tools, `tree-sitter generate`, and corpus tests without changing parser outputs.
- Validation, build, staging, and packing receive no publisher credential. Only each final manual `main` publish step may receive `github_packages_publish_token` as `NODE_AUTH_TOKEN`.
- Publication accepts only Woodpecker manual `main`, exact `Cyber-Nomad-Collective/beskid`, and `CI_COMMIT_SHA` equal to checked-out root `HEAD`.
- Every prepare, verify, and publish command requires a clean root worktree,
  including initialized non-selected submodules; Git-ignored dependency and
  build output remains outside the attested source inventory.
- Authored `file:`, `link:`, or `workspace:` sibling references remain unchanged; staged package metadata replaces resolvable sibling references with exact selected sibling versions and rejects every unresolved local reference.
- Publication uses only checksum-verified prebuilt tarballs and `npm publish --ignore-scripts`; duplicate versions, artifact tampering, missing credentials, and ambiguous registry transport failures fail closed while durable partial results remain.
- GitHub Packages write authority for both `@cyber-nomad-collective` and `@beskid` is an operator prerequisite, never inferred or provisioned by this change.
- Do not publish, push, merge, provision secrets, change external services, or run heavy macOS builds.

## Review Focus

- A package manifest containing a local dependency on a package outside the fixed lane set must fail before any tarball is accepted.
- A symlink anywhere in selected package source or any symlink/special file in prepared output must fail rather than be traversed.
- A registry read that fails for a reason other than an explicit missing-version response must block all publication.
- A duplicate package version appearing between preflight and its upload must block that upload and preserve already recorded results.
- Secret values must never occur in subprocess arguments, captured diagnostics, receipts, checksums, or publication results.

---

### Task 1: Token-free validation runner

**Files:**
- Create: `scripts/ci/woodpecker-javascript.sh`
- Create: `scripts/ci/test/woodpecker-javascript.test.sh`

**Interfaces:**
- Consumes: exact initialized root gitlinks and the checked-in pnpm/Bun lockfiles.
- Produces: `woodpecker-javascript.sh shared` and `woodpecker-javascript.sh treesitter`, both credential-rejecting and fail-fast.

- [x] **Step 1: Write shell fixtures with fake pnpm and Bun executables**

Cover the exact successful command sequences plus wrong package-manager versions, missing lockfiles, install failure, build failure, leaked credential environment, and generated parser drift.

- [x] **Step 2: Run the focused fixture and verify RED**

Run: `nice -n 19 bash scripts/ci/test/woodpecker-javascript.test.sh`

Expected: FAIL because `scripts/ci/woodpecker-javascript.sh` does not exist.

- [x] **Step 3: Implement the minimal validation runner**

Use pnpm `--dir beskid_web_common install --frozen-lockfile`, then the current `typecheck`, `test`, and `build` scripts. Use Bun 1.3.0 with `install --frozen-lockfile`, `bunx tree-sitter generate`, `bunx tree-sitter test`, then reject tracked generated-output drift.

- [x] **Step 4: Run the focused fixture and verify GREEN**

Run: `nice -n 19 bash scripts/ci/test/woodpecker-javascript.test.sh`

Expected: PASS with all fake package-manager scenarios offline.

- [x] **Step 5: Retain the verified change for the final gated commit**

The owner requires the complete root fixture suite before any commit, so do not
commit this task independently.

### Task 2: Prebuilt package preparation and publication

**Files:**
- Create: `scripts/ci/prebuilt-javascript-publish.mjs`
- Create: `scripts/ci/test/prebuilt-javascript-publish.test.mjs`

**Interfaces:**
- Consumes: a lane name (`shared` or `treesitter`), a new durable snapshot directory, the exact root checkout context, and fixed package manifests from the pinned submodule.
- Produces: `prepare`, `verify`, and `publish` commands; immutable `artifacts/*.tgz`, `package-receipt.json`, `SHA256SUMS`, and append-safe `publish-results.json`.

- [x] **Step 1: Write Node fixtures around synthetic gitlinks and a fake npm**

Cover positive preparation/publication; staged exact sibling versions; stable/fixed identity enforcement; unresolved local dependency; symlink rejection; npm pack failure; artifact/receipt tamper; wrong manual/repository/SHA context; credential present during preparation; missing credential during publication; duplicate version; registry-read transport failure; upload failure with honest partial results; exact `npm publish ... --ignore-scripts` arguments; and absence of the secret from argv, logs, and artifacts.

- [x] **Step 2: Run the focused fixture and verify RED**

Run: `nice -n 19 node --test scripts/ci/test/prebuilt-javascript-publish.test.mjs`

Expected: FAIL because `scripts/ci/prebuilt-javascript-publish.mjs` does not exist.

- [x] **Step 3: Implement the fixed lane manifest and safe preparation commands**

The shared lane contains exactly `@cyber-nomad-collective/trudoc@0.2.7`, `@cyber-nomad-collective/beskid-ui@0.2.8`, `@cyber-nomad-collective/beskid-ui-react@0.2.9`, `@beskid/auth-client@0.2.9`, and `@cyber-nomad-collective/beskid-server-observability@0.2.0`. The Tree-sitter lane contains exactly `@cyber-nomad-collective/beskid-tree-sitter@0.1.3`.

- [x] **Step 4: Implement verification and credentialed prebuilt publication**

Preflight every version as absent, recheck immediately before each upload, invoke npm with a restricted environment and no secret argument, suppress potentially sensitive npm diagnostics, verify the version after upload, and durably rewrite partial result evidence after every package attempt.

- [x] **Step 5: Run the focused fixture and verify GREEN**

Run: `nice -n 19 node --test scripts/ci/test/prebuilt-javascript-publish.test.mjs`

Expected: PASS with no network access.

- [x] **Step 6: Retain the verified change for the final gated commit**

Do not commit until Task 4 has run the complete root fixture suite.

### Task 3: Root workflow ownership and submodule cleanup

**Files:**
- Create: `.woodpecker/javascript.yml`
- Create: `scripts/ci/test/woodpecker-javascript-workflow.test.sh`
- Modify: `scripts/ci/test/run-woodpecker-tests.sh`
- Modify: `scripts/ci/test/woodpecker-workflow-contract.test.sh`
- Delete: `beskid_web_common/.github/workflows/ci.yml`
- Delete: `beskid_web_common/.github/workflows/publish.yml`
- Delete: `beskid_web_common/scripts/test-publish-package-list.sh`
- Modify: `beskid_web_common/CHANGELOG.md`
- Delete: `beskid_treesitter/.github/workflows/publish.yml`
- Modify: `beskid_treesitter/CHANGELOG.md`

**Interfaces:**
- Consumes: Task 1 validation commands and Task 2 prepare/verify/publish commands.
- Produces: ordinary `shared-packages` and `treesitter` steps plus protected `shared-packages-publish` and `treesitter-publish` prepare/final pairs in the single root workflow.

- [x] **Step 1: Write the root workflow contract fixture**

Assert exact images/tool versions, frozen installs, native tools, durable snapshot paths, task selectors, manual/main root guard, the sole final-step secret bindings, no authored version input, no fallback install, no credential in preparation, and absence of the replaced submodule workflows.

- [x] **Step 2: Run the focused fixture and verify RED**

Run: `nice -n 19 bash scripts/ci/test/woodpecker-javascript-workflow.test.sh`

Expected: FAIL because `.woodpecker/javascript.yml` is absent and submodule workflows still exist.

- [x] **Step 3: Remove the submodule workflows**

Work on `codex/v051-woodpecker-only` in each initialized submodule, update its changelog, and retain no compatibility workflow or obsolete workflow-list test. Defer both submodule commits until Task 4's complete fixture gate passes.

- [x] **Step 4: Add the root workflow and fixture-suite wiring**

Normal push/pull-request lanes receive no secret. Manual publish preparation repeats validation and packs into `/woodpecker-output/javascript-<pipeline>-<commit>/<lane>` without credentials. Only the corresponding final step receives `github_packages_publish_token` as `NODE_AUTH_TOKEN`.

- [x] **Step 5: Run the focused fixture and verify GREEN**

Run: `nice -n 19 bash scripts/ci/test/woodpecker-javascript-workflow.test.sh`

Expected: PASS.

- [x] **Step 6: Retain the verified root workflow and gitlink changes**

Do not commit until Task 4 has run the complete root fixture suite.

### Task 4: Operator documentation, changelog, and complete fixture gate

**Files:**
- Modify: `docs/operations/woodpecker.md`
- Modify: `docs/operations/woodpecker-migration-ledger.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/superpowers/plans/2026-10-02-firstparty-woodpecker.md`

**Interfaces:**
- Consumes: the final task selectors, durable artifact names, secret name, and failure semantics from Tasks 1-3.
- Produces: an operator procedure that states the real unprovisioned credentials/grants and never claims publication was run or permission was verified.

- [x] **Step 1: Document the two manual publisher commands and human prerequisite**

State that `github_packages_publish_token` must be provisioned by a repository administrator with actual package write grants for both scopes, and that the present work neither creates nor verifies those grants.

- [x] **Step 2: Update the migration ledger and all three changelogs**

Record Woodpecker ownership, token-free preparation, prebuilt publication, and removal of the superseded GitHub workflows under Unreleased.

- [x] **Step 3: Run all focused fixtures**

Run: `nice -n 19 bash scripts/ci/test/woodpecker-javascript.test.sh && nice -n 19 node --test scripts/ci/test/prebuilt-javascript-publish.test.mjs && nice -n 19 bash scripts/ci/test/woodpecker-javascript-workflow.test.sh`

Expected: PASS.

- [x] **Step 4: Run the complete root Woodpecker fixture suite once**

Run: `nice -n 19 bash scripts/ci/test/run-woodpecker-tests.sh`

Expected: PASS; no real registry, publisher, heavy compiler, or macOS build is invoked.

- [x] **Step 5: Audit changes and commit the isolated repositories**

Run: `git diff --check && git status --short && git -C beskid_web_common status --short && git -C beskid_treesitter status --short`

Expected: no whitespace errors and only planned files differ. Then commit common
and Tree-sitter on their isolated branches, stage the resulting exact gitlinks,
and commit the root change only after the successful complete suite.

```bash
git -C beskid_web_common add -A && git -C beskid_web_common commit -m "ci: remove superseded GitHub workflows"
git -C beskid_treesitter add -A && git -C beskid_treesitter commit -m "ci: remove superseded GitHub publisher"
git add .woodpecker CHANGELOG.md docs scripts/ci beskid_web_common beskid_treesitter
git commit -m "ci: move JavaScript packages to Woodpecker"
```
