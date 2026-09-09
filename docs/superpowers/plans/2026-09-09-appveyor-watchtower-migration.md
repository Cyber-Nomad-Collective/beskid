# AppVeyor CI Migration Implementation Plan

> Execute this plan in the current repository. Keep one canonical build path in
> `scripts/ci`, preserve GitHub only for native publication/security concerns,
> and do not push or configure account secrets without explicit credentials.

**Goal:** Replace GitHub-hosted validation and platform delivery with AppVeyor
validation plus publication to `cr.beskid-lang.org`, leaving deployment solely
to Watchtower.

**Architecture:** A root AppVeyor matrix dispatches to OS-aware shell entrypoints.
The Linux platform entrypoint owns the complete fail-closed validation and image
publish sequence. GitHub-native publishing workflows remain manually dispatched.

**Tech stack:** AppVeyor YAML, Bash, PowerShell, Docker/Buildx, Rust, Node 24,
Corepack/pnpm, OpenSpec, shell contract tests.

### Task 1: Encode the migration contract

**Files:**
- Create: `scripts/ci/test/appveyor-migration-contract.test.sh`
- Modify: `scripts/ci/test/run-cicd-foundation-tests.sh`

1. Assert a root AppVeyor matrix with Linux platform/compiler, macOS compiler,
   and Windows compiler lanes.
2. Assert PR publication is denied and platform images use only
   `cr.beskid-lang.org`.
3. Assert retired GitHub workflows are absent and retained workflows do not
   depend on them.
4. Run the test before implementation and record the expected failure.

### Task 2: Add AppVeyor orchestration and canonical entrypoints

**Files:**
- Create: `appveyor.yml`
- Create: `scripts/ci/appveyor-install.sh`
- Create: `scripts/ci/appveyor-entrypoint.sh`
- Create: `scripts/ci/appveyor-entrypoint.ps1`
- Create: `scripts/ci/appveyor-platform-publish.sh`

1. Define the native worker matrix without allowed failures.
2. Initialize only each lane's required pinned submodules.
3. Install Node/Corepack/pnpm and Rust/native tools in repository scripts.
4. Route each lane to existing compiler, Corelib, OpenSpec, site, Tracker, and
   integration gates.
5. Build all five platform images, then push immutable and `production` tags
   only for a trusted AppVeyor main push.
6. Rehearse Corelib/template publication on validation builds and publish from
   trusted main only after image publication, using the AppVeyor-owned pckg key.
7. Keep deployment disabled and log out of the registry during finalization.

### Task 3: Remove superseded GitHub CI/CD

**Files:**
- Delete: `.github/workflows/compiler-gate-testbox.yml`
- Delete: `.github/workflows/compiler.yml`
- Delete: `.github/workflows/corelib.yml`
- Delete: `.github/workflows/platform-delivery.yml`
- Delete: `.github/workflows/tracker-platform-delivery.yml`
- Delete: `.github/workflows/reusable-image.yml`
- Delete: `.github/workflows/reusable-promote.yml`
- Delete: `.github/workflows/reusable-quality.yml`
- Delete: `.github/workflows/reusable-release-manifest.yml`
- Modify: `.github/workflows/compiler-release.yml`
- Modify: CI workflow contract tests as required

1. Remove validation and platform delivery from GitHub.
2. Make compiler release explicitly dispatched; remove the deleted Compiler
   workflow coupling and Blacksmith runner dependency.
3. Retain only GitHub-native publishing/release workflows and cleanup support.
4. Update or remove provider-specific contract tests so the foundation suite
   verifies the new single path.

### Task 4: Update the normative and operator contracts

**Files:**
- Modify: `openspec/specs/staged-delivery-observability/spec.md`
- Modify: `openspec/config.yaml`
- Regenerate: `openspec/catalog.json`
- Modify: `GLOSSARY.md`
- Modify: `GUIDE.md` and relevant operator docs
- Add: `site/website/src/content/docs/blog/tooling-04-appveyor-watchtower-boundary.md`
- Modify: `CHANGELOG.md`

1. Define provider-neutral validation plus the explicit AppVeyor publish and
   Watchtower deploy authorities.
2. Remove normative requirements for CI-controlled staging/production rollout.
3. Document activation checks, required secure variable names, manual release
   boundary, rollback, and production observation.
4. Publish the candid migration announcement after its website build passes.

### Task 5: Verify and commit

1. Run the focused migration contract and complete CI foundation suite.
2. Validate AppVeyor YAML syntax structurally and shell/PowerShell syntax where
   local tooling permits.
3. Run OpenSpec validation/catalog checks and the website blog/build tests.
4. Render production Compose and verify Watchtower registry references.
5. Run GitNexus change detection against `main`, a credential-shape scan,
   `git diff --check`, and the repository agent-artifact/changelog hooks.
6. Review all dirty files, exclude linked worktree directories, and commit the
   complete migration to root `main` as authorized.
