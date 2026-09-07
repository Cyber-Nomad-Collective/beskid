# Service: pckg/web

> Original research for migrating the pckg registry frontend (`pckg/web/`)
> into the `beskid_sites/` TanStack Start workspace. The research below
> informed the migration; the migration is **DONE** — see Current Status.

## Current Status

**Migration: DONE.** `apps/pckg/` is a live TanStack Start app deployed at
`pckg.beskid-lang.org` behind the Coolify proxy with Caddy labels.

- **Deployed:** yes — `pckg.beskid-lang.org` (production), via Coolify proxy
  + Caddy labels. Image built from `beskid_sites/apps/pckg/`.
- **What's working:**
  - TanStack Start rewrite; `PckgApiClient` lifted verbatim from
    `pckg/web/src/lib/pckg-api.ts` with its contract tests intact.
  - Docs mode + pckg mode with the `AnimatedModeSwitcher`
    (framer-motion) — the original bespoke top nav / hardcoded sidebar are
    replaced by the shell template (`shell-core`).
  - Community surfaces **removed**; NodeBB handles discussion
    (`community.beskid-lang.org`, see `nodebb-research.md`). The pckg →
    NodeBB Write API provisioning flow is designed (idempotent subforum
    creation per package publish; "Discuss" link on the package detail
    page) and will be wired in master Plan Phase 2.
  - Rust backend refactored: community code removed, Authelia forward-auth
    contract matched to the OIDC client model, `PckgApiClient` contract
    preserved. `.NET` pckg code removed from the repo.
  - Package detail + publisher profile pages preserved per
    `pckg-detail-pages-research.md` (hero + facts card + versions list +
    community reviews; publisher hero + follow + package grid; self-profile
    editor). README + dependencies surfacing and shadcn `Select`/`Form`
    upgrades are part of the rewrite.
- **Pending:**
  - Auth: runs with `SHELL_AUTH_MODE=mock` until Authelia is live (master
    Plan Phase 1). The pckg Rust backend currently mints/validates its own
    session cookie; the cutover to trusting Authelia is gated on Authelia
    deployment.
  - NodeBB `community.beskid-lang.org` deployment + pckg → NodeBB
    provisioning wiring (master Plan Phase 2).
  - Cutover from Coolify to the standalone Caddy compose (master Plan
    Phase 3).
  - CI/CD migration to `cr.beskid-lang.org` + SSH deploy (master Plan
    Phase 6). Note: moving to `cr.beskid-lang.org` eliminates the
    GHCR-package-ownership wrinkle (`beskid-pckg` is linked to sibling repo
    `beskid_pckg`) — see `publish-migration.md` Migration Step 7.
- **Human steps needed:** none specific to this service beyond the
  cross-phase steps in the master Plan. If staying on Coolify for now, the
  `beskid-sites-pckg` image needs a Coolify service UUID + GHCR Write
  grant (human, fail closed). Under the `cr.beskid-lang.org` path these
  become unnecessary.

The phased approach and risks documented below were the planning basis; the
implementation is complete modulo the pending infra phases and the NodeBB
wiring.

---

Plan for migrating the pckg registry frontend (`pckg/web/`) into the new
`beskid_sites/` TanStack Start workspace. Research only — no code changes.

## Current architecture (framework, key deps, routing, data layer, build, deploy)

- **Framework / shape**: Vite SPA (no SSR) — `pckg/web/index.html` mounts
  `/src/main.tsx`, which wires `QueryClientProvider` + `RouterProvider`
  (`pckg/web/src/main.tsx:1`). React 19.2, Tailwind v4 via
  `@tailwindcss/vite` (`pckg/web/vite.config.ts:7`). `pnpm-workspace.yaml`
  declares a single self-package workspace (`pckg/web/pnpm-workspace.yaml`),
  i.e. it is **not** part of the monorepo root workspace.
- **Routing**: TanStack Router, **code-based** `createRoute` tree assembled in
  `pckg/web/src/router.tsx:63`. Public routes (`/`, `/onboarding`,
  `/packages`, `/packages/$packageName`, `/packages/$packageName/docs`,
  `/publishers`, `/publishers/$publisher`, `/topics`, `/topics/$topic`,
  `/board/post/$postId`, `/auth`, `/settings/auth/pair`) plus a guarded
  `/dashboard` subtree (`profile`, `notifications`, `api-keys`, `packages/my`,
  `packages/upload`, `admin/*`, `admin/boards`) — see
  `pckg/web/src/router.tsx:38` and `pckg/web/src/routes/dashboard.tsx:7`
  (the `beforeLoad` session guard).
- **Data layer**: a single hand-written typed fetch client,
  `PckgApiClient` (`pckg/web/src/lib/pckg-api.ts:225`, 634 lines). It is
  framework-agnostic: takes an injectable `fetch` + `baseUrl`, uses
  `credentials: "include"`, throws `PckgApiError(status)`. It enumerates the
  **entire pckg .NET API contract** (packages, versions, docs/source
  browsing, search, publishers, community boards/posts/comments/votes,
  follows, notifications, API keys, admin users/permissions/email-settings/
  registry-activity/blocked-links, Auth Hub pairing, bootstrap status).
  Backed by `pckg/web/src/lib/pckg-api.test.ts` (≈18 KB of contract tests
  with injected `fetch`). State in components is TanStack Query
  (`useQuery`/`useMutation`/`useQueryClient`); no global store.
- **Auth model**: GitHub login via an external **Auth Hub** (NOT Authelia).
  `pckg/web/src/lib/auth-navigation.ts:6` builds
  `https://auth…/login?app=pckg`; the browser is redirected out and back.
  pckg itself owns the session cookie (`/api/auth/session`), the first-user
  bootstrap (`/users/bootstrap-status`, `/onboarding/create` form POST in
  `pckg/web/src/routes/public.tsx:79`), and Auth Hub pairing
  (`/api/auth/hub/pairing-status`, `/api/auth/hub/pair` in
  `pckg/web/src/routes/account.tsx:62`). Service token + session secret live
  in pckg (`pckg/COOLIFY.md:27`).
- **Shell**: bespoke, inline. `pckg/web/src/routes/shared.tsx:21` renders a
  flat top nav (`BeskidHub` + links + Sign-in/Dashboard buttons) and an
  `<Outlet>`; `pckg/web/src/routes/dashboard.tsx:16` renders a **hardcoded
  sidebar `<aside>`** with a fixed link list. No reusable shell template, no
  collapsible sidebar primitive, no avatar dropdown — Sign-in/Dashboard are
  plain `Link`s.
- **Build / deploy**: multi-stage `pckg/Dockerfile`. `web-build` stage
  installs `beskid_web_common` + `pckg/web` (needs `NODE_AUTH_TOKEN` build
  ARG for `.npmrc`), runs `vite build`, and the `.NET` stage copies
  `pckg/web/dist/` into `/app/wwwroot/` (`pckg/Dockerfile:30`). The .NET
  `Server.dll` serves both API and the static SPA on port **8082**
  (`pckg/COOLIFY.md:40`). Coolify compose: `pckg` + `postgres` services, GHCR
  image `ghcr.io/cyber-nomad-collective/beskid-pckg:${IMAGE_TAG}` pinned by
  digest in the platform stack (`pckg/docker-compose.coolify.yml:14`).
- **Tests**: Vitest with **no `vitest.config`** (defaults). Three test files:
  `router.test.ts` (route-path contract), `auth-navigation.test.ts`, and the
  large `pckg-api.test.ts`.

## Coupling to beskid packages

`pckg/web/package.json:14` consumes two `file:` packages, kept in sync via
`./scripts/sync-beskid-packages.sh pckg/web`:

- **`@beskid/ui-react`** → shadcn primitives `ui/button`, `ui/card`,
  `ui/input`, `ui/badge`, plus `auth` (`AuthPageShell`), `graph`
  (`LinkedAstFactsView` + `sampleAst`/`sampleFacts`), `explorer`
  (`RepoExplorerDialog` + `sampleRepo`). Used across every route and in
  `pckg/web/src/components/package-source-graph-panel.tsx:1`.
- **`@beskid/beskid-ui`** → non-React package, used here only for
  `@beskid/beskid-ui/styles/hub.css` (`pckg/web/src/styles.css:7`) and the
  React entry `@beskid/beskid-ui/react/BeskidHub` (`pckg/web/src/routes/shared.tsx:1`).
  `vite.config.ts:14` also aliases `@beskid/material-theme` to
  `beskid-ui/src/styles/theme.material.css`.

`styles.css` further pulls `@beskid/ui-react/styles/shadcn-entry.css`,
`@source "../node_modules/@beskid/ui-react/src"` for Tailwind content, and
`@xyflow/react/dist/style.css` for the graph viewer. The target lib
`@cyber-nomad-collective/beskid-ui-react` (already present at
`beskid_sites/packages/beskid-ui-react/`) is a direct copy of the old
`beskid-ui-react` and **already exports `hub/BeskidHub.tsx`, `explorer`,
`graph`, `auth`, and the same `ui/*` + style exports** — so the import
surface maps 1:1; only the package name changes from `@beskid/*` to
`@cyber-nomad-collective/beskid-ui-react`. The non-React `@beskid/beskid-ui`
dependency (hub.css + BeskidHub) is already absorbed into the new lib
(`src/hub/`, `src/styles/hub.css`) per the target’s "purge non-React" rule,
so it can be **dropped entirely**.

## What moves cleanly (if anything)

- **`pckg/web/src/lib/pckg-api.ts` + `pckg-api.test.ts`** — the entire typed
  API client and its tests are pure TypeScript, framework-agnostic, and
  injectable. They drop into the new app verbatim (only the import path /
  package name for `PckgApiError` is unchanged). This is the single largest
  reusable asset.
- **`auth-navigation.ts` test shape** — `buildAuthHubLoginUrl` /
  `toDashboardGuardDestination` are tiny, but the Auth Hub target changes to
  Authelia (see rewrite). Only the *pattern* (a pure nav-helper module with
  unit tests) carries over; the implementation is rewritten.
- **`PackageSourceGraphPanel`** (`pckg/web/src/components/package-source-graph-panel.tsx:60`)
  — the only bespoke React component. It is thin glue over
  `@beskid/ui-react/explorer` + `graph` that already live in the shared lib.
  It can be lifted into `@cyber-nomad-collective/beskid-ui-react` as a
  generic "package artifact source/docs panel" (its only pckg-specific bits
  are the `PackageSourceEntry` shape and the GitHub repo ref constants).
  Low priority — it is shared with platform-spec/tracker repo-explorer UI
  per the workspace DRY guidance.
- **Route inventory** (`clientRoutePaths` in `pckg/web/src/router.tsx:38`)
  — usable as the migration checklist for the new file-based route tree.
- **TanStack Query usage patterns** in routes (query keys, invalidation
  callbacks) — idiomatic and portable; the query/mutation calls transfer
  directly since they sit on the unchanged `PckgApiClient`.

## What requires rewrite/redesign (itemize)

1. **App shell → shell template**. `pckg/web/src/routes/shared.tsx:21`
   (flat top nav) and `pckg/web/src/routes/dashboard.tsx:16` (hardcoded
   sidebar list) are deleted. Replaced by `beskid_sites/apps/shell-template`
   (TanStack Start + Nitro) with sidebar-items config, sidebar show/hide,
   topbar left/right nav-slots, and an avatar dropdown that shows user data
   when the sidebar is disabled. The current "Sign in / Dashboard"
   button pair becomes topbar right-slot entries; the dashboard `<aside>`
   link list becomes sidebar-items config.
2. **Routing → TanStack Start file-based routes**. Code-based
   `createRoute`/`addChildren` (`pckg/web/src/router.tsx:63`) becomes
   file-system routes under `src/routes/` with generated `routeTree.gen.ts`
   (mirror the tracker layout in `beskid_tracker/src/routes/`). The
   `beforeLoad` session guard (`pckg/web/src/routes/dashboard.tsx:10`)
   moves to a **server-side loader** (Nitro server function) that reads the
   Authelia session, not a client-side `pckgApi.getSession()` call.
3. **Auth model → Authelia**. Today pckg owns its session cookie, bootstrap,
   and Auth Hub pairing. The target uses Authelia (GitHub) + shared Postgres
  (website + Authelia). Concretely these pckg-owned flows are removed from
   the new frontend:
   - `/onboarding` first-admin form (`public.tsx:31`) and its
     `/onboarding/create` POST,
   - `/settings/auth/pair` Auth Hub pairing page (`account.tsx:62`),
   - `getBootstrapStatus`, `getAuthHubPairingStatus`, `pairWithAuthHub`
     client methods,
   - `buildAuthHubLoginUrl` (`auth-navigation.ts:6`).
   The `/auth` page becomes an Authelia redirect. **Open question**: does
   the pckg .NET backend still mint its own session cookie, or does it learn
   to trust Authelia headers? See Risks.
4. **Entry / SSR**. `index.html` + `main.tsx` → TanStack Start
   `app.config.ts`, `__root.tsx` (with `shellComponent`/`HeadContent`/server
   middleware, mirroring `beskid_tracker/src/routes/__root.tsx:1`),
   `src/server/` for Nitro. The static `data-theme="dark"` on `<html>` moves
   to a `ThemeProvider`.
5. **Form submission**. Several routes POST raw HTML forms to .NET-owned
   endpoints (`/onboarding/create` in `public.tsx:79`; the rest use
   `pckgApi` via `useMutation`). The bootstrap form goes away with Authelia;
   the rest already use the API client and port cleanly, but
   `package.tsx:202` uses a native `<select>`/`<form>` for the review form
   and `community.tsx`/`admin.tsx` use `FormData` reading — these should
   move to controlled shadcn `Select`/`Form` components from the shared lib
   for consistency with the shell template.
6. **Styling source**. `pckg/web/src/styles.css:3` `@source` and the
   `@beskid/beskid-ui/styles/hub.css` + `@beskid/material-theme` alias in
   `vite.config.ts:14` are rewritten to source from
   `@cyber-nomad-collective/beskid-ui-react/src` and its `styles/*` exports
   (`shadcn-entry.css`, `beskid-tokens.css`, `shadcn-theme.css`, `hub.css`).
   The bespoke `@theme inline` color mapping in `styles.css:14` is replaced
   by the lib’s theme tokens.
7. **Build / deploy split**. The Vite SPA is currently built inside the
   pckg .NET Dockerfile and served from `/app/wwwroot` (`pckg/Dockerfile:30`).
   In the new world pckg/web becomes its own Nitro image in
   `beskid_sites/apps/pckg`, deployed as a **separate Coolify service** that
   proxies API calls to the pckg .NET service on port 8082. The .NET
   `Dockerfile` web-build stage is removed; `pckg/docker-compose.coolify.yml`
   drops the wwwroot copy and gains a sibling frontend service.
8. **API origin / cookies**. `PckgApiClient` defaults `baseUrl` to
   `location.origin` and sends `credentials: "include"` (`pckg-api.ts:233`,
   `:610`). Once the Nitro app and the .NET API are on different origins,
   this needs either a Nitro dev/proxy + same-site production domain, or
   server-side fetch from Nitro with the session forwarded. This is a real
   contract change to the client’s default behaviour.
9. **`PackageSourceGraphPanel` fixture data**. It renders `sampleAst` /
   `sampleFacts` ("fixture until live models exist",
   `package-source-graph-panel.tsx:90`). Decide whether to keep the fixture
   in the new shared lib or wire real compiler models when available.

## Risks & unknowns

- **Authelia ↔ pckg session ownership (biggest unknown).** pckg’s .NET
  backend currently mints and validates its own session cookie
  (`PCKG_SESSION_SECRET`, `/api/auth/session`). The target wants Authelia +
  shared Postgres to be the identity authority. Unless the .NET backend is
  changed to trust Authelia headers/cookies, the new frontend cannot simply
  drop `/api/auth/*` — it would lose session enforcement for `/api/admin/*`
  and `/api/packages?owner=me`. **Needs a backend decision before phase 2.**
- **API origin separation.** Same-origin `credentials:"include"` cookie
  semantics break when the frontend moves off the .NET origin. Requires a
  proxy strategy (Nitro route handler or shared domain) — affects the
  `PckgApiClient` default and every admin/dashboard call.
- **Bootstrap flow deletion.** `/onboarding` + `/onboarding/create` is a
  server-rendered .NET endpoint, not pure JSON. Removing it from the
  frontend means the first-superadmin provisioning must move to Authelia or
  a .NET CLI/seed step. Confirm with backend.
- **Tailwind v4 content roots.** `@source` paths and the
  `@beskid/material-theme` Vite alias must be repointed; getting this wrong
  silently drops styles for shared components.
- **`@beskid/beskid-ui` non-React purge.** `BeskidHub` and `hub.css` already
  live in the new React-only lib, but the old `@beskid/beskid-ui` package
  also ships `book/`, `platform-spec/`, `starlight/`, `client/`, `data/`
  surfaces. Confirm none of pckg/web transitively depends on those (a quick
  grep shows only `react/BeskidHub` + `styles/hub.css` are used, so this
  looks safe).
- **Coolify service UUID / GHCR grant.** Per learned workspace facts, do
  not invent a Coolify service UUID or GHCR Write grant for a new
  `beskid-sites-pckg` image — fail closed and document the human admin step.
- **Test runner.** pckg/web has no `vitest.config`; the new workspace uses
  `biome` + per-package `vitest.config.ts` (see
  `beskid_sites/packages/beskid-ui-react/vitest.config.ts`). The migrated
  `pckg-api.test.ts` needs a Vitest config that matches the workspace
  convention (jsdom env, etc.).
- **`@tanstack/*` version drift.** pckg/web pins `@tanstack/react-router
  ^1.170.8` and `react-query ^5.100.14` directly; the new workspace uses a
  **catalog** (`beskid_sites/pnpm-workspace.yaml` → `tanstack-start`
  catalog pins `react-router 1.170.28`, `react-start 1.168.45`). The
  migrated app must adopt the catalog versions, which may require minor
  router API adjustments.

## Recommended phased approach (ordered steps)

1. **Confirm auth contract with backend.** Decide whether pckg .NET trusts
   Authelia (header/cookie) or keeps its own session. This gates phases 2–4.
   Document the exact `/api/auth/*` endpoints that the new frontend may
   drop.
2. **Scaffold `beskid_sites/apps/pckg` from the shell template.** Create the
   TanStack Start app (`app.config.ts`, `__root.tsx`, `src/server/`), wire
   `@cyber-nomad-collective/beskid-ui-react` + Tailwind v4 sourcing from the
   new lib, and add a `vitest.config.ts`. No routes yet.
3. **Port the data layer.** Copy `pckg/web/src/lib/pckg-api.ts` and
   `pckg-api.test.ts` verbatim into the new app; update the `baseUrl`
   default to read a Nitro env var (`PCKG_API_ORIGIN`) and keep
   `credentials:"include"`. Get the contract tests green.
4. **Port the shell + public routes.** Replace `shared.tsx`/`dashboard.tsx`
   with the shell template (sidebar items from the dashboard link list,
   topbar right-slot Sign-in/Dashboard, avatar dropdown with session data).
   Rebuild `/`, `/packages`, `/packages/$packageName`, `/packages/$packageName/docs`,
   `/publishers`, `/publishers/$publisher`, `/topics`, `/topics/$topic`,
   `/board/post/$postId` as file-based routes using the existing
   `useQuery`/`useMutation` calls (they are unchanged).
5. **Rebuild auth surface against Authelia.** Replace `/auth` with an
   Authelia redirect; delete `/onboarding`, `/settings/auth/pair`, and the
   `getBootstrapStatus`/`getAuthHubPairingStatus`/`pairWithAuthHub` client
   methods. Move the dashboard `beforeLoad` guard to a server loader.
6. **Port dashboard + admin routes.** Rebuild `/dashboard/*` and
   `/dashboard/admin/*` under the shell template’s sidebar; convert raw
   `FormData`/native `<select>` forms (e.g. `package.tsx:202`,
   `community.tsx`, `admin.tsx`) to shadcn `Form`/`Select` from the shared
   lib.
7. **Lift `PackageSourceGraphPanel` (optional, DRY).** Move it into
   `@cyber-nomad-collective/beskid-ui-react` as a generic package-artifact
   panel once platform-spec/tracker confirm they want the same shape; keep
   the fixture data behind a prop until real compiler models exist.
8. **Split build & deploy.** Remove the web-build stage from
   `pckg/Dockerfile`; build the Nitro app in `beskid_sites/apps/pckg` to its
   own GHCR image; add a sibling frontend service to
   `pckg/docker-compose.coolify.yml` that proxies `/api/*` to the pckg
   .NET service on 8082. Fail closed on Coolify service UUID / GHCR Write
   grant — document the human admin step.
9. **Cutover.** Point `pckg.beskid-lang.org` at the new Nitro service; keep
   the old `pckg/web` build dark until the new app is verified in staging
   (`stg-` prefix per domain convention). Retire `pckg/web/` and the
   `@beskid/*` `file:` links once `beskid_sites/apps/pckg` is the only
   frontend.

## Verdict

**DONE — Total rewrite completed with a substantial reusable data-layer
core.** The shell, entry, routing, auth, and build/deploy were rewritten
(new framework, new shell, new auth, new deploy); the typed `PckgApiClient`
+ tests and the TanStack Query call sites ported near-verbatim, protecting
the backend contract. The community surface was removed in favor of NodeBB
(per `nodebb-research.md`); the Rust backend was refactored to match. The
remaining work is Authelia cutover (master Plan Phase 1), NodeBB wiring
(Phase 2), and registry/CI migration (Phase 6) — all infra-phase work
tracked in the master `Plan.md`.
