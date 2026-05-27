# Coolify: Beskid auth hub

Application: **beskid auth** (`Cyber-Nomad-Collective/beskid`).

## Delivery model (GHCR + GitHub Actions + OpenTofu)

| Layer | Responsibility |
|-------|----------------|
| **GitHub Actions** (`.github/workflows/container-images.yml`) | Push `main`/`staging`: `ghcr.io/cyber-nomad-collective/beskid-auth` |
| **beskid_infra** | Staging pilot and production apps via `modules/coolify_image_app`; secrets from `secret/beskid/{staging,production}/auth` |
| **Coolify** | Image-only — [`docker-compose.yml`](docker-compose.yml) (GHCR pull) |

Operator guides: [beskid_infra/docs/coolify-import.md](https://github.com/Cyber-Nomad-Collective/beskid_infra/blob/main/docs/coolify-import.md), [openbao-layout.md](https://github.com/Cyber-Nomad-Collective/beskid_infra/blob/main/docs/openbao-layout.md).

## Compose entry

| Mode | File |
|------|------|
| **Image deploy** | [`docker-compose.yml`](docker-compose.yml) |
| **Local build** | [`docker-compose.build.yml`](docker-compose.build.yml) |

## Runtime secrets

Managed in **OpenBao** and applied by OpenTofu (`coolify_envs_bulk`). Do not duplicate in Coolify UI after migration.

| Variable | Required | Notes |
| --- | --- | --- |
| `AUTH_HUB_PUBLIC_URL` | yes | e.g. `https://auth.beskid-lang.org` (staging: separate URL) |
| `SESSION_SECRET` | yes | 32+ chars |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `GITHUB_OAUTH_CALLBACK_URL` | yes* | Staging uses a separate GitHub OAuth app |
| `AUTH_SETUP_TOKEN` | recommended | |
| `AUTH_DATA_DIR` | optional | Default `data/runtime` — mount volume |
| `PORT` | optional | Default `8090` |
| `IMAGE_TAG` | yes (image compose) | `main` or `staging` |

\*OAuth app credentials can alternatively be saved via `/onboarding` into SQLite (encrypted with `SESSION_SECRET`).

## Architecture

- **GitHub OAuth** runs only on the hub.
- **GitHub access tokens** stay in hub `user_sessions` (never sent to consumers).
- Consumers call **`/api/v1/github/*`** with the user’s hub JWT from login handoff.
- **Service pairing** issues a per-app `serviceToken` (stored on the consumer once).

## Service pairing

1. Complete hub onboarding (`/onboarding`).
2. Hub admin: **Admin → Service pairing → New** — enter consumer public URL; share approve link with app owner.
3. App owner approves on the consumer (tracker, nexus, pckg).
4. Consumers deploy with **`AUTH_HUB_PUBLIC_URL` only**.

## Health

`wget -q --spider http://127.0.0.1:8090/api/v1/health`

Map public domain to port **8090**.

## Related

- [Docs site](../COOLIFY.md)
- [Tracker](../../beskid_tracker/COOLIFY.md)
- [Nexus](../../beskid_nexus/COOLIFY.md)
