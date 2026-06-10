# Coolify: Beskid Platform Spec

The platform-spec editor runs as the **`platform-spec`** service in the production Coolify compose stack.

## Delivery model (GHCR + Compose)

| Layer | Responsibility |
|-------|----------------|
| **GitHub Actions** | Push `ghcr.io/cyber-nomad-collective/beskid-platform-spec` |
| **beskid_infra** | Unified compose + OpenBao env sync |
| **OpenBao** | `secret/beskid/production/platform-spec` |

Operator guide: [beskid_infra/docs/deploy-compose.md](../../beskid_infra/docs/deploy-compose.md) · [deploy-matrix.md](../../beskid_infra/docs/deploy-matrix.md) · [openbao-layout.md](../../beskid_infra/docs/openbao-layout.md).

## Compose entry

| Mode | File |
|------|------|
| **Platform stack** | [`beskid_infra/compose/production/docker-compose.yml`](../../beskid_infra/compose/production/docker-compose.yml) |
| **Local dev** | [`docker-compose.yml`](docker-compose.yml) |

## Runtime secrets

Managed in **OpenBao** and synced to Coolify by `coolify-sync-env-from-openbao.sh`. Do not duplicate secrets in the Coolify UI after sync is enabled.

| Variable | Required | Notes |
|----------|----------|--------|
| `AUTH_HUB_PUBLIC_URL` | yes | Shared [auth hub](../auth/COOLIFY.md) |
| `SESSION_SECRET` | yes | ≥32 chars; session cookies |
| `MEMGRAPH_URI` | yes | Bolt URI to Memgraph (e.g. `bolt://memgraph:7687`) |
| `PLATFORM_SPEC_PUBLIC_URL` | recommended | Public origin for pairing and webhooks |
| `GITHUB_REPO_OWNER` / `GITHUB_REPO_NAME` | yes | Normative spec repo (default `Cyber-Nomad-Collective/beskid_normative_spec`) |
| `GITHUB_OAUTH_REPO_OWNER` / `GITHUB_OAUTH_REPO_NAME` | optional | Beskid OAuth home repo; admins may set normative repo link in UI (default `Cyber-Nomad-Collective/beskid`) |
| `GITHUB_SYNC_TOKEN` | optional | Server-side GitHub API PAT |
| `GITHUB_WEBHOOK_SECRET` | optional | Verifies GitHub webhooks |
| `PLATFORM_SPEC_MODERATOR_LOGINS` | optional | Comma-separated GitHub logins with moderator role |
| `PLATFORM_SPEC_PAIRING_APPROVER_LOGIN` | optional | Default pairing approver when no admin session |
| `PLATFORM_SPEC_SETUP_TOKEN` | optional | Protects re-running setup when already paired |
| `SPEC_GIT_REPO_URL` | recommended | GitHub repo to clone for JSON workspace sync |
| `SPEC_GIT_REF` | optional | Branch or tag (default `main`) |
| `SPEC_SYNC_MODE` | optional | `json` (default) or `mdx-legacy` |

## Memgraph

Canonical spec snapshots and draft changes live in **Memgraph**. Production sync: git clone of the superrepo (requires `SPEC_GIT_REPO_URL` + `GITHUB_SYNC_TOKEN`) → JSON import via `POST /api/v1/admin/sync` or PR merge webhook. Legacy: `bun run import:mdx` from website MDX tree.

## Service pairing

1. Deploy and complete [auth hub](../auth/COOLIFY.md) onboarding.
2. Hub admin: **Admin → Service pairing → New** — app `platform-spec`, public URL = `PLATFORM_SPEC_PUBLIC_URL`.
3. Complete pairing from the platform-spec onboarding flow (same pattern as tracker and Nexus).

## Production runtime

The image runs the TanStack Start app via **Nitro** (`bun run .output/server/index.mjs`), not `vite preview`. Rebuild and redeploy after changing `vite.config.ts` or the Dockerfile.

Build runs `bun run verify:client-bundle` (CSS on disk matches SSR router + no secrets in client JS). After deploy:

1. Pin `IMAGE_TAG` to the new `sha-*` from CI.
2. `curl -s https://platform-spec.beskid-lang.org:8460/api/health` — must return `{ "ok": true, "checks": { "memgraph": true } }`.

## Health

`wget -q --spider http://127.0.0.1:8460/api/health`
