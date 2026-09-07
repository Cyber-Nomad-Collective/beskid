# Platform Spec — Migration Notes (`site/platform-spec` → `beskid_sites/apps/platform-spec`)

Migration of the normative platform-spec reader/editor app from the superrepo
`site/platform-spec/` into the standalone `beskid_sites/` pnpm workspace, on
the shared `@cyber-nomad-collective/beskid-ui-react` library and the shell
template's Authelia OIDC auth model.

Status: **mechanical lift + shell adoption + Authelia auth migration complete
and verified** (typecheck, full build, 144 tests, biome on authored files all
green). One behaviour blocker remains (GitHub write token for PR creation).

## Verification (run from `beskid_sites/apps/platform-spec/`)

```sh
# deps resolve from the beskid_sites workspace root
pnpm -C ../.. install

# typecheck
pnpm run typecheck

# tests (need OPENSPEC_ROOT pointing at the superrepo openspec tree)
OPENSPEC_ROOT=/path/to/openspec SESSION_SECRET=... pnpm run test

# full build (seed:static → verify:seed → vite build → seed:bundle →
# sync-root-stylesheet → verify:client-bundle → verify:ssr-bundle)
OPENSPEC_ROOT=/path/to/openspec SKIP_ENV_VALIDATION=1 pnpm run build
```

The build's `seed:static` / `verify:seed` / `verify:ssr-bundle` steps read the
`openspec/` tree. In the standalone workspace `openspec/` is not present, so
`OPENSPEC_ROOT` must point at the superrepo's `openspec/` (or a copy) for local
builds. The Dockerfile expects `openspec/` in the build context (CI
responsibility — see "Build/deploy context" below).

## Dependency changes (old → new)

| Old | New | Notes |
|---|---|---|
| `@beskid/ui-react` (`file:`) | `@cyber-nomad-collective/beskid-ui-react` (`workspace:^`) | Bare-specifier rename in 4 source files + `styles.css` + `spec-view-mode.test.ts`. |
| `@beskid/beskid-ui` (`file:`, CSS only) | removed | `@beskid/beskid-ui/styles/hub.css` → `@cyber-nomad-collective/beskid-ui-react/styles/hub.css`; the `@beskid/material-theme` + `@beskid/beskid-ui` vite aliases dropped (the lib now ships `theme.material.css` itself). |
| `@beskid/auth-client` (`file:`) | removed | Authelia OIDC replaces the auth-hub; see "Auth migration". |
| `@beskid/server-observability` (`file:`) | removed | Inlined as a minimal `src/server/observability.ts` shim (in-memory HTTP recorder); see "Observability". |
| `@tanstack/react-query: latest` | `^5.101.4` | Pinned to match the shell template; the router context now carries a `queryClient`. |
| `react` / `react-dom` / `@types/react` / `@types/react-dom` (pinned) | `catalog:react` | Workspace catalog. |
| `@tiptap/*` `3.28.0` | `3.30.1` + pnpm overrides | The source lockfile pinned `@tiptap/extension-list@3.28.0`; a fresh resolve picks `3.30.1`, whose `getPreviousBlockSibling` import is missing from `core@3.28.0`. All `@tiptap/*` direct deps bumped to `3.30.1` and `@tiptap/core`/`pm`/`extension-list` forced to `3.30.1` via `pnpm.overrides` so the whole tree is consistent. |
| `vite: ^8.0.0` | `vite: 8.1.5` (pinned) | `vite@8.2.1` + `rolldown@1.2.4` emit a chunk-ordering bug (`__exportAll` helper defined after its first use → SSR 500). The source lockfile used `vite@8.1.5` + `rolldown@1.2.0`, which is bug-free. Pinned to `8.1.5`. |
| `vite-tsconfig-paths` (plugin) | not used | Switched to Vite's native `resolve.tsconfigPaths: true` (the source app already used this; the plugin triggered a build warning and is unnecessary). |
| `tslib` vite alias | kept | `resolve.alias: { /^tslib$/: "tslib/tslib.es6.mjs" }` is required — without it rolldown bundles the CJS `tslib` and the SSR bundle fails with `Cannot destructure '__extends' of '__toESM(...).default'`. |
| `@cyber-nomad-collective/trudoc` (tsconfig path) | removed | Unused in `src/` (dead path noted in the Plan). |

## Auth migration — Beskid auth-hub → Authelia OIDC

The old auth-hub pairing + JWT-handoff flow is **purged** (no fallback), per
the "fail closed, no half-migrations" preference. Identity now comes from
Authelia via the shell template's OIDC authorization-code flow.

### Removed (auth-hub machinery)
- `src/lib/auth/` — `hub-handoff.server.ts`, `hub-pairing-flow.server.ts`,
  `hub-pairing-handler.server.ts`, `hub-settings.server.ts`
- `src/lib/session/` — `cookie.ts` (hub-token session), `post-login-redirect.ts`,
  `post-login-redirect.server.ts`
- `src/lib/github/hub-octokit.server.ts` (hub-proxy Octokit)
- `src/server/auth-hub-pairing.{ts,server.ts}`, `src/server/auth-hub-setup.{ts,server.ts}`
- `src/server/auth.ts` (`getAuthUser`), `src/server/auth.server.ts` (`AuthUser`/`resolveAuthUser`)
- `src/routes/api/auth/{github,hub-finish,pair,me}.ts`
- `src/routes/api/admin/setup.ts` (auth-hub setup endpoint) + the empty `api/admin/` dir
- `src/routes/settings/auth/` (login.tsx, pair.tsx) + the empty `settings/` dir
- `src/components/auth-hub-setup-wizard.tsx`
- env vars `AUTH_HUB_PUBLIC_URL`, `PLATFORM_SPEC_PAIRING_APPROVER_LOGIN`,
  `PLATFORM_SPEC_SETUP_TOKEN`

### Added (shell-template Authelia integration, copied into the app)
- `src/server/oidc.ts` (OIDC client: discovery, authorization URL, code
  exchange, ID-token verification via `jose` JWKS) — env var names adapted to
  `PLATFORM_SPEC_OIDC_CLIENT_ID` / `PLATFORM_SPEC_OIDC_CLIENT_SECRET`.
- `src/server/oidc-state.ts` (CSRF state cookie)
- `src/server/shell-session.ts` (HS256 JWT session cookie, name
  `beskid_platform_spec_session`, signed with `SESSION_SECRET`)
- `src/server/shell-user.ts` (`getShellUser` server fn)
- `src/server/authelia-middleware.ts` (`resolveShellUser`, `requireShellUser`,
  `requireShellGroup`, `SHELL_AUTH_MODE=mock` for dev)
- `src/routes/api/auth/{login,callback,logout}.ts` (OIDC flow endpoints)
- `src/components/{app-shell,app-sidebar,sidebar-nav,topbar,user-menu,shell-context,shell-types,user}.tsx`
  + `src/integrations/tanstack-query/root-provider.tsx` (shell composition)

### Rewired
- `src/routes/__root.tsx` — `createRootRouteWithContext<SpecRouterContext>`,
  `beforeLoad` resolves `getShellUser()` into the router context; keeps the
  observability middleware, the `RootSpecRouteError` boundary, and the
  `/beskid-doc-embed.js` script.
- `src/routes/_edit.tsx` — replaced the hand-rolled sidebar/topbar with the
  shell template's `AppShell`; sidebar items = Specification / Drafts /
  Moderation; `beforeLoad` redirects unauthenticated users to `/api/auth/login`.
- `src/router.tsx` — `SpecRouterContext` (`queryClient` + `user: ShellUser | null`).
- `src/env.server.ts` — dropped auth-hub vars; added `SHELL_AUTH_MODE`,
  `AUTHELIA_OIDC_ISSUER`, `PLATFORM_SPEC_OIDC_CLIENT_ID/SECRET`.
- `src/server/auth-guard.server.ts` — identity from `getShellUser`; Octokit
  factory is **fail-closed** (see blocker).
- `src/server/moderation.ts` — gate via `isConfiguredModerator` (no Octokit).
- `src/components/reader/reader-chrome.tsx` — reader keeps its own chrome
  (per Plan §E); the "Login" link now points at `/api/auth/login`.

## BLOCKER — GitHub write token for PR creation (HIGH)

`src/server/git-sync/pr.ts` (`createDraftPullRequest`) needs an Octokit with
repo write to create `openspec/changes/<change>/` branches + draft PRs. The old
flow derived this token from the auth-hub handoff (`session.hubUserToken`
proxied through the hub). **Authelia's OIDC ID token gives a GitHub identity
but not a repo-write OAuth token**, so the Octokit factory in
`auth-guard.server.ts` is **fail-closed**: it returns a `Proxy` that throws
`GITHUB_WRITE_TOKEN_NOT_CONFIGURED` on first property access.

Current behaviour (fail closed, by design):
- Draft list / create / update / delete (login-only, no Octokit) → **work**.
- Moderation gate → `isConfiguredModerator` (env `PLATFORM_SPEC_MODERATOR_LOGINS`)
  only; repo-admin-based moderation is **suspended** until the token issue is
  resolved.
- Draft approval / PR creation (`createDraftPullRequest`) → **throws
  `GITHUB_WRITE_TOKEN_NOT_CONFIGURED` at runtime**.

This is the one genuine behaviour regression vs. the auth-hub flow and is the
gate that proves the edit/PR surface still works end-to-end. **Resolution is
out of scope for this migration** and must be settled before the edit/PR
surface is usable. Candidate approaches (decision pending):
1. A server-side GitHub App / installation token minted from the verified
   Authelia identity (recommended — keeps the user identity, scopes the
   token to the repo).
2. An Authelia-side mechanism to issue/refresh a GitHub OAuth token with
   `repo` scope.
3. A service-account token with `assertWriteAccess` checked against the
   Authelia user's login.

Do **not** use the user's Authelia/OAuth token directly without confirming it
carries `repo` scope; the OIDC ID token does not.

## Observability — `@beskid/server-observability` inlined

The package (pino + prom-client) is not in `beskid_sites/`. It was used in
exactly one file (`observability-middleware.ts`) to record HTTP request
durations; there is no `/metrics` endpoint consumer in this app. A minimal
in-process shim `src/server/observability.ts` provides the same
`initObservability` / `getObservability().recordHttpRequest` shape with an
in-memory ring buffer (no external deps). If real pino/prom-client
observability is needed later, publish `@cyber-nomad-collective/beskid-server-observability`
into the workspace as a second shared package and swap the shim back out.

## Shell template — DRY debt (future)

The shell-template is an **app** (`apps/shell-template`), not a consumable
package. To avoid duplicating shell code, the shell components
(`app-shell`, `app-sidebar`, `topbar`, `user-menu`, `sidebar-nav`,
`shell-context`, `shell-types`, `user.ts`) and the Authelia server modules
(`oidc`, `oidc-state`, `shell-session`, `shell-user`, `authelia-middleware`)
were **copied** into platform-spec. This is the intended scaffold pattern
(the template exists to be copied from), but it duplicates ~13 files across
each site app. **Future DRY step**: extract the shell-template into a shared
`@cyber-nomad-collective/beskid-shell` workspace package with an `exports`
map, so website / platform-spec / tracker / nexus import `AppShell`,
`getShellUser`, etc. instead of copying them. The underlying UI primitives
(Sidebar, Avatar, …) already live in `@cyber-nomad-collective/beskid-ui-react`
and are not duplicated.

## Build/deploy context

- The Dockerfile build context is now `beskid_sites/` (the workspace root).
  `docker-compose.yml` `context: ../..` resolves to `beskid_sites/` from the
  app dir.
- The `openspec/` tree (required by `seed:static` / `verify:seed`) is **not**
  in `beskid_sites/`. CI must copy/mount it into the Docker build context
  before `docker build` (e.g. `cp -r <superrepo>/openspec beskid_sites/openspec`
  in the CI job). The Dockerfile `COPY openspec ./openspec` assumes it is
  present. Local builds set `OPENSPEC_ROOT=/path/to/openspec`.
- The old Dockerfile steps that copied `beskid_web_common` + sibling site
  `package.json`s and built `@beskid/auth-client` + observability are gone
  (no more `file:` links, no auth-hub, observability inlined).
- CI/CD paths (GHCR `beskid-platform-spec`, Coolify compose, OpenBao secrets)
  must be re-pointed at the new image path / context. Coolify env: drop
  `AUTH_HUB_PUBLIC_URL` / `PLATFORM_SPEC_PAIRING_APPROVER_LOGIN` /
  `PLATFORM_SPEC_SETUP_TOKEN`; add `SHELL_AUTH_MODE`,
  `AUTHELIA_OIDC_ISSUER`, `PLATFORM_SPEC_OIDC_CLIENT_ID/SECRET`.

## Pre-existing lint note

`src/components/reader/spec-nav-rail.tsx:143` (`<ul role="group">`) trips
biome's `lint/a11y/useSemanticElements`. This is **pre-existing** in the
source app (the superrepo `biome.json` is identical — `recommended: true`,
no override) and is **not introduced by this migration** (the only edit to
that file was the `@beskid/ui-react` import rename on line 8). It is left
as-is to avoid changing reader nav-tree behaviour/styling. Other verbatim-
copied reader components carry similar pre-existing a11y/format deviations;
all files **authored or rewritten by this migration** are biome-clean.
