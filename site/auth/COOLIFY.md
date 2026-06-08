# Coolify: Beskid auth hub

The auth hub runs as the **`auth`** service in the production Coolify compose stack.

## Delivery model (GHCR + Compose)

| Layer | Responsibility |
|-------|----------------|
| **GitHub Actions** | Push `ghcr.io/cyber-nomad-collective/beskid-auth` |
| **beskid_infra** | Unified compose + OpenBao env sync |
| **OpenBao** | `secret/beskid/production/auth` |

Operator guide: [beskid_infra/docs/deploy-compose.md](../../beskid_infra/docs/deploy-compose.md) · [deploy-matrix.md](../../beskid_infra/docs/deploy-matrix.md) · [openbao-layout.md](../../beskid_infra/docs/openbao-layout.md).

Normative contract: [platform-spec/tooling/auth-hub/](https://beskid-lang.org/platform-spec/tooling/auth-hub/) (issuer `beskid-auth-hub`, `AUTH_HUB_*` variables).

## Compose entry

| Mode | File |
|------|------|
| **Platform stack** | [`beskid_infra/compose/production/docker-compose.yml`](../../beskid_infra/compose/production/docker-compose.yml) |
| **Single-service reference** | [`docker-compose.yml`](docker-compose.yml) |

## Runtime secrets

Managed in **OpenBao** and synced to Coolify by `coolify-sync-env-from-openbao.sh`. Do not duplicate secrets in the Coolify UI after sync is enabled.

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
