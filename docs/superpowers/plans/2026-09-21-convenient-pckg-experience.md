# Convenient pckg Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `beskid_sites/apps/pckg` the only pckg web application, reach or exceed the current `pckg/web` experience, and finish the migration by deleting every superseded web implementation and publication path.

**Architecture:** One pckg product is split across two non-overlapping modules: `beskid_pckg_server` is the sole registry/backend implementation, and `beskid_sites/apps/pckg` is the sole web implementation. The TanStack Start application is a same-origin presentation layer: public package and documentation routes call public Rust endpoints, authenticated dashboard routes consume identity supplied by the trusted forward-auth boundary, and publication remains owned by the `beskid pckg` CLI plus API keys. `pckg/web` is read-only migration evidence and must be deleted in the same program before the work is complete.

**Tech Stack:** Rust 2024, Axum, PostgreSQL, TanStack Start/Router/Query, React 19, TypeScript, Vite, Vitest, Testing Library, Playwright, pnpm 10, `@beskid/*` shared UI, Docker Compose, Caddy/Authentik forward-auth.

**Spec:** [`pckg/README.md`](../../../pckg/README.md) defines the runtime, identity, and publishing boundaries; [`compiler/crates/beskid_pckg_server/src/server/router.rs`](../../../compiler/crates/beskid_pckg_server/src/server/router.rs) is the executable HTTP contract. Historical UI source is recoverable from commit `fa54c08b452cdf82e3609e8537aa6c38039f2846`, but its retired .NET/Auth Hub assumptions are not requirements.

## Global Constraints

- Spell the product `pckg`; do not introduce `pkg`, `package hub`, or another alias.
- Keep one web implementation: all new pckg web work lands in `beskid_sites/apps/pckg`; `pckg/web` is frozen except for a critical fix required to keep the existing service operable during migration.
- Keep one runtime: `beskid_pckg_server` owns persistence, authorization, validation, artifacts, publication, reviews, and lifecycle operations.
- Do not copy business rules into the web app. Package visibility, ownership, verification, latest-version selection, yank state, artifact validation, and authorization come from the Rust contract.
- Copy proven pckg-specific code and tests before adapting them. Do not rewrite a working component, route behavior, API method, fixture, or test from memory when an existing source can be moved and patched.
- Reuse shared implementations by import rather than copying their source. Shell, authentication middleware, UI primitives, repository/file explorers, graph components, and design tokens stay owned by `beskid_sites/packages/shell-core` or `beskid_web_common`.
- Every migration task must record its source file, target file, and delta. A new-from-scratch file is allowed only when the DRY inventory marks it `NEW` and states why neither existing implementation fits.
- Keep one publication protocol: `POST /api/packages/{name}/versions` accepts multipart fields `version`, `checksumSha256`, and `artifact`; the UI must not revive the retired raw `/artifact` upload.
- Treat `beskid pckg` and protected CI as the normal publishers. Browser UI may manage keys, show commands, and report releases, but direct browser upload requires a separately approved product change.
- Trust browser identity only after the production proxy strips client-supplied `Remote-*` headers and injects verified forward-auth headers.
- Keep public package browsing, downloads, and docs usable without authentication. Authentication failures must not turn public routes into login redirects.
- Expose structured docs only for library packages. Template and tool pages must show their own install/use guidance instead of an empty docs screen.
- Preserve verified-artifact and traversal protections in the Rust service; UI rendering must not weaken them.
- Use current `@beskid/*` packages and the shared shell. Do not restore the historical `@cyber-nomad-collective/*` dependency names.
- Do not restore generated `.output`, `node_modules`, or generated route-tree files from history; regenerate them from tracked sources.
- Update the normative OpenSpec delta before introducing observable behavior that is not parity with the current Rust registry and `pckg/web` client.
- Run GitNexus upstream impact analysis before editing an existing symbol and `detect_changes()` before committing; warn before any HIGH or CRITICAL change.
- Do not push, merge, publish, deploy, change credentials, or mutate external services without explicit user authorization.
- Do not declare this plan complete, merge its implementation, or retain a compatibility fallback while `pckg/web`, `@beskid/pckg-web`, or another pckg UI/API client remains active.

## Convenience Contract

A journey is complete only when a first-time user can answer “what do I do next?” without leaving the page or guessing a hidden command:

1. Search results distinguish libraries, templates, and tools and link directly to package details and the relevant action.
2. Package pages provide copyable install/use commands, release status, checksum/download actions, publisher identity, README, dependencies, and reviews.
3. Publisher pages distinguish public identity from authenticated management and show verification state without exposing internal subjects as the primary label.
4. The release center provides key onboarding, local and CI command recipes, preflight guidance, release history, and actionable failures while delegating publication to the canonical CLI.
5. Documentation URLs preserve package, version, file, and source selection so refresh, back/forward, and sharing work.
6. Empty, loading, unauthorized, not-found, yanked, missing-docs, and server-error states each explain the next safe action.
7. Destructive lifecycle actions name the exact package/version, explain impact, require confirmation, and refresh the visible state after success.

## Review Focus

- A public visitor with no Authentik cookie must browse, search, download, and read docs without a redirect loop; Task 6 adds this browser test.
- A package with only yanked versions must not silently select a yanked release as “latest”; Tasks 5 and 7 pin the fallback and warning behavior.
- Package names, versions, and artifact paths containing URL-sensitive characters must be encoded once and cannot escape their route; Tasks 3 and 7 add contract tests.
- A newly created API key must be shown once, be copyable without re-rendering it into logs, and disappear after acknowledgement; Task 8 tests this lifecycle.
- Missing or malformed structured docs must fall back to README/file browsing without crashing or rendering untrusted HTML; Task 7 adds malformed-data and XSS fixtures.

---

## File and Ownership Map

| Area | Files | Responsibility |
| --- | --- | --- |
| Ignore rules | `.gitignore` | Permit tracked route directories named `packages` under the pckg app while retaining the NuGet ignore rule elsewhere. |
| New app shell | `beskid_sites/apps/pckg/package.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `src/router.tsx`, `src/routes/__root.tsx`, `src/components/pckg-shell.tsx` | Reproducible TanStack Start application and shared Beskid shell. |
| HTTP adapter | `beskid_sites/apps/pckg/src/lib/pckg-api.ts`, `pckg-api.test.ts` | The only browser/server adapter for the Rust `/api/*` contract. |
| Package presentation | `src/lib/package-kind-presentation.ts`, `src/components/package-*`, `src/routes/_public/packages/*` | Search, detail, install/use guidance, versions, dependencies, reviews. |
| Documentation | `src/lib/docs-location.ts`, `src/components/package-docs/*`, `src/routes/_public/packages/$name/docs.tsx` | Versioned, shareable README/API/doc/source browsing. |
| Publisher surfaces | `src/routes/_public/publishers/*`, `src/routes/dashboard/*`, `src/components/release-center/*` | Public publisher identity, my packages, API keys, release guidance and lifecycle controls. |
| Server contract | `compiler/crates/beskid_pckg_server/src/packages/*`, `artifact_routes.rs`, `api_key_routes.rs`, tests | Only fill contract gaps proven necessary by the UI; no presentation logic. |
| Deployment | `beskid_sites/apps/pckg/Dockerfile`, `beskid_sites/deploy/docker-compose.yml`, CI contract tests | Build the new app and place it in front of the existing Rust API under one origin. |
| Retirement | `pckg/Dockerfile`, `pckg/web/`, `pckg/README.md`, CI scripts | Freeze the old client during migration, then remove it and every reference before the program is complete. |

## DRY and Copy-First Analysis

The two existing web trees are migration inputs, not parallel designs to blend freely:

- Commit `fa54c08b` contains the intended TanStack Start structure and several focused presentational components.
- Current `pckg/web` contains the Rust-compatible API client, package-kind behavior, current package/docs journeys, authentication navigation, and tests.
- Current `shell-template`, `shell-core`, and `beskid_web_common` contain platform components that must be imported, not forked into pckg.

| Area | Current state | Target single path | Classification | Migration action |
| --- | --- | --- | --- | --- |
| HTTP types/client | Historical and maintained `pckg-api.ts` copies have drifted; only `pckg/web` matches the Rust API | `beskid_sites/apps/pckg/src/lib/pckg-api.ts` | Must unify | Copy `pckg/web/src/lib/pckg-api.ts` and its test first; patch framework imports and add missing lifecycle methods. Do not start from the historical client. |
| Package-kind rules | Current tested rules live in `pckg/web/src/lib/package-kind-presentation.ts` | Same path under the new app | Must unify | Copy implementation and test verbatim, then change only imports or newly approved copy text. |
| Public package behavior | Current route behavior is concentrated in `pckg/web/src/routes/package.tsx`; historical app has cleaner presentational components | File routes plus focused components under the new app | Must unify | Copy current behavior/tests, then extract it into copied historical `package-detail`, `package-grid`, `package-card`, `facts-card`, and `version-list` components. Preserve test assertions before changing layout. |
| Documentation browser | Current client includes README, metadata, docs, source, kind gating, and graph wiring; historical route has the target file-route shape | `/packages/$name/docs` | Must unify | Copy the historical file route as the shell, then transplant current queries/states from `pckg/web/src/routes/package.tsx`. Replace local tree UI with shared `FileExplorer` where its contract fits. |
| Publisher display | Historical focused component/tests and current Rust-compatible publisher DTOs both exist | New public publisher routes | Must unify | Copy historical `publisher-profile.tsx` and test; adapt props to copied current `PublisherSummary` and package data. |
| API-key management | Current behavior is tested indirectly in the maintained app and matches the Rust endpoints | New dashboard API-key route/component | Must unify | Copy the API-key section from `pckg/web/src/routes/account.tsx`, preserving one-time-secret behavior; extract after parity is green. |
| Authentication navigation | Current `auth-navigation.ts` and `session-display.ts` encode active forward-auth behavior | New app auth/dashboard guard | Must unify | Copy both implementations and tests; integrate them with TanStack Start without changing URL or display semantics. |
| Shell/auth implementation | Historical app copied shell/auth files that now have canonical shared owners | Imports from `shell-core` plus thin app configuration | Intentional shared dependency | Copy only the current `shell-template` adapter/config shape. Import middleware, shell, search, theme, and user menu from `shell-core`; never copy their implementation into pckg. |
| UI primitives | Both clients compose buttons, cards, inputs, badges, dialogs | `@beskid/ui-react` | Intentional shared dependency | Import shared primitives. Do not create pckg-local Button/Card/Input/Badge/Dialog variants. |
| File/source explorer | A shared `FileExplorer` and `RepoExplorerDialog` already exist | Shared explorer imports in package docs | Must reuse | Adapt package artifact entries to the shared explorer's types; do not build another pckg tree widget unless a documented contract gap remains after a focused shared-component extension. |
| Source graph | `pckg/web` has a fixture-backed panel; shared graph components already exist | Disabled until backed by live artifact facts | Can defer | Do not copy fixture-backed product behavior. Reuse shared graph components only after a real server contract exists. |
| Generated route tree/build output | Historical route tree and local `.output` exist | Generator-owned output | Must regenerate | Never copy or hand-edit generated output. |
| Retired community/Auth Hub/.NET paths | Historical app contains profile, NodeBB, pairing, email, and raw upload assumptions absent from Rust | No target | Must delete | Do not copy. Record them in the negative endpoint test so they cannot return by drift. |

Two ignored package-route remnants currently exist at `beskid_sites/apps/pckg/src/routes/_public/packages/index.tsx` and `$name.tsx`, and generated output proves they were once built, but commit `fa54c08b` does not track them. They may be copied as explicitly labelled working-tree references after inspection; they must not be described as historically committed source or trusted without the same parity tests as any other input.

### Copy-First Migration Protocol

For every copied slice:

1. Copy or restore the exact source and its closest tests without redesigning it.
2. Run the copied tests and record whether failure is caused by imports/framework shape or real contract drift.
3. Make the smallest compatibility patch: package names, route declaration, DTO shape, or shared-component adapter.
4. Run source-parity assertions before extracting or rearranging presentation code.
5. Add only the convenience behavior named by this plan.
6. Delete the source implementation and its wiring when the target slice passes; do not maintain synchronized copies.

Use explicit provenance in task notes and review descriptions:

```text
COPIED: pckg/web/src/lib/package-kind-presentation.ts
TO:     beskid_sites/apps/pckg/src/lib/package-kind-presentation.ts
DELTA:  import path only
```

The migration branch may contain both clients only while a slice is being proven. This is a temporary move-and-delete sequence, not an accepted dual implementation and not a compatibility strategy.

Every task review must include this provenance footer:

```text
Sources copied:
Shared implementations imported:
Intentional compatibility deltas:
New code with no reusable source:
Duplicate source deleted or deletion gate:
```

### Task 1: Protect, Inventory, and Restore the New Application Source

**Files:**
- Modify: `.gitignore`
- Create: `beskid_sites/apps/pckg/package.json`
- Create: `beskid_sites/apps/pckg/tsconfig.json`
- Create: `beskid_sites/apps/pckg/vite.config.ts`
- Create: `beskid_sites/apps/pckg/vitest.config.ts`
- Create: `beskid_sites/apps/pckg/biome.json`
- Create: `beskid_sites/apps/pckg/src/test-setup.tsx`
- Create: `scripts/ci/test/pckg-site-source-contract.test.sh`
- Create: `docs/research/pckg-copy-provenance.md`
- Modify: `beskid_sites/pnpm-lock.yaml`

**Interfaces:**
- Consumes: root pnpm workspace and the maintained shell-template build configuration.
- Produces: a tracked `beskid-pckg` workspace with `build`, `typecheck`, `test`, and `check` scripts.

- [ ] **Step 1: Add a failing source-retention contract**

```bash
#!/usr/bin/env bash
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
git -C "$root" check-ignore -q beskid_sites/apps/pckg/src/routes/_public/packages/index.tsx \
  && { echo 'pckg package routes are incorrectly ignored'; exit 1; }
git -C "$root" ls-files --error-unmatch beskid_sites/apps/pckg/package.json >/dev/null
git -C "$root" ls-files --error-unmatch 'beskid_sites/apps/pckg/src/routes/_public/packages/index.tsx' >/dev/null
```

- [ ] **Step 2: Run the contract and verify the historical failure**

Run: `bash scripts/ci/test/pckg-site-source-contract.test.sh`

Expected: FAIL because `.gitignore` matches `**/[Pp]ackages/*` and the application manifest is absent.

- [ ] **Step 3: Record the copy provenance before moving source**

Create `docs/research/pckg-copy-provenance.md` with one row per target file and these required columns:

```markdown
| Target | Source revision/path | Action | Required delta | Source deletion gate |
| --- | --- | --- | --- | --- |
| `beskid_sites/apps/pckg/src/lib/pckg-api.ts` | `pckg/web/src/lib/pckg-api.ts` at pinned submodule revision | COPY-AND-ADAPT | TanStack Start base URL only | Task 11 |
```

Allowed actions are `COPY`, `COPY-AND-ADAPT`, `REUSE-BY-IMPORT`, `NEW`, and `DO-NOT-COPY`. Review rejects any `NEW` row without a concrete incompatibility explanation.

- [ ] **Step 4: Scope the NuGet ignore rule and restore configuration intentionally**

Add an exception for the whole application after the broad NuGet rule:

```gitignore
!beskid_sites/apps/pckg/
!beskid_sites/apps/pckg/**
```

Copy the current configuration files from `beskid_sites/apps/shell-template`, then change only the app name, port, pckg dependencies, and pckg routes. Use these dependency authorities:

```json
{
  "name": "beskid-pckg",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev --port 8082",
    "build": "vite build",
    "start": "node .output/server/index.mjs",
    "check": "biome check",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

Restore the files classified `COPY` or `COPY-AND-ADAPT` from `fa54c08b` with Git so their content is exact, then patch imports to current `@beskid/*` packages. Do not restore files classified `DO-NOT-COPY`; regenerate the route tree through the Vite plugin.

- [ ] **Step 5: Install and run the workspace gates**

Run:

```bash
pnpm --dir beskid_sites install --lockfile-only
pnpm --dir beskid_sites/apps/pckg run typecheck
pnpm --dir beskid_sites/apps/pckg run test
pnpm --dir beskid_sites/apps/pckg run build
bash scripts/ci/test/pckg-site-source-contract.test.sh
```

Expected: all commands PASS; `git ls-files` lists package route sources.

- [ ] **Step 6: Commit the restoration boundary**

```bash
git add .gitignore docs/research/pckg-copy-provenance.md scripts/ci/test/pckg-site-source-contract.test.sh beskid_sites/apps/pckg beskid_sites/pnpm-lock.yaml
git commit -m "chore(pckg): restore tracked site application"
```

### Task 2: Establish the Shell, Route, and Error-State Contract

**Files:**
- Create: `beskid_sites/apps/pckg/src/router.tsx`
- Create: `beskid_sites/apps/pckg/src/router.test.tsx`
- Create: `beskid_sites/apps/pckg/src/routes/__root.tsx`
- Create: `beskid_sites/apps/pckg/src/routes/_public.tsx`
- Create: `beskid_sites/apps/pckg/src/routes/_public/index.tsx`
- Create: `beskid_sites/apps/pckg/src/routes/dashboard.tsx`
- Create: `beskid_sites/apps/pckg/src/components/pckg-shell.tsx`
- Create: `beskid_sites/apps/pckg/src/components/query-state.tsx`
- Create: `beskid_sites/apps/pckg/src/styles.css`

**Interfaces:**
- Consumes: `@beskid/beskid-ui`, `@beskid/ui-react`, TanStack Router and Query.
- Produces: `createPckgRouter()`, `QueryState`, public/dashboard layouts, and canonical route names used by later tasks.

- [ ] **Step 1: Write failing route and public-shell tests**

Assert that `/` redirects to `/packages`, `/packages` stays public, `/dashboard` guards through `/auth?next=...`, 404 renders a recovery link, and query failures render retry controls without leaking response bodies.

```tsx
expect(router.routesById["/_public/packages/"]).toBeDefined();
expect(router.routesById["/dashboard"]).toBeDefined();
expect(screen.getByRole("link", { name: /browse packages/i })).toHaveAttribute("href", "/packages");
```

- [ ] **Step 2: Verify tests fail before routes exist**

Run: `pnpm --dir beskid_sites/apps/pckg test -- router.test.tsx`

Expected: FAIL on missing route IDs and shell components.

- [ ] **Step 3: Copy the app adapters and reuse the shared shell implementation**

Copy `router.tsx`, `__root.tsx`, environment parsing, health route, and test setup from the current `shell-template`. Restore the historical pckg route layout only where it is pckg-specific. Import `AppShell`, search, theme, authentication middleware, and user-menu behavior from `shell-core`; do not reproduce those components locally.

Implement only the pckg-specific `QueryState` adapter with an explicit discriminated union:

```ts
export type QueryStateProps =
  | { state: "loading"; label: string }
  | { state: "empty"; title: string; detail: string; action?: React.ReactNode }
  | { state: "error"; title: string; detail: string; onRetry?: () => void };
```

Keep package search, Docs, Publishers, and Dashboard visible in predictable navigation positions; use the shared hub launcher as the leftmost item.

- [ ] **Step 4: Run focused tests and accessibility checks**

Run:

```bash
pnpm --dir beskid_sites/apps/pckg test -- router.test.tsx
pnpm --dir beskid_sites/apps/pckg run typecheck
```

Expected: PASS; all icon-only actions have accessible names and the dashboard guard retains the requested `next` route.

- [ ] **Step 5: Commit the application shell**

```bash
git add beskid_sites/apps/pckg/src
git commit -m "feat(pckg): establish convenient application shell"
```

### Task 3: Copy the Maintained Rust-Contract Client into the New App

**Files:**
- Create: `beskid_sites/apps/pckg/src/lib/pckg-api.ts`
- Create: `beskid_sites/apps/pckg/src/lib/pckg-api.test.ts`
- Create: `beskid_sites/apps/pckg/src/lib/pckg-contract.ts`
- Modify only if contract evidence requires it: `compiler/crates/beskid_pckg_server/src/packages/contracts.rs`
- Test: `compiler/crates/beskid_pckg_server/tests/http_contract.rs`
- Test: `compiler/crates/beskid_pckg_server/tests/package_contract.rs`

**Interfaces:**
- Consumes: exact routes exposed by `build_router()` in `beskid_pckg_server`.
- Produces: `PckgApiClient`, `PackageSummary`, `PackageDetails`, `PublisherSummary`, `Session`, `ApiKey`, `PackageVersion`, and typed `PckgApiError`.

- [ ] **Step 1: Copy the maintained API client and tests as the baseline**

Copy `pckg/web/src/lib/pckg-api.ts` and `pckg/web/src/lib/pckg-api.test.ts` into the new app before editing. Preserve all current request and response assertions. Do not copy the historical API client from `fa54c08b`, because its .NET/Auth Hub/community methods are the drift this task removes.

- [ ] **Step 2: Extend the copied API-client tests for every retained request shape**

Cover URL encoding and methods for:

```ts
await client.listPackages({ query: "core/io" });
await client.getPackage("owner/name");
await client.getPackageDoc("lib", "1.0+build", "guides/a b.md");
await client.createApiKey({ name: "release", scopes: ["publish"] });
await client.yankVersion("lib", "1.2.3");
```

Expected URLs must encode dynamic segments exactly once. Explicitly assert that no client method targets `/users/*`, `/api/auth/hub/*`, `/api/community/*`, `/api/admin/email-settings`, or `/versions/{version}/artifact`.

- [ ] **Step 3: Verify the extended tests fail only for missing target behavior**

Run: `pnpm --dir beskid_sites/apps/pckg test -- pckg-api.test.ts`

Expected: existing copied tests PASS; new negative-endpoint and lifecycle tests FAIL. If an existing copied test fails, fix the copy/integration before adding behavior.

- [ ] **Step 4: Adapt the copied client minimally**

Use one request method and one error type:

```ts
export class PckgApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: "unauthorized" | "forbidden" | "not-found" | "conflict" | "invalid" | "server",
    message: string,
  ) { super(message); }
}
```

Do not add browser publication. Add only package list/detail/search, publishers, reviews, docs/source, session, API-key, package delete, and version yank/unyank methods already backed by Rust routes.

- [ ] **Step 5: Copy and extend server serialization assertions**

Add assertions that package and publisher JSON use the TypeScript field names, including `packageKind`, `template`, `displayName`, `isPublisherVerified`, `packageCount`, `checksumSha256`, and `isYanked`.

Run:

```bash
cargo test --manifest-path compiler/Cargo.toml -p beskid_pckg_server --test http_contract
cargo test --manifest-path compiler/Cargo.toml -p beskid_pckg_server --test package_contract
pnpm --dir beskid_sites/apps/pckg test -- pckg-api.test.ts
```

Expected: PASS without restoring retired endpoints.

- [ ] **Step 6: Commit the contract changes in their owning repositories**

```bash
git -C compiler add crates/beskid_pckg_server/src/packages/contracts.rs crates/beskid_pckg_server/tests
git -C compiler commit -m "feat(pckg): expose web registry contract"
git add compiler beskid_sites/apps/pckg/src/lib
git commit -m "feat(pckg): bind site to Rust registry contract"
```

If no server contract change was necessary, skip the nested compiler commit and do not advance the compiler submodule pointer.

### Task 4: Copy and Adapt Convenient Package Discovery

**Files:**
- Create: `beskid_sites/apps/pckg/src/routes/_public/packages/index.tsx`
- Create: `beskid_sites/apps/pckg/src/components/package-card.tsx`
- Create: `beskid_sites/apps/pckg/src/components/package-grid.tsx`
- Create: `beskid_sites/apps/pckg/src/components/package-grid.test.tsx`
- Create: `beskid_sites/apps/pckg/src/lib/package-kind-presentation.ts`
- Create: `beskid_sites/apps/pckg/src/lib/package-kind-presentation.test.ts`

**Interfaces:**
- Consumes: `PckgApiClient.listPackages()` and `PackageSummary` from Task 3.
- Produces: `/packages?q=...`, `PackageGrid`, and `packageKindPresentation()` used by detail and publisher pages.

- [ ] **Step 1: Copy the historical grid/card components and tests**

Restore `package-card.tsx`, `package-grid.tsx`, and `package-grid.test.tsx` from `fa54c08b`. Copy the current `package-kind-presentation.ts` and its test from `pckg/web`. Run them before altering layout or text.

- [ ] **Step 2: Extend the copied discovery tests**

Test blank query, no matches, special-character query, API error/retry, verified publisher badge, and library/template/tool cards. Pin actions:

```tsx
expect(screen.getByRole("link", { name: "Open corelib" })).toHaveAttribute("href", "/packages/corelib");
expect(screen.getByText("Template")).toBeVisible();
expect(screen.getByRole("button", { name: "Retry package search" })).toBeVisible();
```

- [ ] **Step 3: Run the discovery tests and isolate compatibility failures**

Run: `pnpm --dir beskid_sites/apps/pckg test -- package-grid.test.tsx package-kind-presentation.test.ts`

Expected: FAIL because kind-specific actions and error states are absent.

- [ ] **Step 4: Adapt the copied grid to URL-owned search and actionable cards**

The search form must write `q` to the URL, preserve submitted text on refresh, and render:

- library: `View package` and `Docs` when a release exists;
- template: `View template` and short-name metadata;
- tool: `View tool` and install guidance preview.

Do not fetch on every keystroke; submit explicitly and keep server paging fields ready for later extension.

- [ ] **Step 5: Run focused and route tests**

Run:

```bash
pnpm --dir beskid_sites/apps/pckg test -- package-grid.test.tsx package-kind-presentation.test.ts router.test.tsx
pnpm --dir beskid_sites/apps/pckg run typecheck
```

Expected: PASS with keyboard-accessible links and search controls.

- [ ] **Step 6: Commit package discovery**

```bash
git add beskid_sites/apps/pckg/src
git commit -m "feat(pckg): add package discovery journey"
```

### Task 5: Copy and Complete the Package Page

**Files:**
- Create: `beskid_sites/apps/pckg/src/routes/_public/packages/$name.tsx`
- Create: `beskid_sites/apps/pckg/src/components/package-detail.tsx`
- Create: `beskid_sites/apps/pckg/src/components/package-detail.test.tsx`
- Create: `beskid_sites/apps/pckg/src/components/package-instructions.tsx`
- Create: `beskid_sites/apps/pckg/src/components/package-versions.tsx`
- Create: `beskid_sites/apps/pckg/src/components/package-reviews.tsx`
- Create: `beskid_sites/apps/pckg/src/components/copy-command.tsx`
- Create: `beskid_sites/apps/pckg/src/components/copy-command.test.tsx`

**Interfaces:**
- Consumes: `getPackage`, review methods, download URL builder, and `packageKindPresentation()`.
- Produces: canonical `/packages/$name` page and reusable `CopyCommand`.

- [ ] **Step 1: Copy package presentation before adding behavior**

Restore historical `facts-card.tsx`, `package-detail.tsx`, `package-detail.test.tsx`, and `version-list.tsx`. Copy the maintained package detail/review/docs assertions from `pckg/web/src/routes/package.tsx` into focused target tests. Preserve all assertions before splitting components.

- [ ] **Step 2: Extend the copied package-page journey tests**

Fixtures must cover:

```ts
const cases = [
  { kind: "library", expectedCommand: "beskid pckg add acme.logging" },
  { kind: "template", expectedCommand: "beskid new --template web-api" },
  { kind: "tool", expectedCommand: "beskid pckg add acme.formatter" },
] as const;
```

Also test dependencies, dependents, publisher link, README, reviews, checksum copy, version download, no releases, only-yanked releases, and 404 recovery.

- [ ] **Step 3: Verify copied parity before convenience changes**

Run: `pnpm --dir beskid_sites/apps/pckg test -- package-detail.test.tsx copy-command.test.tsx`

Expected: copied historical component tests PASS after import adaptation; newly transplanted current-behavior assertions fail only where the historical component lacked current Rust behavior.

- [ ] **Step 4: Merge current behavior into copied components**

Render, in order: identity/kind, concise purpose, primary copyable command, download/docs actions, release warning, README, dependencies, facts, reviews, then all versions. Link first-party dependencies back to package pages. External links use safe `rel="noreferrer"` behavior.

For only-yanked packages, show “No current release” and require an explicit version click; never label a yanked version as latest.

- [ ] **Step 5: Run package and API tests**

Run:

```bash
pnpm --dir beskid_sites/apps/pckg test -- package-detail.test.tsx copy-command.test.tsx pckg-api.test.ts
pnpm --dir beskid_sites/apps/pckg run typecheck
```

Expected: PASS; copy feedback is announced through an `aria-live` region.

- [ ] **Step 6: Commit package parity**

```bash
git add beskid_sites/apps/pckg/src
git commit -m "feat(pckg): complete package detail experience"
```

### Task 6: Copy and Adapt Publisher Discovery and Verified Identity

**Files:**
- Create: `beskid_sites/apps/pckg/src/routes/_public/publishers/index.tsx`
- Create: `beskid_sites/apps/pckg/src/routes/_public/publishers/$subject.tsx`
- Create: `beskid_sites/apps/pckg/src/components/publisher-profile.tsx`
- Create: `beskid_sites/apps/pckg/src/components/publisher-profile.test.tsx`
- Create: `beskid_sites/apps/pckg/e2e/public-visitor.spec.ts`
- Create: `beskid_sites/apps/pckg/playwright.config.ts`

**Interfaces:**
- Consumes: `listPublishers()` and `listPublisherPackages(subject)`.
- Produces: `/publishers`, `/publishers/$subject`, and public no-cookie browser coverage.

- [ ] **Step 1: Copy the historical publisher component and tests**

Restore `publisher-profile.tsx` and `publisher-profile.test.tsx` from `fa54c08b`. Copy current publisher DTOs and route expectations from `pckg/web/src/routes/community.tsx`. Adapt the component props from retired `CommunityProfile` fields to the Rust-owned `PublisherSummary`; do not recreate the layout.

- [ ] **Step 2: Extend public publisher and anonymous-navigation tests**

Assert display name is primary, subject is secondary, verification is visible but not implied for unverified accounts, package count matches the rendered list, and empty publishers have a useful message.

```ts
await page.context().clearCookies();
await page.goto("/packages");
await expect(page).toHaveURL(/\/packages/);
await page.getByRole("link", { name: "Publishers" }).click();
await expect(page.getByRole("heading", { name: "Publishers" })).toBeVisible();
```

- [ ] **Step 3: Run tests and verify only missing target integration fails**

Run:

```bash
pnpm --dir beskid_sites/apps/pckg test -- publisher-profile.test.tsx
pnpm --dir beskid_sites/apps/pckg exec playwright test e2e/public-visitor.spec.ts
```

Expected: FAIL before publisher routes and test server wiring exist.

- [ ] **Step 4: Adapt the copied publisher routes to registry-owned facts**

Do not revive editable bios or social links unless the Rust service owns and tests them. Render verified state, package count, public packages, kinds, downloads, and last update from current registry responses.

- [ ] **Step 5: Run component and anonymous browser tests**

Run the commands from Step 2.

Expected: PASS; no request to a public route reaches `/api/auth/login`.

- [ ] **Step 6: Commit publisher discovery**

```bash
git add beskid_sites/apps/pckg
git commit -m "feat(pckg): add public publisher profiles"
```

### Task 7: Consolidate Copied Documentation into One Safe Browser

**Files:**
- Create: `beskid_sites/apps/pckg/src/routes/_public/packages/$name/docs.tsx`
- Create: `beskid_sites/apps/pckg/src/lib/docs-location.ts`
- Create: `beskid_sites/apps/pckg/src/lib/docs-location.test.ts`
- Create: `beskid_sites/apps/pckg/src/components/package-docs/docs-browser.tsx`
- Create: `beskid_sites/apps/pckg/src/components/package-docs/docs-browser.test.tsx`
- Create: `beskid_sites/apps/pckg/src/components/package-docs/markdown-document.tsx`
- Create: `beskid_sites/apps/pckg/src/components/package-docs/source-browser.tsx`
- Create: `beskid_sites/apps/pckg/e2e/package-docs.spec.ts`
- Test: `compiler/crates/beskid_pckg_server/tests/artifact_http.rs`

**Interfaces:**
- Consumes: package detail, README, structured docs, docs tree/file, and source tree/file endpoints.
- Produces: `DocsLocation { version: string; doc?: string; source?: string }`, URL codecs, safe Markdown rendering, and `/packages/$name/docs`.

- [ ] **Step 1: Copy both proven documentation implementations into focused targets**

Restore the historical `docs/$package.tsx` route for its TanStack file-route structure. Transplant the current README, structured metadata, docs tree/file, source tree/file, package-kind gating, and error behavior from `pckg/web/src/routes/package.tsx`. Reuse `@beskid/ui-react`'s `FileExplorer` through a package-entry adapter rather than copying either app's hand-built tree controls.

- [ ] **Step 2: Add URL-state and hostile-content tests around the copied behavior**

```ts
expect(parseDocsSearch({ version: "1.0+meta", doc: "guides/a b.md" })).toEqual({
  version: "1.0+meta",
  doc: "guides/a b.md",
});
expect(rendered.container.querySelector("script")).toBeNull();
```

Cover refresh/deep-link restoration, back/forward between files, malformed `api.json`, missing README, empty docs/source trees, traversal-like paths, only-yanked versions, and template/tool packages.

- [ ] **Step 3: Verify parity passes before URL-state improvements**

Run:

```bash
pnpm --dir beskid_sites/apps/pckg test -- docs-location.test.ts docs-browser.test.tsx
cargo test --manifest-path compiler/Cargo.toml -p beskid_pckg_server --test artifact_http
```

Expected: copied docs/source behavior tests PASS after import adaptation; new URL-codec and hostile-content tests FAIL; existing Rust traversal tests PASS and remain the security baseline.

- [ ] **Step 4: Adapt the copied browser into a three-pane documentation journey**

Use a responsive structure: version and file navigation, rendered content, and contextual metadata/source. On narrow screens, turn panes into explicit tabs. Persist selection in `version`, `doc`, and `source` search parameters. Sanitize Markdown; do not permit raw HTML. Add code highlighting only through a build-time/client-safe highlighter with no remote execution.

Structured API documentation enhances the page but is not a single point of failure: malformed/missing metadata falls back to README, documentation files, and source.

- [ ] **Step 5: Run unit, browser, and server security tests**

Run:

```bash
pnpm --dir beskid_sites/apps/pckg test -- docs-location.test.ts docs-browser.test.tsx
pnpm --dir beskid_sites/apps/pckg exec playwright test e2e/package-docs.spec.ts
cargo test --manifest-path compiler/Cargo.toml -p beskid_pckg_server --test artifact_http
```

Expected: PASS including refresh and back-button behavior.

- [ ] **Step 6: Commit documentation changes in their owning repositories**

```bash
git -C compiler add crates/beskid_pckg_server/tests/artifact_http.rs
git -C compiler commit -m "test(pckg): preserve artifact browsing safety"
git add compiler beskid_sites/apps/pckg
git commit -m "feat(pckg): add shareable package documentation"
```

If the existing Rust security tests already cover every required case unchanged, leave the compiler submodule untouched and commit only the site work.

### Task 8: Copy Publisher Management and Extend It into a Release Center

**Files:**
- Create: `beskid_sites/apps/pckg/src/routes/auth.tsx`
- Create: `beskid_sites/apps/pckg/src/routes/dashboard/index.tsx`
- Create: `beskid_sites/apps/pckg/src/routes/dashboard/packages.tsx`
- Create: `beskid_sites/apps/pckg/src/routes/dashboard/api-keys.tsx`
- Create: `beskid_sites/apps/pckg/src/components/release-center/api-key-manager.tsx`
- Create: `beskid_sites/apps/pckg/src/components/release-center/api-key-manager.test.tsx`
- Create: `beskid_sites/apps/pckg/src/components/release-center/publish-guide.tsx`
- Create: `beskid_sites/apps/pckg/src/components/release-center/publish-guide.test.tsx`
- Create: `beskid_sites/apps/pckg/src/components/release-center/release-history.tsx`
- Create: `beskid_sites/apps/pckg/e2e/publisher-release-center.spec.ts`

**Interfaces:**
- Consumes: session, owned packages, API keys, package versions, yank/unyank/delete endpoints.
- Produces: authenticated `/dashboard`, `/dashboard/packages`, `/dashboard/api-keys`, and command recipes based on `BESKID_PCKG_URL` plus `BESKID_PCKG_API_KEY`.

- [ ] **Step 1: Copy current authentication, session, owned-package, and API-key behavior**

Copy these maintained files and tests before extraction:

```text
pckg/web/src/lib/auth-navigation.ts
pckg/web/src/lib/auth-navigation.test.ts
pckg/web/src/lib/session-display.ts
pckg/web/src/lib/session-display.test.ts
pckg/web/src/routes/account.tsx          (API-key section)
pckg/web/src/routes/package.tsx          (My Packages section)
pckg/web/src/routes/dashboard.tsx        (guard/navigation behavior)
```

Restore historical `dashboard/my-packages.tsx` only as the target layout. Do not restore historical `dashboard/profile.tsx`, raw upload code, or editable community-profile behavior.

- [ ] **Step 2: Extend release-center behavior tests**

Pin one-time key handling:

```tsx
await user.click(screen.getByRole("button", { name: "Create API key" }));
expect(screen.getByLabelText("New API key")).toHaveTextContent("pckg_");
await user.click(screen.getByRole("button", { name: "I copied it" }));
expect(screen.queryByLabelText("New API key")).not.toBeInTheDocument();
```

Also test revoked keys, missing publish scope, unverified publisher guidance, local command recipe, CI secret recipe, dry-run recipe, existing releases, yank confirmation, failed action recovery, and no browser file input.

- [ ] **Step 3: Verify copied behavior passes before adding the release guide**

Run: `pnpm --dir beskid_sites/apps/pckg test -- api-key-manager.test.tsx publish-guide.test.tsx`

Expected: copied auth/session/API-key behavior PASS after framework adaptation; new command-guidance and guarded-lifecycle tests FAIL.

- [ ] **Step 4: Extract copied behavior and add progressive publisher onboarding**

Show a compact checklist driven by facts rather than stored wizard state:

1. authenticated session;
2. publisher verification status;
3. active key with `publish` scope;
4. CLI available (`beskid pckg --help` guidance, not browser detection);
5. `beskid pckg publish --dry-run`;
6. `beskid pckg publish` or protected CI.

Commands must be copyable and never interpolate the plaintext key. Show environment-variable placeholders and link to the canonical Book/reference pages.

- [ ] **Step 5: Add release history and guarded lifecycle actions**

Yank/unyank actions must name the exact package and version. Package deletion requires typing the package name and is available only when the API authorizes it. After success, invalidate package detail, owned-package, and search queries.

- [ ] **Step 6: Run unit and authenticated browser tests**

Run:

```bash
pnpm --dir beskid_sites/apps/pckg test -- api-key-manager.test.tsx publish-guide.test.tsx
pnpm --dir beskid_sites/apps/pckg exec playwright test e2e/publisher-release-center.spec.ts
```

Expected: PASS; browser test confirms API-key secret disappears after acknowledgement and never appears in console/network logs.

- [ ] **Step 7: Commit the release center**

```bash
git add beskid_sites/apps/pckg
git commit -m "feat(pckg): add publisher release center"
```

### Task 9: Copy and Adapt Same-Origin Runtime and Production Authentication

**Files:**
- Create: `beskid_sites/apps/pckg/Dockerfile`
- Create: `beskid_sites/apps/pckg/src/env.server.ts`
- Create: `beskid_sites/apps/pckg/src/server/pckg-proxy.ts`
- Create: `beskid_sites/apps/pckg/src/server/pckg-proxy.test.ts`
- Modify: `beskid_sites/deploy/docker-compose.yml`
- Modify: `beskid_sites/deploy/.env.example`
- Modify: `beskid_sites/deploy/README.md`
- Create: `scripts/ci/test/pckg-site-image-contract.test.sh`

**Interfaces:**
- Consumes: the built TanStack app, internal Rust registry origin, and trusted Caddy/Authentik headers.
- Produces: one public origin at `https://pckg.beskid-lang.org`, serving UI and proxying `/api/*`, `/health/*`, and downloads to the Rust service.

- [ ] **Step 1: Copy the canonical site image/auth scaffolding**

Copy the current `shell-template` Dockerfile, environment schema, shell-auth adapter, shell-user adapter, login/callback/logout routes, health route, styles, and public brand assets. Adapt service name, port, pckg API origin, cookies, and redirect paths only. Do not use the historical Dockerfile or recreate OIDC/session handling.

- [ ] **Step 2: Extend proxy and image-contract tests**

Assert the proxy forwards method, query, content type, body stream, cookies, authorization, range, and verified identity headers; strips client-supplied `Remote-*` values before the trusted hop; and streams downloads instead of buffering them.

```ts
expect(upstream.headers.get("authorization")).toBe("Bearer pckg_test");
expect(upstream.headers.get("remote-user")).toBe("verified-subject");
expect(response.headers.get("content-disposition")).toContain("attachment");
```

- [ ] **Step 3: Run tests and verify only pckg-specific integration fails**

Run:

```bash
pnpm --dir beskid_sites/apps/pckg test -- pckg-proxy.test.ts
bash scripts/ci/test/pckg-site-image-contract.test.sh
```

Expected: FAIL on missing proxy and Dockerfile contract.

- [ ] **Step 4: Adapt the copied scaffold to an explicit two-process deployment boundary**

Prefer two containers in Compose: `pckg-web` for TanStack Start and `pckg` for Rust. Route the public hostname to `pckg-web`; proxy `/api/*` and `/health/*` internally to `pckg:8082`. Keep PostgreSQL and artifact volumes mounted only into the Rust service. Do not grant the web container database or artifact-volume access.

- [ ] **Step 5: Validate local Compose and identity boundaries**

Run:

```bash
docker compose -f beskid_sites/deploy/docker-compose.yml config
docker build -f beskid_sites/apps/pckg/Dockerfile -t beskid-pckg-web-plan-check .
bash scripts/ci/test/pckg-site-image-contract.test.sh
```

Then start the local reference stack with mock auth and verify:

```bash
curl -fsS http://127.0.0.1:8082/health/ready
curl -fsS http://127.0.0.1:8082/packages >/dev/null
curl -fsS http://127.0.0.1:8082/api/packages >/dev/null
```

Expected: all public probes succeed; dashboard API rejects absent identity; spoofed identity headers do not authenticate.

- [ ] **Step 6: Commit deployment integration**

```bash
git add beskid_sites/apps/pckg beskid_sites/deploy scripts/ci/test/pckg-site-image-contract.test.sh
git commit -m "feat(pckg): integrate site with registry runtime"
```

### Task 10: Add End-to-End Parity and Usability Gates

**Files:**
- Create: `beskid_sites/apps/pckg/e2e/package-discovery.spec.ts`
- Create: `beskid_sites/apps/pckg/e2e/package-detail.spec.ts`
- Create: `beskid_sites/apps/pckg/e2e/accessibility.spec.ts`
- Create: `scripts/ci/test/pckg-experience-parity.test.sh`
- Modify: the appropriate `.woodpecker/*.yml` validation workflow selected by repository convention
- Modify: `beskid_sites/README.md`

**Interfaces:**
- Consumes: Tasks 1–9 and seeded Rust test data.
- Produces: one repeatable local/CI command proving the migration is safe to expose.

- [ ] **Step 1: Copy existing contract assertions into one parity gate**

Invoke the maintained tests rather than restating them: copied pckg API/kind/auth/session tests, historical component tests, Rust HTTP/package/artifact/API-key tests, shared-shell tests, and existing Dockerfile/deployment contracts. Add only orchestration and missing browser journeys.

- [ ] **Step 2: Extend the parity checklist with executable route assertions**

The script must fail unless the new app has public package list/detail/docs, publishers, dashboard package/key routes, current API client tests, production build, image contract, and anonymous browser coverage.

```bash
pnpm --dir beskid_sites/apps/pckg run typecheck
pnpm --dir beskid_sites/apps/pckg run test
pnpm --dir beskid_sites/apps/pckg run build
pnpm --dir beskid_sites/apps/pckg exec playwright test
cargo test --manifest-path compiler/Cargo.toml -p beskid_pckg_server
```

- [ ] **Step 3: Add only the missing complete browser journeys**

Seed library, template, tool, unverified publisher, verified publisher, no-release, yanked-release, malformed-docs, and missing-docs fixtures. Test keyboard-only use, visible focus, heading order, labelled forms, live copy feedback, narrow viewport docs navigation, and destructive confirmation.

- [ ] **Step 4: Run the aggregate gate and fix failures at their owning layer**

Run: `bash scripts/ci/test/pckg-experience-parity.test.sh`

Expected: PASS twice consecutively from a clean build output directory; no test depends on pre-existing `.output` or `node_modules` contents.

- [ ] **Step 5: Document the contributor workflow**

Document exact install, dev, test, build, API origin, mock-auth, and Compose commands. State that browser upload is intentionally absent and point contributors to the CLI publication contract.

- [ ] **Step 6: Commit the quality gate**

```bash
git add beskid_sites/apps/pckg/e2e scripts/ci/test/pckg-experience-parity.test.sh .woodpecker beskid_sites/README.md
git commit -m "test(pckg): gate complete registry journeys"
```

### Task 11: Cut Over and Remove the Duplicate Web Client

**Files:**
- Modify: `pckg/Dockerfile`
- Remove after proven cutover: `pckg/web/`
- Modify: `pckg/README.md`
- Modify: `pckg/CHANGELOG.md`
- Modify: `scripts/sync-beskid-packages.sh`
- Modify: `scripts/ci/test/platform-stylesheet-contract.test.sh`
- Modify: root `CHANGELOG.md`
- Modify if ownership changed: `GUIDE.md`

**Interfaces:**
- Consumes: passing parity gate and a deployment artifact built from the new app.
- Produces: exactly one UI implementation (`beskid_sites/apps/pckg`) and exactly one registry implementation (`beskid_pckg_server`), with no compatibility fallback.

- [ ] **Step 1: Record a cutover evidence report before deletion**

Run and save output in the release/work item, not as generated repository noise:

```bash
bash scripts/ci/test/pckg-experience-parity.test.sh
git ls-files pckg/web beskid_sites/apps/pckg
docker compose -f beskid_sites/deploy/docker-compose.yml config
```

Require explicit evidence for public browsing, authenticated dashboard, API-key lifecycle, CLI publication to a disposable registry, docs deep links, downloads, rollback image tag, and persistent PostgreSQL/artifact volumes.

- [ ] **Step 2: Obtain the required cutover authorization**

Stop for user approval before changing production image routing or deleting the old client. Deployment and removal may occur in separate maintenance windows, but they remain one migration: do not close or merge the program while the old client exists.

- [ ] **Step 3: Switch the image build to the new web app**

Make `pckg/Dockerfile` build only the Rust service if Compose uses a separate `pckg-web` image. Remove bundling of `pckg/web/dist`; preserve port, health, database, and artifact-volume contracts.

- [ ] **Step 4: Run the parity gate against the cutover image**

Run:

```bash
bash scripts/ci/test/pckg-experience-parity.test.sh
bash pckg/scripts/test-dockerfile-contract.sh
docker compose -f beskid_sites/deploy/docker-compose.yml config
```

Expected: PASS with the old client still present but unused.

- [ ] **Step 5: Delete the old client in its owning submodule**

Inside the `pckg` submodule, remove `web/`, remove its Docker build/bundle stage, update `README.md` to identify `beskid_sites/apps/pckg` as the sole web surface, and record the removal in `pckg/CHANGELOG.md`. Commit that nested change before advancing the root submodule pointer:

```bash
git -C pckg add -A web Dockerfile README.md CHANGELOG.md
git -C pckg commit -m "refactor: remove superseded pckg web client"
git add pckg
```

In the root repository, remove the package-sync target and old stylesheet contract. Do not leave a compatibility UI, copied API client, or build-only reference to the deleted client.

- [ ] **Step 6: Verify single-implementation closure**

Run:

```bash
rg -n 'pckg/web|@beskid/pckg-web|versions/.*/artifact|api/auth/hub|users/bootstrap-status' \
  Dockerfile pckg beskid_sites scripts .woodpecker || true
test "$(find beskid_sites/apps pckg -path '*/src/lib/pckg-api.ts' -o -path '*/web/package.json' | wc -l | tr -d ' ')" = "1"
test "$(rg -l 'class PckgApiClient|type PackageKind =|function packageKindPresentation' beskid_sites pckg --glob '*.{ts,tsx}' | wc -l | tr -d ' ')" = "2"
bash scripts/ci/test/pckg-experience-parity.test.sh
git diff --check
```

Expected: the only web API client is `beskid_sites/apps/pckg/src/lib/pckg-api.ts`; the only package-kind definition and presenter are the canonical target files (two files total); no active reference points to the removed client or retired endpoints; all gates PASS.

- [ ] **Step 7: Run GitNexus change detection and commit retirement**

Run `detect_changes({scope: "compare", base_ref: "main"})`, inspect every affected process, then:

```bash
git add pckg beskid_sites scripts .woodpecker GUIDE.md CHANGELOG.md
git commit -m "refactor(pckg): retire duplicate web client"
```

## Execution Order and Review Gates

```text
Restore tracked app
  → lock Rust API contract
    → package discovery/detail
      → publishers + docs
        → authenticated release center
          → same-origin deployment
            → parity gate
              → authorized cutover
                → delete old client
```

- Review after Task 3: API and security owners confirm the UI contract contains no retired endpoints.
- Review after Task 5: product review confirms package pages make the next action obvious for all three package kinds.
- Review after Task 8: publisher review confirms key and CLI guidance is convenient without duplicating publication logic.
- Review after Task 10: accessibility and operations review confirms the app is ready to shadow production.
- Review before Task 11: explicit user authorization for deployment mutation and deletion.
- Final review after Task 11: reject completion if any second pckg web shell, API client, route tree, image build, or compatibility path remains.

## Definition of Done

- `beskid_sites/apps/pckg` is fully tracked, reproducible, and covered by root CI.
- Public package discovery, details, downloads, publishers, reviews, and docs meet or exceed `pckg/web` behavior.
- A publisher can sign in, see owned packages, create/revoke a key, copy local/CI publication commands, inspect releases, and perform authorized lifecycle actions.
- The app never asks users to upload an artifact through a second browser-only protocol.
- Documentation deep links survive reload and navigation; malformed or missing docs degrade safely.
- Anonymous routes remain anonymous; dashboard routes fail closed without verified identity.
- Production Compose keeps database/artifact authority in the Rust service and exposes one public pckg origin.
- Browser, contract, security, build, Docker, and deployment-configuration gates pass.
- `pckg/web`, `@beskid/pckg-web`, its route tree, its API client, and all build/test/package-sync references are deleted after cutover approval and evidence.
- `beskid_sites/apps/pckg` is the only pckg web implementation; future web features have one canonical destination.
- Changelogs and contributor documentation describe the final single-implementation architecture.
