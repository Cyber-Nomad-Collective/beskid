# Coolify: Beskid auth hub

The auth hub runs as the **`auth`** service in the production Coolify compose stack.

## Delivery model (GHCR + Compose)

| Layer | Responsibility |
|-------|----------------|
| **GitHub Actions** | Push `ghcr.io/cyber-nomad-collective/beskid-auth` |
| **beskid_infra** | Unified compose + OpenBao env sync |
| **OpenBao** | `secret/beskid/production/auth` |

Operator guide: [beskid_infra/docs/deploy-compose.md](../../beskid_infra/docs/deploy-compose.md) · [openbao-layout.md](../../beskid_infra/docs/openbao-layout.md).

## Compose entry

| Mode | File |
|------|------|
| **Platform stack** | [`beskid_infra/compose/production/docker-compose.yml`](../../beskid_infra/compose/production/docker-compose.yml) |
| **Single-service reference** | [`docker-compose.yml`](docker-compose.yml) |

## Runtime secrets

Managed in **OpenBao** and synced to Coolify by `coolify-sync-env-from-openbao.sh`. Do not duplicate secrets in the Coolify UI after sync is enabled.

Required keys: `SESSION_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `AUTH_HUB_PUBLIC_URL` (`https://auth.beskid-lang.org`).

## Volume

`auth-data` → `/app/site/auth/data/runtime` (see compose production README for legacy volume adoption).

## Pairing

Tracker, Nexus, and pckg use `AUTH_HUB_PUBLIC_URL` pointing at this hub.

## Production runtime

The image runs the TanStack Start app via **Nitro** (`bun run .output/server/index.mjs`), not `vite preview`. Rebuild and redeploy the compose service after changing `vite.config.ts` or the Dockerfile.
