# Coolify: Beskid Tracker

Application: **beskid tracker** (`Cyber-Nomad-Collective/beskid_tracker`, branch `main`, repository root).

## Compose entry

**Coolify (GHCR):** [`docker-compose.coolify.yml`](docker-compose.coolify.yml) — `ghcr.io/cyber-nomad-collective/beskid-tracker:${IMAGE_TAG}`

**Local build:** [`docker-compose.yml`](docker-compose.yml)

## Build

- **GitHub Actions** builds and pushes the image (`.github/workflows/container-images.yml`); Coolify pulls only.
- **`NODE_AUTH_TOKEN`** is a GitHub Actions secret for build, not a Coolify build secret.

## Runtime secrets

Set in Coolify **Environment Variables** (runtime-only secrets: uncheck **Available at buildtime**).

| Variable | Required | Notes |
|----------|----------|--------|
| `AUTH_HUB_PUBLIC_URL` | yes | Shared [auth hub](../site/auth/COOLIFY.md) — **one** GitHub OAuth app on the hub |
| `SESSION_SECRET` | yes | ≥32 chars; tracker session cookies |
| `GITHUB_REPO_OWNER` / `GITHUB_REPO_NAME` | yes | Target repository |
| `TRACKER_PUBLIC_URL` | recommended | Public origin (webhooks, pairing `publicUrl`) |
| `GITHUB_PUBLIC_READ_TOKEN` | optional | Anonymous GitHub reads when not signed in |
| `GITHUB_SYNC_TOKEN` | optional | Background sync PAT |
| `GITHUB_WEBHOOK_SECRET` | optional | Verifies GitHub webhooks |

Do **not** set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, or `GITHUB_OAUTH_CALLBACK_URL` on the tracker.

## Service pairing

1. Deploy and complete [auth hub](../site/auth/COOLIFY.md) onboarding (GitHub OAuth + hub admin).
2. Hub admin: **Admin → Service pairing → New** — app `tracker`, public URL = `TRACKER_PUBLIC_URL` (e.g. `https://tracker.beskid-lang.org`).
3. Open **`/settings/auth/pair`** (or `/onboarding`, which redirects there). Enter auth hub URL, pairing code, tracker public URL, and your GitHub login as approver — same fields as Nexus **Connect Beskid Auth**.
4. Hub pairing links (`/settings/auth/pair?code=…`) redirect to `GET /api/auth/pair` for server-side approve when approver login is stored (setup wizard) or `TRACKER_PAIRING_APPROVER_LOGIN` / `GITHUB_SYNC_TOKEN` is set.
5. Sign-in: `/login` → hub GitHub OAuth → `/api/auth/hub-finish` → tracker session.

Optional: `TRACKER_SETUP_TOKEN` — required to re-run setup when already paired.

## Production runtime

The GHCR image runs **Nitro** (`bun run .output/server/index.mjs`), not `vite preview`, so reverse-proxy hostnames work without `preview.allowedHosts`. Rebuild `beskid-tracker` after Dockerfile or `vite.config.ts` changes.

After deploy, confirm static assets:

1. Pin `IMAGE_TAG` to the new `sha-*` from CI (avoid stale floating `main` if an old container is still running).
2. Open the site, note the hashed `/assets/styles-*.css` URL in the document (or `curl -s … | strings | grep styles-`), and verify it returns HTTP **200**. A 404 usually means SSR HTML references a stylesheet hash that is not in the running image — rebuild/redeploy with a fresh tag.

CI and the Docker image run `bun run build` (includes `sync-root-stylesheet.sh`) and `bun run verify:client-bundle` before push.

## Health

`wget -q --spider http://127.0.0.1:3000/api/health` (adjust port if overridden)

## Local smoke

```bash
cp .env.example .env
# Start site/auth on :8090, complete onboarding, pair tracker
bun install && bun run dev
```

## Platform matrix

Cross-service URLs, OpenBao paths, and shared auth variables: [beskid_infra/docs/deploy-matrix.md](../beskid_infra/docs/deploy-matrix.md).
