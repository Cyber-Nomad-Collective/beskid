# Service: beskid_tracker

> Original research-only plan for migrating the `beskid_tracker/` TanStack
> Start app into the new `beskid_sites/` workspace as a shell-template
> consumer. The tracker was the **donor** of the reusable shell template
> (extracted into `beskid_sites/apps/shell-template` + `packages/shell-core`);
> the remaining tracker-specific code was rebuilt on top of that template.
> The research below informed the migration; the migration is **DONE** —
> see Current Status.

## Current Status

**Migration: DONE.** `apps/tracker/` is a live TanStack Start app deployed
at `tracker.beskid-lang.org` behind the Coolify proxy with Caddy labels.

- **Deployed:** yes — `tracker.beskid-lang.org` (production), via Coolify
  proxy + Caddy labels. Image built from `beskid_sites/apps/tracker/`.
- **What's working:**
  - Shell extraction complete: the tracker's `app-shell.tsx`,
    `app-sidebar.tsx`, `theme-provider.tsx`, `theme-toggle.tsx`,
    `shell-versions-sync.tsx`, `router.tsx`, `__root.tsx`,
    `integrations/tanstack-query/*`, `observability-middleware.ts`,
    `metrics.ts`, `env.server.ts` skeleton, and `styles.css` base lifted
    into `packages/shell-core` + `apps/shell-template`.
  - SQLite data layer preserved as the task-tracking source of truth
    (`node:sqlite` `DatabaseSync`, schema v9, `tracker-data` volume).
    Per AGENTS.md learned facts and `README.md:5`, the tracker keeps SQLite
    (not Postgres) — the shell template's Postgres assumption is
    optional/pluggable, not a hard dependency.
  - Entire domain layer ported: repositories, services, mappers, taxonomy,
    import-catalog, reconciliation, history-backfill, sync-settings,
    roadmap/catalog/search, platform-spec integration, GitHub bug sync
    (bug-only per `README.md:5`; schema v6 deletes non-bug outbox/link rows).
  - Tracker-specific UI ported: roadmap-*, report-issue-dialog, kanban,
    timeline, version-board, work-item-shell, reui/*, issue/bug-detail
    sheets, etc. `#/components/ui/*` alias repointed at the new lib.
  - Auth-hub surfaces deleted (hub-finish, hub-settings encryption, pairing
    wizard, `hubUserToken` session, `hub-octokit` proxy, `@beskid/auth-client`
    dep, onboarding); Authelia OIDC added via the shell template.
  - `@beskid/beskid-ui` and `@cyber-nomad-collective/trudoc` dropped
    (latter was unused at runtime). `@beskid/server-observability` retained
    pending the workspace composition decision (tracked in master Plan).
- **Pending:**
  - Auth: runs with `SHELL_AUTH_MODE=mock` until Authelia is live (master
    Plan Phase 1). The tracker is the most auth-coupled consumer (pairing
    wizard, hub-settings encryption, `hubUserToken` in every server fn),
    so a flag-day cutover to Authelia is the cleanest path
    (`auth/Plan.md` Risk #3).
  - **`canManageRoadmap` semantics decision (open).** Today
    `src/lib/github/permissions.ts` + `requireMaintainer` call Octokit to
    check repo-owner/admin status on every board write and spec approval.
    Under Authelia, map to `beskid-admins` group (simpler, changes
    semantics) or keep "repo owner" semantics via a companion Octokit
    (decision needed before Phase 1 cutover).
  - **Avatar URL under Authelia.** Authelia headers do not include the
    GitHub avatar. The template falls back to
    `https://github.com/<username>.png`; the tracker's avatar dropdown and
    `ReportIssueDialog` attribution depend on this.
  - **Webhook ingress under forward-auth.** `/api/webhooks/github.ts`
    receives GitHub issue webhooks (HMAC-signed, no session). The deploy
    must exempt `/api/webhooks/*` (and `/api/v1/*`, `/metrics`,
    `/api/health`) from forward-auth — confirm with `beskid_infra`/Caddy
    config (audit concern, master Plan Phase 3).
  - **Public vs authenticated routes.** `/` (timeline) and `/bugs` are
    public; kanban/workstreams require sign-in. The template must support
    per-route public/guarded flags so the tracker keeps its mixed
    visibility.
  - Cutover from Coolify to the standalone Caddy compose (master Plan
    Phase 3).
  - CI/CD migration to `cr.beskid-lang.org` + SSH deploy (master Plan
    Phase 6).
  - OpenSpec change retiring `tooling--auth-hub--*` (master Plan Phase 1).
  - Seed data + catalog revision: the `tracker-data` volume must carry
    over the existing SQLite file on cutover (no re-seed from JSON unless
    intended).
- **Human steps needed:** none specific to this service beyond the
  cross-phase steps in the master Plan. If staying on Coolify for now, the
  `beskid-sites-tracker` image needs a Coolify service UUID + GHCR Write
  grant (human, fail closed). Under the `cr.beskid-lang.org` path these
  become unnecessary.

The phased approach and risks documented below were the planning basis; the
implementation is complete modulo the pending infra phases and the
`canManageRoadmap` semantics decision.

---

Research-only plan for migrating the `beskid_tracker/` TanStack Start app
into the new `beskid_sites/` workspace as a shell-template consumer. The
tracker is the **donor** of the reusable shell template — its shell code is
extracted into `beskid_sites/apps/shell-template`, and the remaining
tracker-specific code is rebuilt on top of that template. All claims are
grounded in files under `beskid_tracker/`, `beskid_web_common/packages/`, and
`beskid_sites/`. No code changes.

## Current architecture

`beskid_tracker` is a TanStack Start (React 19 + Nitro `node-server`) app,
`package.json:1`, deployed as the Coolify `tracker` service on port 3000
(`docker-compose.yml:4`, `Dockerfile:1`). It is the **roadmap planner and bug
tracker** for the superrepo: a versioned catalog (`v0.1`–`v0.4`) of
deliverables, workstreams, and tasks, plus a public bug surface backed by
GitHub Issues. SQLite is the source of truth; GitHub Issues sync is limited
to bugs (`README.md:5`).

Surface inventory (all paths under `beskid_tracker/`):

- **Entry / SSR** — `src/router.tsx:9` (`getRouter`) wires TanStack Router +
  `setupRouterSsrQueryIntegration`. `src/routes/__root.tsx:32` is the root
  route: `ThemeProvider` + `QueryClientProvider` + `TooltipProvider` +
  `observabilityMiddleware` + TanStack devtools, head title `Beskid Tracker`.
  `src/integrations/tanstack-query/root-provider.tsx:3` (`getContext`) mints
  the `QueryClient`; `devtools.tsx:1` registers the React Query devtools panel.
- **Shell** — `src/components/app-shell.tsx:93` (`AppShell`) wraps
  `SidebarProvider` + `AppSidebar` + `SidebarInset` with a fixed topbar that
  renders `RoadmapGlobalSearch`, `TrackerSettingsHeaderButton`, and
  `BeskidHub`, and a body that mounts `TrackerSettingsDialog`.
  `src/components/app-sidebar.tsx:52` (`AppSidebar`) renders the
  `SidebarHeader` (Beskid/Tracker branding + favicon), `SidebarContent`
  (Roadmap / Bugs / Platform spec links, `RoadmapNavTree`, `ReportIssueDialog`),
  and `SidebarFooter` (`ThemeToggle` + avatar dropdown with a `POST /api/auth/logout`
  form, or a "Sign in with GitHub" link). `src/components/shell-versions-sync.tsx:19`
  (`ShellUiProvider`/`useShellUi`/`ShellVersionsSync`) is a tiny context that
  pushes the route's delivery version id into the sidebar.
- **Theming** — `src/components/theme-provider.tsx:11` (`ThemeProvider`,
  `next-themes`, `data-theme` attribute) and `src/components/theme-toggle.tsx:9`
  (`ThemeToggle`). `src/styles.css:1` is the Tailwind v4 entry: imports
  `shadcn/tailwind.css`, `@beskid/ui-react/styles/shadcn-entry.css`,
  `@beskid/beskid-ui/styles/hub.css`, app-specific `styles/svar-filter-theme.css`,
  `styles/roadmap-app.css`, `styles/work-item-form.css`, and a `@theme inline`
  color mapping; `@source "../node_modules/@beskid/ui-react/src"` for shadcn
  utilities. `src/styles/beskid-tokens.css:4` imports `@beskid/material-theme`.
- **Observability** — `src/observability-middleware.ts:7` (`@beskid/server-observability`,
  service label `beskid-tracker`) records per-request HTTP metrics;
  `src/routes/metrics.ts:7` exposes `/metrics` via `metricsHandler`.
- **Env** — `src/env.server.ts:6` (`@t3-oss/env-core`) validates
  `AUTH_HUB_PUBLIC_URL`, `SESSION_SECRET`, `GITHUB_REPO_OWNER/NAME`,
  `AUTH_HUB_SECRET`, `GITHUB_PUBLIC_READ_TOKEN`, `GITHUB_SYNC_TOKEN`,
  `TRACKER_PAIRING_APPROVER_LOGIN`, `TRACKER_SETUP_TOKEN`, `TRACKER_DATA_DIR`,
  `TRACKER_PUBLIC_URL`, `GITHUB_OAUTH_CALLBACK_URL`, `GITHUB_WEBHOOK_SECRET`,
  `NODE_ENV`, `LOG_LEVEL`.
- **Auth (bespoke hub, NOT Authelia)** —
  - `src/routes/api/auth/github.ts:7` redirects to the auth hub `/login?app=tracker`.
  - `src/routes/api/auth/hub-finish.ts:12` verifies the handoff JWT via
    `@beskid/auth-client` `verifyHandoffToken`, then seals a session cookie
    (`src/lib/session/cookie.ts:7`, cookie `beskid_tracker_session`, HS256 JWT
    signed with `SESSION_SECRET`, 7d TTL, claims `{ login, avatarUrl, name,
    hubUserToken, hubSessionId }`) and redirects to `/v/v0.2`.
  - `src/routes/api/auth/logout.ts:5` clears the cookie.
  - `src/server/auth.server.ts:6` (`resolveAuthUser`) + `src/server/auth.ts:6`
    (`getAuthUser` server fn) read the session.
  - `src/server/auth-guard.server.ts:10` (`requireSession`,
    `authMiddleware`, `withOctokit`, `withAuth`, `withAuthUser`,
    `requireMaintainer`) enforce session + repo-maintainer checks via
    `canManageRoadmap` (`src/lib/github/permissions.ts`).
  - `src/lib/auth/hub-handoff.server.ts:13` (`verifyHubHandoff`,
    `authHubLoginUrl`) wraps `@beskid/auth-client` `verifyHandoffToken` /
    `buildLoginUrl`.
  - `src/lib/auth/hub-settings.server.ts:68` (`getAuthHubUrl`,
    `getAuthHubServiceToken`, `saveAuthHubPairing`, `isAuthHubPaired`) stores
    the encrypted hub service token + approver login in the SQLite
    `app_settings` table (AES-256-GCM, key scrypt'd from `SESSION_SECRET`).
  - `src/lib/auth/hub-pairing-flow.server.ts:73` (`approveAuthHubPairing`,
    `completeAuthHubPairing`) + `src/server/auth-hub-pairing.server.ts:58`
    (`getAuthHubPairingStatus`) + `src/server/auth-hub-setup.server.ts:37`
    (`submitAuthHubSetup`) drive the pairing wizard
    (`src/components/auth-hub-setup-wizard.tsx`, `src/routes/settings/auth/pair.tsx`,
    `src/routes/api/admin/auth/pair.ts`, `src/routes/onboarding.tsx` alias).
  - `src/lib/github/hub-octokit.server.ts:8` (`createHubOctokit`) builds an
    `@octokit/rest` instance pointed at the hub's GitHub proxy
    (`githubProxyBaseUrl(hubUrl)`) using the `hubUserToken` — GitHub access
    tokens never leave the hub.
- **GitHub integration (bugs only)** — `src/lib/sync/*`
  (`github-webhook-config.ts`, `github-webhook-provision.ts`,
  `github-webhook.ts`, `sync-octokit.ts`, `sync-run-repository.ts`) +
  `src/routes/api/webhooks/github.ts` (inbound webhook) +
  `src/lib/tracker/github-export-service.ts` / `github-inbound-service.ts` /
  `process-outbox.ts` (outbox drain) + `src/server/sync.ts:18`
  (`getSyncSettingsFn`, `updateSyncSettingsFn`, `triggerGithubExportFn`) +
  `src/server/github-sync-settings.ts`. Roadmap tasks never sync to GitHub
  (`README.md:5`, schema v6 in `src/lib/storage/schema.ts:139` deletes
  non-bug outbox/link rows).
- **Data layer (SQLite, source of truth)** — `src/lib/storage/sqlite.ts:36`
  (`openSqlite`) wraps `node:sqlite` `DatabaseSync` (drop-in for the retired
  `bun:sqlite`). `src/lib/storage/db.ts:10` (`getIssuesDatabase`) is a
  migrating singleton. `src/lib/storage/schema.ts:5` (`SCHEMA_VERSION = 9`,
  `migrateSchema`) owns tables: `app_settings`, `tracker_versions`,
  `tracker_workstreams`, `tracker_deliverables`, `tracker_tasks`,
  `tracker_task_subtasks`, `tracker_task_spec_relations`, `tracker_bugs`,
  `github_issue_links`, `github_sync_outbox`, `sync_settings`, `sync_runs`,
  `sync_log_lines`, `spec_proposals`, `spec_proposal_changes`. `src/lib/storage/paths.ts:8`
  (`trackerDataDir` → `data/runtime/issues.sqlite`, env-overridable). Volume
  `tracker-data` mounted at `/app/beskid_tracker/data/runtime`
  (`docker-compose.yml:31`).
- **Domain / repositories / services** — `src/lib/tracker/*` (139-line barrel
  `index.ts:1`): `repositories/` (`bugs-repository.ts`,
  `github-links-repository.ts`, `outbox-repository.ts`,
  `sync-settings-repository.ts`, `tasks-repository.ts`,
  `versions-repository.ts`), `task-service.ts`, `bug-service.ts`,
  `read-service.ts`, `mappers.ts`, `taxonomy.ts`, `import-catalog.ts`,
  `reconciliation.ts`, `history-backfill.ts`, `sync-settings.ts`, `types.ts`.
- **Roadmap / catalog / search** — `src/lib/roadmap/*` (`build-catalog.ts`,
  `build-search-index.ts`, `meta-search.ts`, `meta-search-query.ts`,
  `filter-query-bridge.ts`, `scope-route-options.tsx`, `subtasks.ts`,
  `types.ts`, etc.) + `src/lib/seed/*` (Zod schemas, disk loader, mappers) +
  `src/server/catalog.ts:13` / `catalog.server.ts` (build the in-memory
  catalog from SQLite or seed JSON).
- **Platform-spec integration** — `src/lib/platform-spec/*` (catalog URL,
  nav tree, OpenSpec catalog parse, relations, suggestions) +
  `src/server/platform-spec.ts` / `platform-spec.server.ts`.
- **Server fns** — `src/server/roadmap.ts:9` (board, workstream dashboard,
  create issue, approve spec, session info), `src/server/issues.ts:12`
  (get/move/update issue), `src/server/public-bugs.ts:22` (list/create bugs,
  stats, sync trigger), `src/server/catalog.ts`, `src/server/sync.ts`,
  `src/server/auth.ts`, `src/server/auth-hub-pairing.ts`,
  `src/server/auth-hub-setup.ts`, `src/server/catalog-import.ts`,
  `src/server/github-sync-settings.ts`.
- **Routes** — `src/routes/_shell.tsx:5` is the shell layout route
  (`beforeLoad` resolves hub pairing, auth user, catalog, search index,
  `canManageRoadmap`; renders `AppShell`). `src/routes/_shell/*`: `index.tsx`
  (timeline home), `bugs.tsx` (public bug list), `v/$version.tsx` + `v/$version/w/$workstream`
  (kanban boards, auth-required), `versions/$version/index.tsx` (version
  overview) + `versions/$version/{deliverables,milestones,workstreams,area,domain,feature}`,
  `workstreams/v/$version`, `docs/index.tsx`. Plus `login.tsx`, `onboarding.tsx`,
  `settings/auth/pair.tsx`, `metrics.ts`, and `api/*` (`auth/*`, `admin/*`,
  `v1/{tasks,delivery,links}`, `webhooks/github`, `health`).
- **Tracker-specific UI** — `src/components/roadmap-*` (nav-tree, global-search,
  meta-search-bar, kanban-board, timeline-home, version-switcher,
  scope-task-list, scope-page, stat-widgets, react-filter-bar, not-found,
  route-error, catalog-dashboard-actions/task-list), `tracker-settings-dialog.tsx`
  (uses `@beskid/ui-react/settings` registry for GitHub bug sync + webhook +
  catalog import), `report-issue-dialog.tsx` + `tracker-report-form.tsx` +
  `report-form-layout.tsx` + `report-fields/*`, `catalog-import-dialog.tsx`,
  `github-webhook-settings-panel.tsx`, `github-rate-limit-alert.tsx`,
  `auth-hub-setup-wizard.tsx`, `work-item-shell/*` (dialog/pane/page
  presentation), `reui/kanban.tsx` + `reui/timeline.tsx`, `issue-detail-sheet.tsx`,
  `bug-detail-sheet.tsx`, `create-task-*`, `spec-link-*`, `version-board-view.tsx`,
  `markdown-content.tsx`, `public-bug-list.tsx`, `board-filter-panel.tsx`.
- **Shared packages consumed** (`package.json:25`) — all `file:` links to
  `beskid_web_common`, kept in sync via `./scripts/sync-beskid-packages.sh beskid_tracker`
  (`package.json:23`):
  - `@beskid/ui-react` — shadcn `ui/*` primitives (via `#/components/ui/*`
    tsconfig path alias, `tsconfig.json:10`), `settings` registry
    (`tracker-settings-dialog.tsx:4`), `auth` `AuthPageShell` (`login.tsx:1`).
  - `@beskid/beskid-ui` — non-React package, used **only** for
    `@beskid/beskid-ui/react/BeskidHub` (`app-shell.tsx:3`) and
    `@beskid/beskid-ui/styles/hub.css` (`styles.css:15`).
  - `@beskid/auth-client` — handoff JWT (`verifyHandoffToken`,
    `buildLoginUrl`, `approveAuthHubPairing`, `githubProxyBaseUrl`,
    `BeskidAuthClient`) in `lib/auth/*` and `server/auth-hub-pairing.server.ts`.
  - `@beskid/server-observability` — `observability-middleware.ts:3`,
    `routes/metrics.ts:3`.
  - `@cyber-nomad-collective/trudoc` — declared in `package.json:31` and
    aliased in `vite.config.ts:30`, but **no source file imports it**; the
    only occurrence is the literal string `"trudoc"` as a taxonomy label
    (`src/lib/tracker/taxonomy.ts:212`). Effectively unused at runtime.
- **Vite / TS resolution** — `vite.config.ts:33` declares an 11-entry
  `resolve.alias` array that maps `@beskid/ui-react`, `@beskid/beskid-ui`,
  `@beskid/auth-client`, `@beskid/material-theme`, `trudoc`, and the `#/...`
  shadcn shortcuts to source paths inside `beskid_web_common`.
  `vite.resolve-beskid-packages.ts:10` (`packageRoot`/`packageSrc`) resolves
  installed package roots from `node_modules` (never workspace `file:` links).
  `tsconfig.json:7` mirrors the `#/*` and `#/components/ui/*` paths.
- **Build / deploy** — `Dockerfile:1` multi-stage: installs `beskid_web_common`
  + tracker (needs `NODE_AUTH_TOKEN` build ARG for `.npmrc`), `vite build` →
  Nitro `.output`, `node .output/server/index.mjs` on port 3000. Coolify
  compose `docker-compose.yml:1`, GHCR image, `tracker-data` volume,
  `scripts/sync-root-stylesheet.sh` post-build. `.npmrc:1` points
  `@beskid` + `@cyber-nomad-collective` at `npm.pkg.github.com`.

## Shell extraction (what is being extracted into the shared template — confirm the donor surface)

The tracker is the **donor**. The following surfaces are shell-generic and
move into `beskid_sites/apps/shell-template` (with the tracker-specific
injections parameterized). Each is confirmed against the target architecture
(sidebar items, sidebar show/hide, topbar nav-slot services left + right,
avatar dropdown with user data when sidebar disabled, Authelia auth, tests).

| Tracker file | Donor surface | What stays tracker-specific |
|---|---|---|
| `src/components/app-shell.tsx:93` | `SidebarProvider` + `SidebarInset` + fixed topbar + body layout. The **structure** is the template; the **slots** are tracker-injected. | The topbar left slot (`<p> Beskid / Tracker</p>` breadcrumb) and right slot (`RoadmapGlobalSearch`, `TrackerSettingsHeaderButton`, `BeskidHub`) + the `TrackerSettingsDialog` body mount are tracker-specific. Template exposes `topbarLeft`/`topbarRight` slot render props. |
| `src/components/app-sidebar.tsx:52` | `Sidebar` shell (`SidebarHeader` branding, `SidebarContent` items, `SidebarFooter` with `ThemeToggle` + avatar dropdown + `POST`-sign-out form / sign-in link). The avatar dropdown reading `user.login`/`user.avatarUrl` is the template primitive. | The item list (Roadmap / Bugs / Platform spec links, `RoadmapNavTree`, `ReportIssueDialog`) and the "Beskid / Tracker" branding text. Template exposes a `sidebarItems` config + optional `sidebarFooter` override; the avatar dropdown becomes a template primitive fed by the Authelia `AuthUser`. |
| `src/components/theme-provider.tsx:11` | `next-themes` `ThemeProvider` (`data-theme`, system default). **Fully generic, lifts verbatim.** | — |
| `src/components/theme-toggle.tsx:9` | `ThemeToggle` (mounted-guarded `Button`). **Fully generic, lifts verbatim.** | — |
| `src/components/shell-versions-sync.tsx:19` | The `ShellUiProvider`/`useShellUi` context + `ShellVersionsSync` push pattern. Generic as a **shell-ui context** the template exposes for per-route shell state. | The `version` field name is tracker-specific; the template should expose a generic `ShellUiContext<T>` so the tracker keys it on `version` and other apps on something else. |
| `src/router.tsx:9` | TanStack Router + `setupRouterSsrQueryIntegration` + `defaultPreload`/`defaultPreloadStaleTime`. **Generic setup.** | `RoadmapNotFound`/`RoadmapRouteError` as default not-found/error components are tracker-specific; template provides generic defaults and lets the app override. |
| `src/routes/__root.tsx:32` | Root route: `ThemeProvider` + `QueryClientProvider` + `TooltipProvider` + server `observabilityMiddleware` + `HeadContent`/`Scripts` + devtools. **Generic shell root.** | Head title `Beskid Tracker`, the `RoadmapNotFound`/`RoadmapRouteError` wiring, and the specific devtools plugin set. Template parameterizes title + not-found/error. |
| `src/integrations/tanstack-query/root-provider.tsx:3` + `devtools.tsx:1` | `getContext` (`QueryClient`) + devtools panel registration. **Fully generic, lifts verbatim.** | — |
| `src/observability-middleware.ts:7` | HTTP metrics middleware via `@beskid/server-observability`. **Generic middleware; only the service label is app-specific.** Template wires it with a per-app `service` label. | `service: "beskid-tracker"` label. |
| `src/routes/metrics.ts:7` | `/metrics` handler. **Generic route; template includes it.** | — |
| `src/env.server.ts:6` | `@t3-oss/env-core` validation shape. **Generic pattern; template provides the scaffolding.** | The specific env keys (hub, GitHub, tracker data dir). Template exposes an `extendEnv` hook. |
| `src/styles.css:1` | Tailwind v4 entry + `@beskid/ui-react/styles/shadcn-entry.css` + `@beskid/beskid-ui/styles/hub.css` + `@theme inline` mapping + `@custom-variant dark`. **Generic theme scaffolding.** | App-specific `styles/svar-filter-theme.css`, `styles/roadmap-app.css`, `styles/work-item-form.css` imports and the `@source` path. Template provides the base; apps append their own `@import`s. |
| `src/styles/beskid-tokens.css:4` | `@beskid/material-theme` import. Already absorbed into the new lib (`beskid_sites/packages/beskid-ui-react/src/styles/beskid-tokens.css`). | — |

**Confirmed donor surface = 12 files** (the 10 named in the task brief plus
`metrics.ts` and the `tanstack-query` integration). The avatar dropdown in
`app-sidebar.tsx:252` is the canonical implementation of the target's
"avatar dropdown with user data when sidebar disabled" — it must lift as a
template primitive, parameterized on the `AuthUser` shape (which becomes the
Authelia-derived shape, see auth Plan.md).

## What moves cleanly (tracker-specific app code reusing the template)

Once the shell is extracted, the **tracker-specific** code that moves into
the new `beskid_sites/apps/tracker` app with minimal change:

- **Entire SQLite data layer** — `src/lib/storage/*` (`sqlite.ts`, `db.ts`,
  `paths.ts`, `schema.ts`, `app-settings-repository.ts`, `stored-issue.ts`),
  `src/lib/tracker/*` (repositories, services, mappers, taxonomy, import,
  reconciliation, history-backfill, sync-settings, types), `src/lib/seed/*`,
  `src/lib/sync/*`. These are pure server-only modules with no shell
  coupling and no `@beskid/*` runtime deps (they use `node:sqlite` + `@octokit/rest`
  + `zod`). They drop in verbatim, modulo the auth/octokit rewiring below.
- **Roadmap / catalog / search domain** — `src/lib/roadmap/*`,
  `src/server/catalog.ts`, `catalog.server.ts`, `catalog-import.ts`,
  `src/lib/platform-spec/*`, `src/server/platform-spec.ts` /
  `platform-spec.server.ts`. Framework-agnostic server fns; the only change
  is the auth guard they call into.
- **GitHub bug sync** — `src/lib/github/*` (`roadmap-labels.ts`, `labels.ts`,
  `mappers.ts`, `bug-mappers.ts`, `filters.ts`, `permissions.ts`,
  `version-release.ts`, `request-cache.ts`, `issue-attachments.ts`,
  `github-errors.ts`, `octokit.ts`, `read-octokit.ts`), `src/lib/sync/*`,
  `src/server/sync.ts`, `github-sync-settings.ts`, `src/routes/api/webhooks/github.ts`,
  `src/routes/api/v1/{tasks,delivery,links}/*`. The Octokit factory
  (`hub-octokit.server.ts`) is rewired (below), but the bug sync logic itself
  is unchanged.
- **Server fns for roadmap/issues/public-bugs** — `src/server/roadmap.ts`,
  `issues.ts`, `public-bugs.ts`. The `withAuth`/`withOctokit`/`requireMaintainer`
  calls inside them are the only touch point; those helpers get new
  implementations in the template.
- **Tracker-specific UI components** — all `src/components/roadmap-*`,
  `tracker-settings-dialog.tsx`, `report-issue-dialog.tsx` + `tracker-report-form.tsx`
  + `report-form-layout.tsx` + `report-fields/*`, `catalog-import-dialog.tsx`,
  `github-webhook-settings-panel.tsx`, `github-rate-limit-alert.tsx`,
  `work-item-shell/*`, `reui/*`, `issue-detail-sheet.tsx`, `bug-detail-sheet.tsx`,
  `create-task-*`, `spec-link-*`, `version-board-view.tsx`, `markdown-content.tsx`,
  `public-bug-list.tsx`, `board-filter-panel.tsx`. These import the shared
  `ui/*` primitives via `#/components/ui/*`; that alias is preserved
  (pointed at the new `@cyber-nomad-collective/beskid-ui-react`), so the
  imports transfer with only the package-name resolution change.
- **Routes** — `src/routes/_shell/*` (the route tree), `login.tsx`, `metrics.ts`,
  `api/v1/*`, `api/webhooks/*`, `api/health.ts`. The `_shell.tsx` layout route
  is rewritten to use the template's `AppShell` (passing sidebar-items config
  + topbar slot renderers), but its `beforeLoad` (resolve user, catalog,
  search index, canManage) is tracker-specific and stays.
- **Tests** — `vitest.config.ts`, `src/components/task-display.test.tsx`,
  `src/lib/**/*.{test,spec}.ts` (bug-only-github-sync, delivery-contract,
  history-backfill, import-catalog, reconciliation, subtasks, task-display,
  tracker-domain, version-release, filter-values, fields, open-spec-catalog,
  parse, suggestions), `src/routes/api/v1/delivery/delivery-api.test.ts`,
  `src/routes/api/v1/-tasks.test.ts`. These are domain tests and port
  unchanged.

**What is NOT tracker-specific and does NOT move into the app** (already in
the template): `app-shell.tsx`, `app-sidebar.tsx`, `theme-provider.tsx`,
`theme-toggle.tsx`, `shell-versions-sync.tsx`, `router.tsx`, `__root.tsx`,
`integrations/tanstack-query/*`, `observability-middleware.ts`, `metrics.ts`,
`env.server.ts` (skeleton), `styles.css` (base).

## What requires change (auth → Authelia, data layer, package resolution)

1. **Auth → Authelia (largest change).** Per the auth Plan.md, the bespoke
   hub is retired and Authelia (GitHub identity provider, forward-auth) becomes
   the identity authority, with a thin Postgres-backed GitHub-proxy companion
   for the "tokens never leave the hub" property. Tracker-specific surfaces
   that are **deleted**:
   - `src/routes/api/auth/github.ts`, `src/routes/api/auth/hub-finish.ts`,
     `src/routes/api/auth/pair.ts`, `src/routes/api/auth/me.ts` (if any),
     `src/routes/onboarding.tsx`, `src/routes/settings/auth/pair.tsx`,
     `src/routes/api/admin/auth/pair.ts`, `src/routes/api/admin/setup/*`.
   - `src/lib/auth/hub-handoff.server.ts`, `hub-pairing-flow.server.ts`,
     `hub-settings.server.ts`, `hub-pairing-handler.server.ts`.
   - `src/server/auth-hub-pairing.server.ts`, `auth-hub-pairing.ts`,
     `auth-hub-setup.server.ts`, `auth-hub-setup.ts`.
   - `src/components/auth-hub-setup-wizard.tsx`.
   - `src/lib/github/hub-octokit.server.ts` (replaced by a companion client).
   - The `hubUserToken` / `hubSessionId` fields in `src/lib/session/cookie.ts:14`
     and the `@beskid/auth-client` import. The whole session-cookie module is
     replaced by the shell-template Authelia middleware (reads `Remote-User`,
     `Remote-Groups`, `Remote-Email`, `Remote-Name`; optional `/api/verify`
     fallback per auth Plan.md §"Shell-template middleware").
   - `src/server/auth-guard.server.ts` is rewritten:
     `requireSession` → template `requireAuth`; `requireMaintainer` →
     `requireGroup('beskid-admins')` (or kept as a repo-owner check via the
     companion Octokit if the team prefers the existing `canManageRoadmap`
     semantics — open question); `withOctokit`/`withAuth`/`withAuthUser`
     build an Octokit from the **companion GitHub proxy** using the Authelia
     identity, not a handoff token.
   - `src/lib/auth/hub-settings.server.ts` stored the encrypted hub service
     token in `app_settings`. That table + the AES-256-GCM encryption of the
     service token is gone; if the companion needs an at-rest key it lives in
     OpenBao (`secret/beskid/production/github-proxy` per auth Plan.md), not
     in tracker SQLite.
   - `src/lib/github/hub-octokit.server.ts:8` (`createHubOctokit(hubUserToken)`)
     becomes a companion client that uses the caller's Authelia identity. The
     `githubProxyBaseUrl` import from `@beskid/auth-client` disappears.
   - `src/env.server.ts` drops `AUTH_HUB_PUBLIC_URL`, `AUTH_HUB_SECRET`,
     `GITHUB_OAUTH_CALLBACK_URL`, `TRACKER_PAIRING_APPROVER_LOGIN`,
     `TRACKER_SETUP_TOKEN`; gains `AUTHELIA_VERIFY_URL` (optional),
     `GITHUB_PROXY_ORIGIN` (companion base URL), and whatever the template
     requires for forward-auth.
   - `src/routes/login.tsx`'s "Sign in with GitHub" link (`/api/auth/github`)
     becomes an Authelia redirect (`/login` on the Authelia portal, or just
     relies on forward-auth 302). `AuthPageShell` is still used from the
     shared lib, but the sign-in href changes.
   - `src/routes/_shell.tsx:8` `getAuthHubPairingStatusFn` pairing check is
     removed; the `beforeLoad` just resolves the Authelia user + catalog +
     search index + canManage.
2. **Data layer — SQLite stays, NOT Postgres.** The target architecture says
   the template uses Postgres for **website + Authelia**. The tracker is the
   task-tracking source of truth and **keeps SQLite** (confirmed by
   `README.md:5`, AGENTS.md learned workspace facts: "Tracker SQLite DB is
   the task-tracking source of truth", and the `tracker-data` volume in
   `docker-compose.yml:31`). The tracker app reusing the template does **not**
   adopt Postgres for its domain data. Only the auth layer (Authelia) and the
   GitHub-proxy companion use Postgres. The `node:sqlite` `DatabaseSync`
   facade (`src/lib/storage/sqlite.ts:5`) and the v9 migration path
   (`src/lib/storage/schema.ts:5`) are preserved as-is. The `bun:sqlite` →
   `node:sqlite` migration is already done (`sqlite.ts:1` comment), so the
   new Nitro `node-server` preset keeps working. **Implication**: the tracker
   is the one shell-template consumer that ships a SQLite volume, so the
   template must not assume a Postgres-backed app database — any shared
   "app database" abstraction in the template must be optional/pluggable, not
   a hard Postgres dependency.
3. **Package resolution — `file:` → `workspace:*` + name change.** Today
   `package.json:25` declares five `file:../beskid_web_common/...` deps with
   elaborate Vite aliases (`vite.config.ts:33`, `vite.resolve-beskid-packages.ts`)
   and tsconfig paths (`tsconfig.json:7`). In `beskid_sites/`:
   - `@beskid/ui-react` → `@cyber-nomad-collective/beskid-ui-react: "workspace:*"`
     (the canonical lib already at `beskid_sites/packages/beskid-ui-react/`).
     Its `exports` map (`packages/beskid-ui-react/package.json:22`) already
     covers `./settings`, `./auth`, `./graph`, `./explorer`, `./styles/*`,
     `./ui/*`, `./lib/utils`, `./hooks/use-mobile` — a 1:1 superset of what
     the tracker imports. The `#/components/ui/*`, `#/lib/utils`,
     `#/hooks/use-mobile` tsconfig path aliases are repointed at the new
     lib's `src/`.
   - `@beskid/beskid-ui` → **dropped entirely**. Its only tracker usages
     (`@beskid/beskid-ui/react/BeskidHub` in `app-shell.tsx:3` and
     `@beskid/beskid-ui/styles/hub.css` in `styles.css:15`) are already
     absorbed into the new lib (`src/hub/BeskidHub.tsx`,
     `src/styles/hub.css` per `beskid_sites/DECISIONS.md` §2). `app-shell.tsx`
     is template-owned, so its `BeskidHub` import is rewritten in the
     template; the tracker app no longer imports `@beskid/beskid-ui` at all.
   - `@beskid/auth-client` → **dropped entirely** (Authelia retires handoff
     JWT; see auth Plan.md §"What Authelia replaces" —
     `verifyHandoffToken`, `buildLoginUrl`, `githubProxyBaseUrl`,
     `BeskidAuthClient` all become dead code).
   - `@beskid/server-observability` → either **ported into the template**
     (the middleware is small and generic) or kept as a published package the
     template depends on. Decision for the template author; the tracker just
     consumes whatever the template provides. The service label stays
     `beskid-tracker`.
   - `@cyber-nomad-collective/trudoc` → **dropped**. It is declared
     (`package.json:31`) and Vite-aliased (`vite.config.ts:30`) but **no
     source file imports it**; the only occurrence is the literal taxonomy
     label `"trudoc"` (`src/lib/tracker/taxonomy.ts:212`). The new app does
     not need it.
   - The `NODE_AUTH_TOKEN` build ARG + `.npmrc` GitHub Packages auth becomes
     unnecessary for the new app (the workspace lib is `workspace:*`, and
     the lib's only scoped reference is a CSS `@import "@beskid/material-theme"`
     resolved by the host Vite alias per `beskid_sites/DECISIONS.md` §3). The
     Dockerfile simplifies.
4. **Topbar nav-slot wiring.** The current `app-shell.tsx:56` hardcodes the
   topbar contents. Under the template, the tracker's `_shell.tsx` layout
   route passes: `topbarLeft` = Beskid/Tracker breadcrumb (or nothing),
   `topbarRight` = [`RoadmapGlobalSearch`, `TrackerSettingsHeaderButton`,
   `BeskidHub`] renderers. `RoadmapGlobalSearch` is tracker-specific (it
   searches the roadmap index) but its `CommandDialog` trigger pattern is
   generic — see "could lift" below.
5. **Sidebar-items config.** The current `app-sidebar.tsx` hardcodes Roadmap
   / Bugs / Platform spec + `RoadmapNavTree` + `ReportIssueDialog`. Under the
   template this becomes a `sidebarItems` config (static links) plus an
   optional `sidebarExtra` render prop for the dynamic `RoadmapNavTree` and
   the `ReportIssueDialog` trigger. The "sidebar disabled → topbar avatar
   dropdown" mode (target architecture) is a template feature the tracker
   can opt into for the `/bugs` and `/` public views (today the tracker
   already toggles `showRoadmapNav={!globalView}` in `app-shell.tsx:51` for
   `/bugs`; the template generalizes this to "sidebar hidden" → avatar
   dropdown in topbar).
6. **`canManageRoadmap` semantics.** `src/lib/github/permissions.ts`
   `canManageRoadmap` checks repo owner/admin via Octokit. Under Authelia this
   could become (a) an Authelia `beskid-admins` group check, or (b) kept as
   an Octokit call via the companion (preserving the "repo owner" semantics
   that `README.md:117` documents). This is a **semantics decision**, not a
   mechanical rewrite — see Risks.

## Risks & unknowns

1. **Authelia cutover gates the tracker.** The tracker cannot migrate to the
   template until the Authelia forward-auth + GitHub-proxy companion are live
   (auth Plan.md phases 1–3). The tracker is the most auth-coupled consumer
   (pairing wizard, hub-settings encryption, `hubUserToken` in every server
   fn). A flag-day cutover is cleanest; parallel-run is fragile (auth
   Plan.md Risk #3). **Blocker until auth Phase 3.**
2. **`canManageRoadmap` vs Authelia groups.** `src/lib/github/permissions.ts`
   + `requireMaintainer` (`src/server/auth-guard.server.ts:60`) currently
   call Octokit to check repo-owner/admin status on every board write and
   spec approval. Under Authelia, mapping this to `beskid-admins` group is
   simpler but changes the authorization semantics (group membership vs live
   repo role). If the team wants to preserve "repo owner" semantics, the
   companion Octokit must still answer `repos.getCollaboratorPermission` —
   which means the companion must hold a GitHub token with `repo` scope for
   the caller, not just identity. **Decision needed before phase 4.**
3. **Avatar URL under Authelia.** `app-sidebar.tsx:262` renders `user.avatarUrl`
   from the session. Authelia headers do not include the GitHub avatar (auth
   Plan.md Risk #2). The template's `AuthUser` must source `avatarUrl` from
   the companion (Postgres cache) or `github.com/<login>.png`. The tracker's
   avatar dropdown and `ReportIssueDialog` attribution both depend on this.
4. **SQLite volume + template deploy assumptions.** The template targets
   Postgres for website + Authelia. The tracker keeps SQLite + a `tracker-data`
   volume. The template's deploy story (Coolify service, compose) must not
   assume a Postgres app DB; the tracker compose adds its own SQLite volume.
   `docker-compose.yml:31` and `COOLIFY.md` stay tracker-specific.
5. **`@beskid/server-observability` fate.** If the template does not absorb
   it, the tracker must still depend on the published package (needs
   `.npmrc` + `NODE_AUTH_TOKEN`), partially re-introducing the GitHub
   Packages auth the workspace was designed to avoid. **Template-author
   decision; recommend absorbing into the template** (it is ~36 lines).
6. **`#/components/ui/*` alias repointing.** `tsconfig.json:10` and
   `vite.config.ts:64` map `#/components/ui/*` → `beskid-ui-react/src/components/ui/*`.
   The new lib has the same path (`packages/beskid-ui-react/src/components/ui/`),
   so the alias repoints cleanly, but the Vite `dedupe` list
   (`vite.config.ts:91`) must be reconciled with the workspace catalog
   (`beskid_sites/pnpm-workspace.yaml` pins `@tanstack/*` and React 19) to
   avoid duplicate React/radix instances.
7. **`styles.css` `@source` path.** `src/styles.css:5` scans
   `../node_modules/@beskid/ui-react/src`. Under `workspace:*` the node_modules
   path is the pnpm virtual store, not a direct `../node_modules/@beskid/...`.
   The `@source` must repoint at the workspace package
   (`../../packages/beskid-ui-react/src` or the package's resolved path) or
   styles for shared shadcn utilities silently drop.
8. **Webhook ingress under forward-auth.** `src/routes/api/webhooks/github.ts`
   receives GitHub issue webhooks (HMAC-signed, no session). Authelia
   forward-auth in front of the tracker would block unauthenticated webhook
   POSTs. The template/deploy must exempt `/api/webhooks/*` (and `/api/v1/*`,
   `/metrics`, `/api/health`) from forward-auth, or the webhook breaks.
   **Deploy-config concern; confirm with `beskid_infra`.**
9. **Public vs authenticated routes.** `/` (timeline) and `/bugs` are public
   (`README.md:103`); kanban/workstreams require sign-in (`app-sidebar.tsx`,
   `v/$version.tsx:17` redirects to `/login`). Authelia forward-auth is
   typically all-or-nothing per route prefix. The template must support
   per-route public/guarded flags so the tracker keeps its mixed visibility
   without forcing every page behind Authelia.
10. **OpenSpec normative spec.** `openspec/specs/tooling--auth-hub--*` define
    the handoff JWT + pairing the tracker implements. Per AGENTS.md the
    Authelia migration must move through a real OpenSpec change before
    observable behavior changes; the tracker cutover depends on that change
    landing (auth Plan.md Risk #4).
11. **Seed data + catalog revision.** `data/` (git-derived seed JSON) and
    `src/lib/seed/*` load historical v0.0–v0.3 tasks. This is tracker domain
    data, unaffected by the migration, but the `tracker-data` volume must
    carry over the existing SQLite file on cutover (no re-seed from JSON
    unless intended).
12. **Coolify service UUID / GHCR grant.** Per AGENTS.md learned facts, do
    not invent a new Coolify service UUID or GHCR Write grant for a
    `beskid-sites-tracker` image — fail closed and document the human admin
    step (same as pckg Plan.md Risk).

## Recommended phased approach

1. **Phase 0 — Wait on auth.** The tracker migration is blocked behind
   auth Plan.md phases 0–3 (OpenSpec change, Authelia deploy, shell-template
   Authelia middleware, GitHub-proxy companion). Do not start tracker code
   work until the companion is live and the `AuthUser` shape + companion
   Octokit client are defined in the template.
2. **Phase 1 — Scaffold `beskid_sites/apps/tracker` from the shell template.**
   `app.config.ts`, `__root.tsx` (template default), `src/server/`, Tailwind v4
   + `@cyber-nomad-collective/beskid-ui-react` `workspace:*`, `#/components/ui/*`
   tsconfig alias repointed, `@source` repointed, `vitest.config.ts`. No
   routes, no data. Confirm the template's SQLite-agnostic deploy story.
3. **Phase 2 — Port the data layer verbatim.** Copy `src/lib/storage/*`,
   `src/lib/tracker/*`, `src/lib/seed/*`, `src/lib/sync/*`, `src/lib/github/*`
   (minus `hub-octokit.server.ts`), `src/lib/roadmap/*`,
   `src/lib/platform-spec/*`, `src/lib/report-issue/*`, `src/lib/issues/*`
   into the new app unchanged. Port the domain tests; get them green. Keep
   the `tracker-data` SQLite volume in the new compose.
4. **Phase 3 — Rewire auth onto Authelia.** Delete the hub surfaces listed in
   §1. Replace `src/lib/session/cookie.ts` + `src/server/auth-guard.server.ts`
   with the template's Authelia middleware + `requireAuth`/`requireGroup`.
   Replace `hub-octokit.server.ts` with the companion GitHub-proxy client.
   Rewrite `src/server/roadmap.ts`/`issues.ts`/`public-bugs.ts`/`sync.ts`
   `withAuth`/`withOctokit`/`requireMaintainer` calls to the new guards. Decide
   `canManageRoadmap` semantics (Risk #2). Port `src/server/catalog.ts`,
   `catalog-import.ts`, `platform-spec.ts`, `github-sync-settings.ts`.
5. **Phase 4 — Port routes + shell wiring.** Rebuild `src/routes/_shell.tsx`
   to use the template `AppShell` with `sidebarItems` (Roadmap / Bugs /
   Platform spec) + `sidebarExtra` (`RoadmapNavTree`, `ReportIssueDialog`
   trigger) + `topbarRight` (`RoadmapGlobalSearch`,
   `TrackerSettingsHeaderButton`, `BeskidHub`). Rebuild `_shell/*` route
   tree (`index`, `bugs`, `v/$version`, `v/$version/w/$workstream`,
   `versions/$version/*`, `workstreams/v/$version`, `docs`). Rebuild `login.tsx`
   (Authelia redirect, keep `AuthPageShell`). Add `metrics.ts`, `api/v1/*`,
   `api/webhooks/github.ts` (confirm forward-auth exemption, Risk #8),
   `api/health.ts`. Port all tracker-specific components (roadmap-*, report-*,
   catalog-import, github-webhook-settings, work-item-shell, reui, etc.).
6. **Phase 5 — Styles + deploy.** Rewrite `styles.css` to import the new
   lib's `styles/*` + keep `styles/roadmap-app.css`, `styles/work-item-form.css`,
   `styles/svar-filter-theme.css` as app-specific appends. Build the Nitro
   image; add a Coolify service + `tracker-data` volume; exempt webhook/API
   routes from forward-auth. Fail closed on Coolify service UUID / GHCR grant
   (document the human admin step).
7. **Phase 6 — Cutover.** Point `tracker.beskid-lang.org` at the new Nitro
   service (staging `stg-` prefix first). Carry over the existing SQLite file
   in the volume. Retire `beskid_tracker/` and its `@beskid/*` `file:` links
   once the new app is verified. Update `COOLIFY.md`, the deploy matrix, and
   regenerate `openspec/catalog.json` if any normative spec reference changed.

## Verdict

**DONE — Medium, completed.** The shell/root/theme/observability/query
scaffolding lifted cleanly into the template (the tracker was the donor),
and the entire SQLite data layer + domain services + tests + tracker-specific
UI ported near-verbatim. The bespoke auth-hub coupling (handoff JWT,
hub-settings encryption, pairing wizard, `hubUserToken` session,
`hub-octokit` proxy) was fully rewritten onto Authelia + the shell-template
OIDC client (hub surfaces deleted, no fallback). The SQLite-stays-while-
template-uses-Postgres split was preserved as a template-design constraint
(template's Postgres assumption is optional/pluggable). The remaining work
is the `canManageRoadmap` semantics decision, the Authelia cutover (master
Plan Phase 1), the Caddy cutover (Phase 3), and the registry/CI migration
(Phase 6) — all tracked in the master `Plan.md`.
