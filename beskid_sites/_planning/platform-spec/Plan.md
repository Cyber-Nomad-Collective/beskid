# Service: site/platform-spec

> Original research for migrating `site/platform-spec` into the
> `beskid_sites/` workspace. The research below informed the migration;
> the migration is **DONE** — see Current Status.

## Current Status

**Migration: DONE.** `apps/platform-spec/` is a live TanStack Start app
deployed at `spec.beskid-lang.org` behind the Coolify proxy with Caddy
labels.

- **Deployed:** yes — `spec.beskid-lang.org` (production), via Coolify
  proxy + Caddy labels. Image built from `beskid_sites/apps/platform-spec/`.
- **What's working:**
  - Full copy from `site/platform-spec`. The reader, OpenSpec, Memgraph,
    git-sync, and editor surfaces lifted near-verbatim (the app was
    already TanStack Start on the same catalog).
  - `@beskid/ui-react` → `@cyber-nomad-collective/beskid-ui-react`
    (mechanical rename) done; `@beskid/beskid-ui` + `@beskid/material-theme`
    vite aliases dropped (the canonical lib absorbed `theme.material.css`).
  - Auth-hub surfaces removed (`lib/auth/hub-*`, `server/auth-hub-*`,
    `routes/api/auth/{github,hub-finish,pair}.ts`, `routes/settings/auth/*`,
    `components/auth-hub-setup-wizard.tsx`, `@beskid/auth-client` dep);
    Authelia OIDC added via the shell template.
  - `@beskid/server-observability` link retained pending the workspace
    composition decision (inline into shell template vs. publish as a
    package) — tracked in master Plan.
- **Pending:**
  - Auth: runs with `SHELL_AUTH_MODE=mock` until Authelia is live (master
    Plan Phase 1).
  - **GitHub-write-token for PR creation (HIGH — open).** `git-sync/pr.ts`
    needs an Octokit with repo write. The old hub handoff token has no
    clean Authelia equivalent. The current rewrite uses a service-level
    `GITHUB_SYNC_TOKEN` rather than per-user tokens (per `auth/Plan.md`
    verdict). Confirm this preserves the `assertWriteAccess` semantics
    before the edit/PR surface is considered fully restored.
  - Cutover from Coolify to the standalone Caddy compose (master Plan
    Phase 3).
  - CI/CD migration to `cr.beskid-lang.org` + SSH deploy (master Plan
    Phase 6).
- **Human steps needed:** none specific to this service beyond the
  cross-phase steps in the master Plan. `PLATFORM_SPEC_SESSION_SECRET`,
  `GITHUB_SYNC_TOKEN`, `GITHUB_WEBHOOK_SECRET` already in OpenBao.

The phased approach and risks documented below were the planning basis; the
implementation is complete modulo the pending infra phases and the
PR-creation token decision.

---

## Current architecture

`site/platform-spec` is already a TanStack Start app (React 19 + Nitro, `vite.config.ts:51-62`) serving
`https://spec.beskid-lang.org`. It is the **normative platform specification reader**: OpenSpec
(`openspec/specs/*` + `openspec/catalog.json`) is the build-time authority; a statically generated
`seed/*.json` workspace (`scripts/seed.ts`, baked into the image) is the runtime source, with
**Memgraph** as an optional derived index for editorial drafts — not a normative store
(`README.md:4-5`, `COOLIFY.md:42`).

Shape:
- **Routes** (`src/routes/`): public reader splat `platform-spec/$.tsx`, `index.tsx` redirect,
  `manifest.tsx`, an authenticated `/_edit` layout (`_edit.tsx`) wrapping `/edit/*` (drafts) and
  `/moderation`, `/settings/auth/*` (pair/login), and an `/api` tree (`api/v1/*` catalog/nav/docs/embed,
  `api/auth/*`, `api/admin/*`, `api/webhooks/*`, `api/health`).
- **Server** (`src/server/`): `openspec/reader.ts` (catalog/document/nav-tree, prefers baked seed),
  `memgraph/{client,schema,drafts,draft-contexts}.ts` (neo4j-driver → Memgraph), `git-sync/pr.ts`
  (Octokit → creates `openspec/changes/<change>/` branches + draft PRs in the superrepo),
  `auth*.ts`, `auth-hub-*.ts`, `catalog.ts`, `draft*.ts`, `manifest.ts`, `moderation.ts`,
  `observability-middleware.ts`.
- **Lib** (`src/lib/`): `spec/` (catalog, document, domain-model, static seed), `auth/` (hub handoff
  + pairing), `session/cookie.ts` (JWT-sealed `beskid_platform_spec_session` cookie via `jose`),
  `storage/` (SQLite `spec_*` stores + migrations), `github/`, `manifest/`, `markdown*.ts`.
- **Components** (`src/components/`): `reader/` (27 files: chrome, nav-rail, document views,
  architecture-graph map/editor via `@xyflow/react` + `@dagrejs/dagre`, embeds, review), `editor/`
  (7 files: draft wizard, TipTap markdown editor, validation), plus `auth-hub-setup-wizard.tsx`,
  `theme-provider.tsx`, `theme-toggle.tsx`, `ui-primitives.tsx`, `spec-route-error.tsx`.
- **Styling**: `src/styles.css` imports tailwind, `@beskid/material-theme`,
  `@beskid/ui-react/styles/shadcn-entry.css`, `@beskid/beskid-ui/styles/hub.css`, and local
  `styles/reader-app.css`; defines the shadcn↔Material token bridge.
- **Build/deploy**: `pnpm run build` = `seed:static` → `verify:seed` → `vite build` → `seed:bundle` →
  root stylesheet sync → client/SSR bundle verification (`package.json:11`). Dockerfile builds from
  the superrepo root, runs `@beskid/auth-client` + `@cyber-nomad-collective/beskid-server-observability`
  builds first, bakes `openspec/` + `seed/`, runs Nitro server (`Dockerfile:27-35,61`). Coolify
  staging/production via GHCR + OpenBao secrets (`COOLIFY.md`).

## Coupling to beskid packages

`site/platform-spec/package.json:32-36` declares four `file:`-linked shared packages, all resolved
from `beskid_web_common/`:

| Import specifier in code | Real package name | Used for |
|---|---|---|
| `@beskid/ui-react` | `@cyber-nomad-collective/beskid-ui-react` | shadcn React UI (Sidebar, Avatar, Separator, BeskidHub, TooltipProvider) — `__root.tsx:7`, `_edit.tsx:21`, `reader-chrome.tsx:16`, `spec-nav-rail.tsx:8`. Bare specifier only; no subpath imports. |
| `@beskid/beskid-ui` | `@cyber-nomad-collective/beskid-ui` | **CSS only** — no TS imports. `vite.config.ts:30,42,46,89` aliases `@beskid/beskid-ui` → `beskid-ui/src/index.ts` and `@beskid/beskid-ui/styles/hub.css` → `beskid-ui/src/styles/hub.css`; `styles.css:8` imports the latter. |
| `@beskid/material-theme` (alias) | (not a real package) | `vite.config.ts:38-40` aliases to `beskid-ui/src/styles/theme.material.css` (151 lines). Imported by `styles.css:6` **and transitively by the new lib's own `beskid-tokens.css:4`**. |
| `@beskid/auth-client` | `@beskid/auth-client` | GitHub-via-auth-hub handoff/pairing: `lib/auth/hub-handoff.server.ts`, `hub-pairing-flow.server.ts`, `lib/github/hub-octokit.server.ts`. |
| `@beskid/server-observability` | `@cyber-nomad-collective/beskid-server-observability` | `server/observability-middleware.ts:4` only (pino/prom-client, `/metrics`). |

Other notes:
- `@cyber-nomad-collective/trudoc` is mapped in `tsconfig.json:9-14` but **unused in `src/`** — dead path, no migration cost.
- `@xyflow/react` + `@dagrejs/dagre` are direct deps of platform-spec (used by its own
  architecture-graph components) **and** deps of the new lib — overlap, but kept locally is fine.
- Dockerfile (`Dockerfile:14-19`) copies `beskid_web_common` + sibling site `package.json`s before
  `pnpm install --frozen-lockfile` because of the `file:` links; then builds `@beskid/auth-client`
  and `@cyber-nomad-collective/beskid-server-observability` before the app build.

## What moves cleanly (itemize — expect most)

Confirmed: the app is already TanStack Start + Nitro + React 19 + the same `tanstack-start` catalog
as `beskid_sites/pnpm-workspace.yaml`. The reader, OpenSpec, Memgraph, git-sync, and editor
surfaces are self-contained and framework-aligned. They lift with **no structural rewrite**:

1. **Entire route tree** (`src/routes/**`) — TanStack file-based routing, `routeTree.gen.ts`,
   `__root.tsx` shell, `platform-spec/$.tsx` splat, `/_edit` layout, `/api/**` server handlers.
   All framework-native; copy as-is.
2. **OpenSpec reader + seed pipeline** — `src/server/openspec/reader.ts`, `src/lib/spec/*`,
   `scripts/seed.ts` (+ `verify-seed.ts`, `verify-*.ts`), `seed/` workspace, `openspec/catalog.json`
   consumption. Pure filesystem/JSON; no beskid-package coupling.
3. **Memgraph integration** — `src/server/memgraph/{client,schema,drafts,draft-contexts,types}.ts`
   uses `neo4j-driver` + `env.MEMGRAPH_URI` only. Ports verbatim; only env wiring changes.
4. **Git-sync / PR creation** — `src/server/git-sync/pr.ts` (+ `webhook.ts`) uses `@octokit/rest`
   + `env.GITHUB_*`. No shared-package coupling; ports verbatim.
5. **SQLite stores** — `src/lib/storage/{db,schema,spec-store,sqlite}.ts` (settings DB) — self-contained.
6. **Reader components** — `src/components/reader/*` (27 files): document views, nav rail/tree,
   architecture graph (`@xyflow/react`), embeds, review flow, highlight toolbar. Only the
   `@beskid/ui-react` import specifier changes (see deltas).
7. **Editor components** — `src/components/editor/*` (7 files): TipTap markdown editor, draft
   wizard, validation panel. TipTap deps are local; ports as-is.
8. **Markdown/directives** — `src/lib/markdown*.ts`, `markdown-directives.ts` (book/spec/nexus/bug
   embeds), `lowlight-render.ts`. Self-contained.
9. **Public APIs** — `/api/v1/{catalog,nav-tree,docs,embed}`, `/beskid-doc-embed.js` custom element,
   `/api/health`. All app-local.
10. **Tests** — `*.test.ts` across reader, memgraph, openspec, spec, storage, git-sync, markdown.
    Vitest config (`vitest.config.ts`) ports with the app.

## What requires change (deltas: package resolution, shell adoption, Authelia, Memgraph config)

### A. Package resolution — `@beskid/ui-react` → `@cyber-nomad-collective/beskid-ui-react` (mechanical)
- `package.json:36` swap `"@beskid/ui-react": "file:../../beskid_web_common/packages/beskid-ui-react"`
  → `"@cyber-nomad-collective/beskid-ui-react": "workspace:^"` (same workspace in `beskid_sites/`).
- **Import-specifier rename across `src/`**: 5 files import `from "@beskid/ui-react"` —
  `routes/__root.tsx:7`, `routes/_edit.tsx:21`, `components/reader/reader-chrome.tsx:16`,
  `components/reader/spec-nav-rail.tsx:8`, plus `components/reader/spec-view-mode.test.ts:54,56`.
  Find-and-replace `@beskid/ui-react` → `@cyber-nomad-collective/beskid-ui-react` (barrel only;
  no subpath imports to rewrite).
- `src/styles.css:3,7` — `@source "../node_modules/@beskid/ui-react/src"` and
  `@import "@beskid/ui-react/styles/shadcn-entry.css"` → new package name.

### B. CSS theme chain — `@beskid/beskid-ui` + `@beskid/material-theme` (the real wrinkle)
- The new `beskid-ui-react` lib (`beskid_sites/packages/beskid-ui-react/src/styles/beskid-tokens.css:4`)
  still does `@import "@beskid/material-theme";` — and `@beskid/material-theme` is **not a published
  package**. It resolves only because each consuming app's `vite.config` aliases it to
  `beskid-ui/src/styles/theme.material.css` (151 lines) in the **old non-React `beskid-ui`** package.
- The new lib's `src/styles/` contains only `beskid-tokens.css`, `hub.css`, `shadcn-entry.css`,
  `shadcn-theme.css` — **`theme.material.css` is NOT present**. So the canonical lib has an
  unresolved external CSS dependency.
- `@beskid/beskid-ui/styles/hub.css` is imported by `styles.css:8` but the new lib already ships its
  own `src/styles/hub.css` — so this import should switch to `@cyber-nomad-collective/beskid-ui-react/styles/hub.css`.
- **Decision required** (lib-side, not platform-spec-side, but platform-spec is the first consumer
  to hit it): absorb `theme.material.css` into `beskid-ui-react/src/styles/` and drop the
  `@beskid/material-theme` alias indirection, OR keep the alias in each consumer's `vite.config`.
  Recommended: absorb it into the canonical lib (single implementation per the user's DRY rule) and
  delete the `@beskid/beskid-ui` dependency entirely from platform-spec.
- `vite.config.ts:16-49` `packageAliases` and `ssr.noExternal` (`:88-96`) drop the `@beskid/beskid-ui`
  entries once the lib is self-contained; keep `@cyber-nomad-collective/beskid-ui-react`,
  `@beskid/auth-client` (until auth migrates), `@beskid/server-observability` (until observability
  decision), `pino`, `prom-client` in `noExternal`.

### C. Auth migration — Beskid auth-hub → Authelia (the largest behaviour delta)
- Current auth is a **beskid auth-hub** pairing + JWT-handoff flow:
  - `env.server.ts:17` `AUTH_HUB_PUBLIC_URL` (required), `PLATFORM_SPEC_PAIRING_APPROVER_LOGIN`,
    `PLATFORM_SPEC_SETUP_TOKEN`.
  - `lib/auth/{hub-handoff,hub-pairing-flow,hub-pairing-handler,hub-settings}.server.ts`,
    `server/auth-hub-{pairing,setup}.{ts,server.ts}`, `components/auth-hub-setup-wizard.tsx`.
  - `routes/api/auth/{github,hub-finish,logout,me,pair}.ts`, `routes/settings/auth/*`.
  - `lib/session/cookie.ts` seals/unseals a `beskid_platform_spec_session` JWT containing
    `hubUserToken` + `hubSessionId` (for GitHub API via the hub proxy).
  - `lib/github/hub-octokit.server.ts` uses `@beskid/auth-client`'s `githubProxyBaseUrl`.
  - `git-sync/pr.ts` calls `octokit.users.getAuthenticated` + `assertWriteAccess` using a
    session-derived Octokit (`server/auth-guard.server.ts`) — so PR creation depends on the hub
    issuing a usable GitHub token.
- Target architecture: **Authelia (GitHub login)** + shared Postgres for website + Authelia.
  `@beskid/auth-client` is **not** in `beskid_sites/packages/` and is not part of the new workspace.
- **This is the one place platform-spec stops being a pure lift.** The shell template is supposed
  to provide Authelia-based auth + user data in the topbar/avatar dropdown. Migration means:
  1. Adopt the shell template's auth primitives (Authelia session, user shape) in `_edit.tsx`
     and `__root.tsx`.
  2. Replace `lib/auth/hub-*` + `server/auth-hub-*` + `routes/api/auth/*` + `routes/settings/auth/*`
     with the template's Authelia integration (per the user's "purge the old design—no half-migrations"
     preference: delete the hub machinery, do not keep a fallback).
  3. Resolve the **GitHub-token-for-PR-creation** need: `git-sync/pr.ts` currently relies on the hub
     handoff token. Authelia (GitHub login) gives a GitHub identity but **not necessarily a
    repo-write OAuth token**. Either (a) issue/refresh a GitHub token via an Authelia-side
     mechanism, (b) use a GitHub App/installation token minted server-side from the authenticated
     identity, or (c) fall back to a service account with `assertWriteAccess` checked against the
     Authelia user's login. This is an **open unknown** that must be settled before/during
     migration and is the main risk.
  4. Drop `@beskid/auth-client` from `package.json` and `vite.config.ts` `noExternal`.

### D. Observability — `@beskid/server-observability`
- Used in exactly one file (`server/observability-middleware.ts:4`) for pino/prom-client `/metrics`.
- Not present in `beskid_sites/packages/`. Options: (a) publish/link it into the new workspace as
  a second shared package, (b) inline a minimal observability shim into the shell template, or
  (c) keep a `file:`/registry link to the existing package. Decide once; the new workspace currently
  has only `beskid-ui-react`, so this is a **workspace-composition decision**, not a platform-spec
  one. Until decided, keep the link.

### E. Shell template adoption
- `_edit.tsx` is a hand-rolled `SidebarProvider` + `SidebarInset` + topbar (avatar, BeskidHub,
  sign-out) — i.e. a bespoke edit shell. The target shell template (derived from
  `beskid_tracker`'s `_shell.tsx` + `components/app-shell.tsx`) provides convenience wrappers for
  sidebar items, sidebar show/hide, and topbar nav-slot services (left + right slots), plus an
  avatar dropdown when the sidebar is disabled.
- **Public reader chrome** (`components/reader/reader-chrome.tsx`) is a *reader* shell (nav rail +
  document view), distinct from the edit shell. The reader is unauthenticated and should likely
  **keep its own chrome** (it is the spec reading surface), adopting only the shell template's
  topbar service slots / BeskidHub + theme toggle for visual consistency. The **edit surface**
  (`_edit.tsx` + `/edit`, `/moderation`) should adopt the shell template wholesale.
- `_edit.tsx`'s hand-rolled sidebar/topbar gets replaced by template wrappers; nav items
  (Specification, Drafts, Moderation) become template sidebar-item registrations.

### F. Memgraph config
- `memgraph/client.ts:14` uses `env.MEMGRAPH_URI` with `neo4j.auth.basic("", "")` (no credentials —
  Memgraph default). Ports unchanged. Only the docker-compose / Coolify env wiring moves with the
  service; `docker-compose.yml` (Memgraph + app) and `Dockerfile` are app-local and lift with the
  service into the new workspace (with paths adjusted: the Dockerfile currently builds from the
  superrepo root and copies `beskid_web_common` + `openspec`; in the new workspace the `beskid_ui`
  copy step goes away, replaced by the workspace-internal `beskid-ui-react`).

### G. Build/deploy deltas
- `Dockerfile:14-19` copies sibling site `package.json`s + `beskid_web_common` to satisfy the root
  workspace's frozen lockfile. In the new standalone `beskid_sites` workspace, the build context
  shrinks: only `beskid_sites/` + the `openspec/` tree (still needed for `seed:static` + baked
  seed) must be present. `Dockerfile:27-28` (`@beskid/auth-client` + observability builds) drops
  once auth/observability are resolved (C/D).
- `scripts/sync-beskid-packages.sh` is a root-workspace convenience for refreshing `@beskid/*`
  from GitHub Packages; in the new workspace `@cyber-nomad-collective/beskid-ui-react` is a
  `workspace:^` link, so the platform-spec entry in that script becomes obsolete for the lib
  (still relevant for any registry-pinned packages that remain, e.g. observability if kept external).

## Risks & unknowns

1. **Authelia → GitHub write token for PR creation (HIGH).** `git-sync/pr.ts` needs an Octokit
   with repo write. The current hub handoff token may not have a clean Authelia equivalent.
   Unsettled; blocks the edit/PR surface, not the reader.
2. **`@beskid/material-theme` / `theme.material.css` not in the canonical lib (MEDIUM).** The new
   `beskid-ui-react` ships `beskid-tokens.css` that imports `@beskid/material-theme`, but
   `theme.material.css` still lives in the old non-React `beskid-ui`. Must be absorbed into the
   lib (DRY: single source) or every consumer keeps a vite alias. First consumer to migrate
   (platform-spec) hits this.
3. **`@beskid/server-observability` absent from `beskid_sites` (MEDIUM).** One-file usage but it
   pulls pino + prom-client. Needs a workspace composition decision (link vs inline vs publish).
4. **`--platform-spec-*` CSS variables** (`--platform-spec-card-bg`, `--platform-spec-divider`,
   `--platform-spec-surface-strong/-muted`) are **consumed** in `styles.css` and `reader-app.css`
   but a definition (`--platform-spec-card-bg:`) was not found in the service or the old
   `beskid-ui` styles reachable from the current import chain — they may resolve via
   `theme.material.css` or be effectively unset (falling back to `--card`). Migration must verify
   the theme chain renders identically after `theme.material.css` is relocated.
5. **Reader chrome vs shell template boundary.** Adopting the edit shell template for the
   unauthenticated reader could regress the nav-rail/reading experience; the reader likely keeps
   its own chrome and only borrows topbar slots. Needs a conscious split, not a blanket swap.
6. **Dockerfile context shrink.** Moving into `beskid_sites/` changes the build context; the
   `openspec/` tree (still required for `seed:static`) must remain reachable from the new build
   context. CI/CD paths (GHCR `beskid-platform-spec`, Coolify compose, OpenBao secrets) must be
   re-pointed.
7. **`verify:client-bundle` / `verify:ssr-bundle` gates** assert CSS-on-disk matches the SSR
   router and no secrets leak. They pin the import-specifier strings (e.g.
   `spec-view-mode.test.ts:54,56` checks `@beskid/ui-react/styles/shadcn-entry.css` and
   `@beskid/beskid-ui/styles/hub.css`). These tests must be updated in lockstep with the rename
   (A) and hub.css move (B), or the build gate fails.

## Recommended phased approach

**Phase 0 — Lib prerequisites (do once, benefits all site migrations).**
1. Absorb `theme.material.css` into `beskid_sites/packages/beskid-ui-react/src/styles/` and make
   `beskid-tokens.css` self-contained (drop the `@beskid/material-theme` external import).
2. Decide observability home: add `@cyber-nomad-collective/beskid-server-observability` to
   `beskid_sites/packages/` (or inline a shim into the shell template). Until then platform-spec
   keeps a temporary link.

**Phase 1 — Mechanical lift (no behaviour change).** Copy `site/platform-spec/` into
`beskid_sites/apps/platform-spec/`. Rename `@beskid/ui-react` →
`@cyber-nomad-collective/beskid-ui-react` (imports, `styles.css`, tests). Switch
`@beskid/beskid-ui/styles/hub.css` → the lib's `styles/hub.css`. Drop the `@beskid/beskid-ui` +
`@beskid/material-theme` vite aliases. Update `package.json` to `workspace:^` for the lib. Keep
`@beskid/auth-client` + `@beskid/server-observability` as registry/`file:` links for this phase.
Port Memgraph/OpenSpec/SQLite/git-sync/tests verbatim. Adjust Dockerfile context + `openspec/`
copy. Get `pnpm build` + `verify:*` + `vitest` green.

**Phase 2 — Shell template adoption (edit surface only).** Replace `_edit.tsx`'s hand-rolled
sidebar/topbar with the shell template's wrappers; register Specification/Drafts/Moderation as
sidebar items; use the topbar service slots + avatar dropdown. Leave the public reader chrome
(`reader-chrome.tsx`) on its own rails, borrowing only BeskidHub + theme toggle from the template.

**Phase 3 — Authelia migration (purge the hub).** Once the shell template's Authelia
integration exists, delete `lib/auth/hub-*`, `server/auth-hub-*`, `routes/api/auth/{github,hub-finish,pair}.ts`,
`routes/settings/auth/*`, `components/auth-hub-setup-wizard.tsx`, and the `@beskid/auth-client`
dependency. Replace `lib/session/cookie.ts` with the template's session model. **Resolve the
GitHub-write-token-for-PR-creation unknown** (risk #1) here — this is the gate that proves the
edit/PR surface still works end-to-end.

**Phase 4 — Observability + cleanup.** Finalise the observability home (Phase 0.2); remove the
last `file:`/registry links to `beskid_web_common`; update `scripts/sync-beskid-packages.sh` to
drop the platform-spec lib entry; re-point CI/Coolify/OpenBao to the new image path.

## Verdict

**DONE — Light-to-medium, completed.** The reader, OpenSpec, Memgraph,
git-sync, editor, tests, and build gates lifted almost verbatim — the app
was already TanStack Start on the same catalog. The mechanical
`@beskid/ui-react` → `@cyber-nomad-collective/beskid-ui-react` rename and
the CSS-theme-chain fix (absorbing `theme.material.css` into the canonical
lib) are done. The Authelia migration that purges the Beskid auth-hub is
done (hub surfaces deleted, OIDC client added). The one genuine behaviour
change still open is the GitHub-write-token-for-PR-creation path, which
now uses a service-level `GITHUB_SYNC_TOKEN` and must be verified
end-to-end. Remaining work is infra-phase (Authelia cutover, Caddy
cutover, registry migration) tracked in the master `Plan.md`.
