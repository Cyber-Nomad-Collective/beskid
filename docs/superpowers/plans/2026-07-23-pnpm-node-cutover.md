# pnpm and Node Cutover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove active Bun usage from the superrepo, sites, Actions, containers, and checked-out web submodules while preserving every build, test, and runtime behavior.

**Architecture:** Node 22.12 executes applications and tooling; Corepack activates exact pnpm 10.17.1. The root owns its own sites workspace and lock; each git submodule owns its own workspace/lock and must commit before the root updates the gitlink. Runtime portability, especially SQLite, precedes container cutover.

**Tech Stack:** Node 22.12, Corepack, pnpm 10.17.1, BuildKit, GitHub Actions, existing Vite/Vitest stacks, selected Node SQLite adapter.

## Global Constraints

- No active Bun fallback, `bun.lock`, `oven/bun`, `bun:sqlite`, or `bun:test` remains after the cutover.
- Do not invent a cross-repository workspace or root-owned submodule lockfile.
- Pin Node and pnpm; do not install floating global pnpm.
- Retain BuildKit secret package authentication and named submodule contexts.
- Complete runtime SQLite compatibility before changing a deployable Docker runtime to Node.

---

### Task 1: Establish pnpm workspace contracts and lockfiles

**Files:**
- Create: `pnpm-workspace.yaml`, `pnpm-lock.yaml`
- Modify: `package.json`, `.npmrc`, `scripts/{setup-environment.sh,setup-npm-auth.sh,sync-beskid-packages.sh}`
- Delete: `bun.lock`, `site/auth/bun.lock`
- Modify in each own repository: `beskid_web_common`, `beskid_nexus`, `beskid_tracker`, `beskid_vscode`, `beskid_treesitter`, and `pckg` manifests/workspace files/locks

**Interfaces:**
- Produces a frozen-installable pnpm workspace per repository.

- [ ] **Step 1: Add lockfile contract tests before changing commands**

```bash
test -f pnpm-workspace.yaml
test -f pnpm-lock.yaml
! test -e bun.lock
corepack enable
test "$(pnpm --version)" = "10.17.1"
```

- [ ] **Step 2: Run contract test and verify it fails under the current Bun lock**

Run: `bash scripts/ci/test/<new-pnpm-contract>.test.sh`

- [ ] **Step 3: Create root workspace and regenerate with pinned Corepack pnpm**

Use an explicit `pnpm-workspace.yaml` for root-owned site members. Replace root scripts with `pnpm --dir`/`pnpm exec`; add `tsx` for Node OpenSpec TypeScript scripts. Convert auth only after its Node SQLite task completes.

- [ ] **Step 4: Convert each submodule in its repository and commit there**

Use an independent lock/workspace per repository. Preserve `file:` dependencies unless the owning repository legitimately contains both packages. Commit each migration on its own branch, verify frozen install, then update root gitlinks.

- [ ] **Step 5: Run frozen installs**

Run: `corepack enable && pnpm install --frozen-lockfile`, then equivalent commands at every submodule root.

- [ ] **Step 6: Commit root lock/workspace and gitlinks**

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml scripts beskid_*/ pckg
git commit -m "build: adopt pnpm workspaces"
```

### Task 2: Port deployable SQLite and test-runtime dependencies to Node

**Files:**
- Modify: `site/auth/src/server/db/{index.ts,schema.ts}` and tests
- Modify: `site/platform-spec/src/lib/storage/{db.ts,schema.ts,spec-store.ts}`, `site/platform-spec/scripts/seed.ts`, `site/platform-spec/package.json`
- Modify: `beskid_tracker/src/lib/{storage,tracker}/**`, `beskid_tracker/scripts/reconcile-delivery.ts`, `beskid_tracker/vite.config.ts`, tests
- Modify: `site/website/src/lib/tracker-delivery.test.ts`
- Modify: `beskid_vscode/test/**/*.test.ts` and its manifest

**Interfaces:**
- Produces an explicit adapter surface preserving synchronous prepared-statement/transaction semantics.

- [ ] **Step 1: Select and pin the Node SQLite adapter with an API compatibility test**

```ts
const db = openSqlite(":memory:");
db.exec("create table entries (id text primary key)");
db.prepare("insert into entries values (?)").run("one");
expect(db.prepare("select id from entries").get()).toEqual({ id: "one" });
```

- [ ] **Step 2: Run per-service tests and verify Bun imports fail under Node**

Run: `node --test <adapter-test>` or the selected Vitest invocation.

- [ ] **Step 3: Implement the adapter and migrate imports one service at a time**

Preserve migrations, transactions, busy-timeout behavior, and client-bundle exclusions. Replace Platform Spec's `bun build --target bun` seed bundle with a Node-targeted `tsx`/bundler output and execute seed with `node`.

- [ ] **Step 4: Convert Bun tests to existing test conventions**

Use Vitest where the package already has it; otherwise use `node:test`. Retain each assertion/mocking behavior instead of deleting tests.

- [ ] **Step 5: Verify each service before continuing**

Run each service's test, typecheck, production build, client-bundle scan, and seed/health test.

- [ ] **Step 6: Commit each submodule/runtime slice independently**

```bash
git -C beskid_tracker add . && git -C beskid_tracker commit -m "refactor: use Node SQLite"
```

### Task 3: Convert Actions and CI contracts to Corepack/pnpm

**Files:**
- Modify: `.github/actions/{setup-beskid-web,setup-compiler-gate,setup-compiler-submodule}/action.yml`
- Modify: `.github/workflows/{platform-delivery,reusable-quality,tracker-platform-delivery,publish-open-vsx,compiler,corelib,compiler-gate-testbox}.yml`
- Modify: `scripts/ci/{openspec-gate,conformance-gate,platform-integration-gate,platform-smoke,shared-ui-nexus-gate,site-build-gate,verify-frozen-lockfile,vscode-gate,lsp-command-contract-gate,open-vsx-publish}.sh`
- Modify: corresponding `scripts/ci/test/*.test.sh`

- [ ] **Step 1: Make the CI contract test fail for an Action that still invokes Bun**

```bash
! rg -n '\bbun\b|oven/bun' .github/actions .github/workflows scripts/ci
rg -Fq 'corepack enable' .github/actions/setup-beskid-web/action.yml
rg -Fq 'pnpm install --frozen-lockfile' .github/actions/setup-beskid-web/action.yml
```

- [ ] **Step 2: Convert setup actions and workflow cache keys**

Use `actions/setup-node` with Node 22.12, `corepack enable`, and pnpm stores keyed by each package's `pnpm-lock.yaml`. Preserve pinned third-party action SHAs.

- [ ] **Step 3: Convert scripts and assertions together**

Replace every `bun --cwd` with a workspace-local `pnpm --dir` invocation. Ensure path filters trigger on all workspace manifests/locks. Do not weaken contract tests.

- [ ] **Step 4: Run CI suites**

Run: `bash scripts/ci/test/run-cicd-foundation-tests.sh && bash scripts/ci/test/run-tracker-platform-delivery-tests.sh`

- [ ] **Step 5: Commit**

```bash
git add .github scripts
git commit -m "ci: run web gates with pnpm"
```

### Task 4: Convert builders and runtime containers

**Files:**
- Modify: `site/{website,platform-spec,auth}/Dockerfile`
- Modify: `beskid_{tracker,nexus}/Dockerfile`, `pckg/Dockerfile`, `beskid_web_common/packages/trudoc/Dockerfile`
- Modify: `scripts/ci/prepare-secure-dockerfile.sh` and Docker contract tests
- Modify: container documentation under `site/**/README.md` and `COOLIFY.md`

- [ ] **Step 1: Write Docker contract failures**

```bash
! rg -n 'oven/bun|bun install|bun run' site/**/Dockerfile beskid_*/Dockerfile pckg/Dockerfile
rg -n 'corepack enable|PNPM_HOME|pnpm install --frozen-lockfile' site/**/Dockerfile
```

- [ ] **Step 2: Convert a non-runtime website builder first**

Use Node 22.12 builder/runtime images, corepack pnpm, BuildKit cache mount for pnpm store, manifest/lock-first layer order, and secret-mounted token handling. Prove immutable production output before applying the pattern elsewhere.

- [ ] **Step 3: Convert Platform Spec, Auth, and Tracker after Task 2 passes**

Run their Node entrypoints and SQLite migrations in the built runtime image. Never copy `.npmrc` or token material into a runtime layer.

- [ ] **Step 4: Convert Nexus, pckg, and shared Trudoc with named contexts preserved**

Keep submodule and OpenSpec BuildKit contexts matching `platform-delivery.yml`.

- [ ] **Step 5: Build and smoke every image**

Run each existing image build command and service health check; run `verify:client-bundle` for client applications.

- [ ] **Step 6: Commit**

```bash
git add site beskid_tracker beskid_nexus pckg beskid_web_common scripts/ci
git commit -m "build: run containers on Node and pnpm"
```

### Task 5: Prove and document the cutoff

**Files:**
- Modify: `README.md`, `site/README.md`, `scripts/README.md`, `CHANGELOG.md`, `GLOSSARY.md`
- Test: new absence-check script under `scripts/ci/test/`

- [ ] **Step 1: Add an active-surface absence test**

```bash
if rg -n -i '\bbun(x)?\b|oven/bun|bun:sqlite|bun:test' \
  .github site beskid_tracker pckg beskid_nexus beskid_web_common beskid_vscode; then
  echo 'active Bun usage remains' >&2
  exit 1
fi
```

Exclude only archived historical evidence by explicit path, never by a broad glob.

- [ ] **Step 2: Run all validation**

Run: `pnpm run openspec:catalog && pnpm run openspec:validate && bash scripts/ci/test/run-cicd-foundation-tests.sh && git diff --check`

- [ ] **Step 3: Update operational documentation and changelog**

- [ ] **Step 4: Run GitNexus `detect_changes()` and commit**

```bash
git add README.md site scripts CHANGELOG.md GLOSSARY.md
git commit -m "docs: record pnpm and Node cutover"
```
