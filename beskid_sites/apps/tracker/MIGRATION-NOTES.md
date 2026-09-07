# Tracker Migration Notes

Migration of `beskid_tracker/` (TanStack Start, bespoke auth-hub) into the
`beskid_sites/` workspace as `apps/tracker/`, reusing the shell-template's
Authelia OIDC auth and the `@cyber-nomad-collective/beskid-ui-react` shared
library. This file records what changed, what was removed, and the open
blockers that require a human decision before production cutover.

## What moved

- **Entire SQLite data layer** (`src/lib/storage/*`, `src/lib/tracker/*`,
  `src/lib/seed/*`, `src/lib/sync/*`, `src/lib/github/*` minus `hub-octokit` and
  `permissions`) — ported verbatim. SQLite remains the source of truth; the
  `tracker-data` volume is preserved in `docker-compose.yml`.
- **Roadmap / catalog / search / platform-spec domain** (`src/lib/roadmap/*`,
  `src/lib/platform-spec/*`, `src/server/catalog*`, `src/server/platform-spec*`)
  — ported verbatim.
- **Tracker-specific UI** (all `src/components/roadmap-*`, `report-*`,
  `catalog-import-dialog`, `github-webhook-settings-panel`, `work-item-shell/*`,
  `reui/*`, `tracker-settings-dialog`, etc.) — ported verbatim, with the
  `#/components/ui/*` alias repointed at the new shared lib.
- **Routes** (`src/routes/_shell/*`, `api/v1/*`, `api/webhooks/github.ts`,
  `api/health.ts`, `metrics.ts`, `login.tsx`) — ported; `_shell.tsx`,
  `__root.tsx`, `router.tsx`, `login.tsx`, `metrics.ts` rewritten.
- **Tests** — ported verbatim (17 files, 49 tests, all green).
- **Data** (`data/v0.*` seed JSON, `data/version-bands.json`) — ported verbatim.

## Dependency changes (old → new)

| Old | New | Notes |
|---|---|---|
| `@beskid/ui-react` (`file:`) | `@cyber-nomad-collective/beskid-ui-react` (`workspace:^`) | shadcn primitives, settings, auth, explorer, graph |
| `@beskid/beskid-ui` (`file:`) | dropped | `BeskidHub` + `hub.css` absorbed into the new lib |
| `@beskid/auth-client` (`file:`) | dropped | handoff JWT retired (Authelia replaces it) |
| `@beskid/server-observability` (`file:`) | inlined into `src/server/observability.ts` | ~140 lines vendored to avoid GitHub Packages auth in the workspace |
| `@cyber-nomad-collective/trudoc` (`file:`) | dropped | declared but never imported (only a literal taxonomy label `"trudoc"` in `taxonomy.ts`) |
| `@tanstack/react-table`, `@tanstack/match-sorter-utils`, `recharts`, `@faker-js/faker`, `date-fns`, `yaml`, `shadcn` | dropped | declared in the old `package.json` but never imported in source |
| `@tanstack/*` `latest` | `catalog:tanstack-start` / pinned `^5.101.4` / `^1.167.1` | aligned with the shell-template + workspace catalog |
| `react`/`react-dom` `^19.2.0` | `catalog:react` | workspace catalog |
| `file:` links | `workspace:^` / `catalog:*` | pnpm workspace resolution |

Added direct deps the source actually imports: `@dnd-kit/*`, `@octokit/rest`,
`@svar-ui/react-filter`, `react-markdown`, `remark-gfm`, `pino`, `prom-client`,
`jose`, `radix-ui`, `react-resizable-panels`, `tw-animate-css`,
`@tailwindcss/typography`.

## Auth-hub removals

All bespoke auth-hub machinery is deleted:

- `src/lib/auth/hub-handoff.server.ts`, `hub-pairing-flow.server.ts`,
  `hub-pairing-handler.server.ts`, `hub-settings.server.ts`
- `src/lib/github/hub-octokit.server.ts` (replaced by a fail-closed Octokit proxy)
- `src/lib/session/cookie.ts` (replaced by the shell-template's `shell-session.ts`)
- `src/lib/session/post-login-redirect.ts` + `.server.ts` (dead after the
  Authelia redirect login)
- `src/server/auth-hub-pairing.server.ts` + `.ts`,
  `src/server/auth-hub-setup.server.ts` + `.ts`
- `src/components/auth-hub-setup-wizard.tsx`
- `src/routes/api/auth/github.ts`, `hub-finish.ts`, `pair.ts`, `me.ts`, `logout.ts`
- `src/routes/api/admin/` (setup, setup/status, auth/pair)
- `src/routes/onboarding.tsx`, `src/routes/settings/auth/pair.tsx`
- `src/lib/github/permissions.ts` (`canManageRoadmap` moved to `auth-guard.server.ts`)

Env keys dropped: `AUTH_HUB_PUBLIC_URL`, `AUTH_HUB_SECRET`,
`GITHUB_OAUTH_CALLBACK_URL`, `TRACKER_PAIRING_APPROVER_LOGIN`,
`TRACKER_SETUP_TOKEN`. Env keys added: `SHELL_AUTH_MODE`, `AUTHELIA_OIDC_ISSUER`,
`TRACKER_OIDC_CLIENT_ID`, `TRACKER_OIDC_CLIENT_SECRET`, `TRACKER_MAINTAINER_GROUP`.

## Shell-template integration

The shell-template is a separate **app** (`apps/shell-template`), not a
package, and the scope of this task forbids modifying it. The DRY-correct
end-state is a shared `packages/shell-core/` package that both the
shell-template and the tracker consume, but extracting it requires editing the
shell-template (out of scope here). 

Decision taken: **copy** the shell-template's shell components + server auth +
auth routes into `apps/tracker/src/` (replacing the tracker's donor shell
files), and document the sync requirement. The copied files are:

- `src/components/`: `app-shell.tsx`, `app-sidebar.tsx`, `shell-context.tsx`,
  `shell-types.ts`, `sidebar-nav.tsx`, `topbar.tsx`, `user-menu.tsx`, `user.ts`,
  `theme-provider.tsx`, `theme-toggle.tsx`
- `src/server/`: `shell-user.ts`, `shell-session.ts`, `authelia-middleware.ts`,
  `oidc.ts`, `oidc-state.ts`
- `src/routes/api/auth/`: `login.ts`, `callback.ts`, `logout.ts`
- `src/integrations/tanstack-query/root-provider.tsx`

**TODO (follow-up):** extract these into `packages/shell-core/` and update both
`apps/shell-template` and `apps/tracker` to consume it, eliminating the
duplication. Until then, keep the tracker's copies in sync with the
shell-template by hand.

The tracker-specific delivery-version context (`ShellVersionsSync`) is kept as
a **separate** context (`src/components/shell-versions-sync.tsx`,
`TrackerShellVersionProvider`/`useShellVersion`) layered on top of the
template's generic `ShellUiProvider` (which only owns `sidebarOpen`). The
`_shell.tsx` layout route wires the template `AppShell` with tracker
`sidebarItems` (Roadmap / Bugs / Platform spec), `sidebarExtra`
(`RoadmapNavTree` + Report group), and `rightSlot` (`RoadmapGlobalSearch` +
`TrackerSettingsHeaderButton` + `BeskidHub`).

The copied `oidc.ts` was adapted to read `TRACKER_OIDC_CLIENT_ID` /
`TRACKER_OIDC_CLIENT_SECRET` (the shell-template's `SHELL_TEMPLATE_*` names are
app-specific).

## Authelia auth model

- Authelia is the OIDC provider; the tracker is an OIDC client
  (authorization-code flow). GitHub is the identity provider on the Authelia
  side.
- After the Authelia ID token is verified (`src/server/oidc.ts`), the verified
  claims are sealed into a signed `beskid_shell_session` HS256 JWT cookie
  (`src/server/shell-session.ts`, `SESSION_SECRET`, 7d TTL).
- `getShellUser` (`src/server/shell-user.ts`) unseals the cookie on every
  request. `SHELL_AUTH_MODE=mock` returns a fake user for local dev.
- `resolveAuthUser` (`src/server/auth.server.ts`) maps the `ShellUser` to the
  tracker's `AuthUser` shape (`{ login, name, avatarUrl }`).
- `login.tsx` links to `/api/auth/login` (the OIDC start), not the old hub.

## Blockers / TODOs (require decisions before production)

### 1. GitHub token for issue sync (BLOCKER)

The old tracker built a per-user Octokit from the auth hub's `hubUserToken`
(GitHub OAuth token, never left the hub). Under Authelia there is **no
per-user GitHub token** — Authelia only vouches for identity. The
Octokit-dependent surfaces therefore **fail closed** via a Proxy in
`src/server/auth-guard.server.ts` (`failClosedOctokit`):

- **Bug export to GitHub Issues** (`drainGithubSyncOutbox`): the per-user
  export path (`createPublicBugForSession` → `drainGithubSyncOutbox(octokit)`)
  throws on Octokit access. The bug is still created in SQLite; the
  `drainGithubSyncOutbox(...).catch(() => undefined)` in `bug-write-service.ts`
  swallows the error, so bug creation succeeds locally but the GitHub export is
  silently skipped.
- **Webhook provisioning** (`provisionRepositoryIssuesWebhook`): the
  `provisionGithubWebhookFn` server fn throws on Octokit access.

**Server-side paths that still work** (they use env PATs, not user tokens):
- `triggerGithubExportFn` / `triggerGithubSyncExport` use `createSyncOctokit()`
  which reads `GITHUB_SYNC_TOKEN` / `GITHUB_PUBLIC_READ_TOKEN` env vars. These
  work if the env PAT is set.
- Public issue reads use `createPublicReadOctokit()` (env PAT or unauthenticated).

**Decision needed:** how does the tracker get a GitHub token with `repo` scope
for bug export / webhook provisioning without the auth hub? Options:
(a) a server-side GitHub App token minted by a companion service (the auth
Plan.md's GitHub-proxy companion);
(b) a single org-wide PAT stored in OpenBao (`secret/beskid/production/tracker-github`)
read at server startup (simplest, loses per-user attribution);
(c) keep `GITHUB_SYNC_TOKEN` env PAT as the only export path and drop the
per-user export entirely.

Do **not** invent a token or a companion UUID. This is a human admin decision.

### 2. `canManageRoadmap` semantics change

`canManageRoadmap` was a live Octokit `repos.getCollaboratorPermission` check
(repo owner / admin). It is now an **Authelia group membership check**
(`TRACKER_MAINTAINER_GROUP`, default `beskid-admins`) — sync, no network, safe
in loaders. This changes the authorization semantics from "live repo role" to
"group membership". If the team wants to preserve "repo owner" semantics, the
companion GitHub-proxy Octokit (Blocker #1) must answer
`repos.getCollaboratorPermission` for the caller — which requires a GitHub
token with `repo` scope for the caller, not just identity.

### 3. Avatar URL under Authelia

Authelia ID tokens do not include the GitHub avatar. `resolveAuthUser` falls
back to `https://github.com/${username}.png`. If a non-GitHub identity provider
is ever added, this fallback breaks. The companion (Postgres cache) or a
dedicated avatar endpoint is the long-term fix (auth Plan.md Risk #2).

### 4. Forward-auth route exemptions (deploy)

Authelia forward-auth in front of the tracker would block unauthenticated
inbound webhooks. The deploy must exempt `/api/webhooks/*`, `/api/v1/*`,
`/metrics`, `/api/health`, and the public routes `/` and `/bugs` from
forward-auth, or the webhook and public bug list break. This is a
`beskid_infra` Coolify/Authelia config concern, not code.

### 5. Coolify service UUID / GHCR grant (deploy)

Do not invent a new Coolify service UUID or GHCR `beskid-tracker` Write grant.
The human admin must register the `beskid-tracker` image + Coolify service and
inject the staging/production secrets (`AUTHELIA_OIDC_ISSUER`,
`TRACKER_OIDC_CLIENT_*`, `SESSION_SECRET`, `GITHUB_*`) via OpenBao
(`secret/beskid/{staging,production}/tracker/*`).

### 6. `packages/shell-core/` extraction (DRY follow-up)

The shell components are duplicated between `apps/shell-template` and
`apps/tracker` (see "Shell-template integration" above). Extract a shared
package and update both apps to consume it.

## Verification

- `pnpm install` — ok (workspace `workspace:^` link to the shared lib resolves).
- `pnpm -C apps/tracker typecheck` (`tsc --noEmit`) — passes.
- `pnpm -C apps/tracker test` (`vitest run`) — 17 files, 49 tests, all pass.
- `pnpm -C apps/tracker build` (`vite build`, Nitro `node-server`) — succeeds.
- `pnpm exec biome check` — passes (exit 0; 16 pre-existing `noExplicitAny`
  warnings in the verbatim SQLite data layer, preserved unchanged).

No commit or push was performed.
