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
| `GITHUB_REPO_OWNER` / `GITHUB_REPO_NAME` | yes | Beskid superrepo that contains canonical `openspec/` (default `Cyber-Nomad-Collective/beskid`) |
| `GITHUB_OAUTH_REPO_OWNER` / `GITHUB_OAUTH_REPO_NAME` | optional | Beskid OAuth home repo (default `Cyber-Nomad-Collective/beskid`) |
| `GITHUB_WEBHOOK_SECRET` | optional | Verifies GitHub webhooks |
| `PLATFORM_SPEC_MODERATOR_LOGINS` | optional | Comma-separated GitHub logins with moderator role |
| `PLATFORM_SPEC_PAIRING_APPROVER_LOGIN` | optional | Default pairing approver when no admin session |
| `PLATFORM_SPEC_SETUP_TOKEN` | optional | Protects re-running setup when already paired |
| `OPENSPEC_ROOT` | optional | Runtime path to canonical OpenSpec data; the image sets `/app/openspec` |

## Memgraph

Canonical requirements live only in the image's root **OpenSpec** tree (`openspec/specs` plus `openspec/catalog.json`), which is the build-time authority. The image bakes a static seed generated from it, and the runtime serves that baked seed (upserted into its stores) rather than reading the canonical files directly on every request. Memgraph stores editorial drafts and derived graph caches; it is not a normative content store. Approved edits create an `openspec/changes/<change>/` pull request in the Beskid superrepo, and a subsequent image build publishes the merged standard.

## Seeding and migrations

OpenSpec is the native shape. The image bakes a statically generated JSON seed workspace (`seed/*.json`) at build time, and the container entrypoint upserts it into the runtime stores before the server starts:

- **SQLite** settings DB (`spec_capability`, `spec_layout`, `spec_seed_meta`) — always, via idempotent `INSERT ... ON CONFLICT DO UPDATE` migrations.
- **Memgraph** domain -> area -> feature graph — when `MEMGRAPH_URI` is set, via `MERGE` (graph-native upsert).

Seeding is idempotent: re-running an unchanged revision is a no-op, and a changed revision converges in place (stale capabilities/nodes are pruned). No manual migration step is required on deploy or redeploy.

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
