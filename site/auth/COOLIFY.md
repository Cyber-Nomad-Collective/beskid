# Production: Beskid authentication

Authentik runs in the standalone production Compose stack and is the sole browser identity authority.

## Delivery model

| Layer | Responsibility |
|-------|----------------|
| **Runtime** | Pinned Authentik services in `beskid_sites/deploy/docker-compose.yml` |
| **Deployment script** | OpenBao-backed host environment sync and Compose apply |
| **OpenBao** | `secret/beskid/production/auth` |

Operator guide: [`beskid_sites/deploy/README.md`](../../beskid_sites/deploy/README.md).

Normative contract: [Beskid standard](https://beskid-lang.org/docs/standard/) (issuer `beskid-auth-hub`, `AUTH_HUB_*` variables).

## Compose entry

| Mode | File |
|------|------|
| **Platform stack** | [`beskid_sites/deploy/docker-compose.yml`](../../beskid_sites/deploy/docker-compose.yml) |

## Runtime secrets

Managed in **OpenBao** and materialized by `beskid_sites/deploy/deploy.sh`. Do not commit or duplicate secrets in repository configuration.

Required keys: `SESSION_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `AUTH_HUB_PUBLIC_URL` (`https://auth.beskid-lang.org`).

Optional: `AUTH_SETUP_TOKEN` — required to re-run `/onboarding` or `POST /api/v1/admin/setup` when already onboarded.

## Volume

`auth-data` → `/app/site/auth/data/runtime` (see compose production README for legacy volume adoption).

Hub admins are stored in SQLite (`hub_settings.admin_github_logins`). If you are not admin after deploy:

1. Ask an existing hub admin to add your GitHub login under **Administration → Hub admins**, or
2. `POST /api/v1/admin/setup` with `AUTH_SETUP_TOKEN` and your login in `adminGitHubLogins`, or
3. Clear `admin_github_logins` in the hub DB and sign in again (first sign-in becomes admin).

## Pairing

Tracker, Nexus, and pckg use `AUTH_HUB_PUBLIC_URL` pointing at this hub.

## Production runtime

The image runs the TanStack Start app via **Nitro** (`bun run .output/server/index.mjs`), not `vite preview`. Rebuild and redeploy the compose service after changing `vite.config.ts` or the Dockerfile.

Build runs `bun run verify:client-bundle` (CSS on disk matches SSR router + no secrets in client JS). After deploy:

1. Pin `IMAGE_TAG` to the new `sha-*` from CI (avoid stale floating `main` if an old container is still running).
2. `curl -s https://auth.beskid-lang.org/ | strings | grep styles-` then `curl -I` that URL — must be **200**.
