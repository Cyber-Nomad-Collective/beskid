# Beskid Tracker

[TanStack Start](https://tanstack.com/start) tracker and roadmap planner for the [Cyber-Nomad-Collective/beskid](https://github.com/Cyber-Nomad-Collective/beskid) superrepo. Public bug reports and the delivery timeline are version-agnostic; kanban boards are per delivery version.

The tracker **SQLite database** is the source of truth for versions, roadmap tasks, and bugs. GitHub Issues are used only as the external bug-reporting surface; roadmap tasks never export to or import from GitHub. Import catalog JSON from **Settings → Actions → Import catalog** and configure the bug webhook in the settings dialog.

Each task belongs to a **delivery version** (`v0.1`–`v0.4`); the kanban board is per version. [Platform specification](https://beskid-lang.org/platform-spec/) entries are linked by stable OpenSpec identifiers and typed relations; the repo owner approves spec linkages.

## Stack

- TanStack Start + Router + Query
- [Beskid Auth hub](../site/auth/README.md) for GitHub sign-in; `@octokit/rest` via hub proxy for writes and reads
- SQLite tracker database (`bun:sqlite`, default `data/runtime/issues.sqlite`)
- Encrypted session cookie (`jose`)
- Tailwind CSS v4, shadcn/ui (Radix Maia), ReUI Kanban

## Theming

Visual design follows **beskid-lang.org** and **pckg** Material teal tokens from [`@cyber-nomad-collective/beskid-ui-react`](https://github.com/Cyber-Nomad-Collective/beskid_web_common) (`styles/tokens.css` via the workspace link):

- `src/styles.css` — imports the shared token system (`shadcn-entry.css` → `tokens.css`) plus app chrome
- `src/styles/svar-filter-theme.css` — SVAR Filter / Willow tokens → Beskid semantics
- `src/styles/roadmap-app.css` — app shell (header, kanban cards, typography)
- Theme toggle uses `data-theme` (`light` / `dark`) like the docs site (`next-themes`)

When updating site chrome, extend the shared tokens in beskid-ui-react (`styles/tokens.css`: `--beskid-material-seed`, `--beskid-fluent-accent`, `--beskid-fluent-neutral`). **pckg** maps the same seed into Fluent UI Blazor via `FluentDesignTheme` / `loading-theme` `primary-color` and `neutral-color`.

## GitHub bugs

Only issues carrying the `bug` label participate in synchronization. Roadmap status, priority, versions, workstreams, and specification links are tracker-native data.

## Environment

```bash
cp .env.example .env
```

`bun run dev` skips strict env validation in non-production; production and Docker runtime still require real values. Set:

| Variable | Purpose |
|----------|---------|
| `AUTH_HUB_PUBLIC_URL` | Shared auth hub (GitHub OAuth lives there only) |
| `SESSION_SECRET` | 32+ byte secret (`openssl rand -base64 32`) |
| `GITHUB_REPO_OWNER` / `GITHUB_REPO_NAME` | Default: `Cyber-Nomad-Collective` / `beskid` |
| `GITHUB_SYNC_TOKEN` | PAT for bug issue export (falls back to `GITHUB_PUBLIC_READ_TOKEN`) |
| `GITHUB_PUBLIC_READ_TOKEN` | Optional PAT used for bug sync when `GITHUB_SYNC_TOKEN` is unset |
| `TRACKER_DATA_DIR` | SQLite directory (default `data/runtime`) — mount as a volume in Docker |
| `GITHUB_WEBHOOK_SECRET` | Webhook HMAC secret (overrides Settings tab; optional in dev) |
| `TRACKER_PUBLIC_URL` | Public origin for webhook URL (optional; Settings tab can override) |
| `ISSUES_SYNC_DISABLED` | Set `1` to disable GitHub webhook/sync export |
| *(none)* | Platform spec pages and nav JSON always use `https://beskid-lang.org` |

Pair the tracker with the hub (see [COOLIFY.md](COOLIFY.md)). The hub’s GitHub OAuth app needs scopes **`read:user`** and **`repo`** (or **`public_repo`** for a public repository).

## Commands

| Command | Action |
|---------|--------|
| `bun install` | Install dependencies (`NODE_AUTH_TOKEN` or `.npmrc` with GitHub Packages `read:packages`; see [`.npmrc.example`](.npmrc.example)) |
| `bun run dev` | Dev server at http://localhost:3000 |
| `bun run build` | Production build (Nitro `.output`) |
| `bun run verify:client-bundle` | After build: assert client chunks omit SQLite/path APIs and CSS exists |
| `bun run start` | Production server on port 3000 |
| `bun run check` | Biome lint/format |

## Docker

**Coolify** (recommended): base directory **`/beskid_tracker`**, compose file [`docker-compose.yml`](docker-compose.yml) or [`infra/docker-compose.yml`](infra/docker-compose.yml). See **[COOLIFY.md](COOLIFY.md)** for secrets, volumes, and submodule settings.

**Local smoke test** (superrepo root, same image as production):

```bash
docker compose -f beskid_tracker/docker-compose.yml up --build
# or: docker compose -f beskid_tracker/infra/docker-compose.yml up --build
```

**Local dev** (hot reload, not the production image):

```bash
cd beskid_tracker
cp .env.example .env
bun install
bun run dev
```

Optional: [`docker-compose.local.yml`](docker-compose.local.yml) from `beskid_tracker/` (maps port 3000, bind-mounts `data/runtime`). Requires running `docker compose` from the superrepo root so `context: ..` resolves correctly.

Runtime requires `AUTH_HUB_PUBLIC_URL`, `SESSION_SECRET`, and hub pairing (see [COOLIFY.md](COOLIFY.md)).

### Coolify secrets

- `AUTH_HUB_PUBLIC_URL`
- `SESSION_SECRET`
- Optional: `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`, `GITHUB_SYNC_TOKEN` or `GITHUB_PUBLIC_READ_TOKEN`
- Persistent volume on `data/runtime` (or `TRACKER_DATA_DIR`) so tracker data survives redeploys

Build uses `SKIP_ENV_VALIDATION=1`; validation runs at runtime when the container starts.

## Routes

| Path | Purpose |
|------|---------|
| `/` | Delivery timeline (public) |
| `/bugs` | **Public bug tracker** (open issues labeled `bug`; report via in-app dialog when signed in) |
| `/v/$version` | Global version kanban (all workstreams; auth required) |
| `/v/$version/w/$workstream` | Per-workstream kanban (auth required) |
| `/workstreams/v/$version` | Workstream summary cards (auth required) |
| `/versions/$version/workstreams/$slug` | Workstream catalog overview (auth required) |
| `/login` | Sign in via auth hub |
| `/docs/catalog` | Platform-spec catalog (all documents, including ADRs) |
| `/docs/proposals` | Spec change proposals (draft → validate → PR) |

Sidebar **Bugs** is global (no delivery version). **Hub** opens the cross-site Beskid services overlay (shared with docs and pckg).

## Permissions

- Any signed-in collaborator can create and move issues.
- **Repository owner** (or org admin): define new `roadmap/version/*` labels and approve spec linkages (`roadmap/spec-approval/*`).

## Seed catalog (git-derived)

Historical completed work for **v0.0–v0.3** lives under [`data/`](data/) as JSON (one file per entity). See [`data/README.md`](data/README.md). Validate with `bun run seed:validate`.

Import into SQLite via Settings or `importCatalogBundleFn`. Validate seed JSON with `bun run seed:validate`.

## Layout

- `src/routes/` — UI and `/api/auth/*` server routes
- `src/server/` — `createServerFn` handlers (`roadmap.ts`, `issues.ts`, `public-bugs.ts`)
- `src/lib/storage/` — SQLite schema and repositories
- `src/lib/sync/` — GitHub webhook inbound + export outbox
- `src/lib/tracker/` — domain model, import, read/write services
- `src/routes/api/webhooks/` — GitHub issue webhook receiver
- `src/lib/github/` — label encoding for GitHub export, permissions, filters
- `src/lib/seed/` — Zod schemas, disk loader, `RoadmapTask` mapping
- `src/lib/platform-spec/` — spec relations block, nav search, and **docs management** (full catalog + per-doc bundles from `/generated/platform-spec-catalog.json`, proposal drafts in SQLite, PR submit via GitHub API)

## UI packages vs app components

Shared **design-system** primitives live in [`@beskid/ui-react`](../beskid_web_common/packages/beskid-ui-react) (Button, Input, Sheet, theme CSS). The tracker imports them via path aliases (`#/components/ui/*` → the package) so shadcn-style imports stay consistent across Beskid apps.

**App-specific** UI remains under `src/components/`: kanban board, roadmap navigation, report forms, subtasks, OpenSpec relation editors, catalog import, app shell, and ReUI wrappers. These modules encode tracker domain behavior and remain separate from generic shared UI primitives.

## Auth flow

1. `GET /api/auth/github` — redirect to auth hub (`/login?app=tracker`)
2. Hub OAuth → `GET /api/auth/hub-finish` — verify handoff, set session cookie, redirect `/v/v0.2`
3. `POST /api/auth/logout` — clear session
4. `/` is public; kanban and workstreams require sign-in
