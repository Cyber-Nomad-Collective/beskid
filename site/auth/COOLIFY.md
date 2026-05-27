# Coolify: Beskid auth hub

Application: **beskid auth** (`Cyber-Nomad-Collective/beskid`, branch `main`, base directory `/site/auth`).

TanStack Start app (Bun). **Build context is the superrepo root** — requires `beskid_web_common` packages at build time.

## Compose entry

[`docker-compose.yml`](docker-compose.yml)

## Runtime secrets

| Variable | Required | Notes |
| --- | --- | --- |
| `AUTH_HUB_PUBLIC_URL` | yes | e.g. `https://auth.beskid-lang.org` |
| `SESSION_SECRET` | yes | 32+ chars; hub cookies, encrypted SQLite fields |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `GITHUB_OAUTH_CALLBACK_URL` | yes* | Prefer env vars (not stored in DB) |
| `AUTH_SETUP_TOKEN` | recommended | Protects re-setup when already onboarded |
| `AUTH_DATA_DIR` | optional | Default `data/runtime` — mount volume; stores `auth.sqlite` |
| `PORT` | optional | Default `8090` |

\*OAuth app credentials can alternatively be saved via `/onboarding` into SQLite (encrypted with `SESSION_SECRET`).

## Architecture

- **GitHub OAuth** runs only on the hub.
- **GitHub access tokens** stay in hub `user_sessions` (never sent to consumers).
- Consumers call **`/api/v1/github/*`** (transparent proxy to `api.github.com`) with the user’s hub JWT from login handoff.
- **Service pairing** issues a per-app `serviceToken` (stored on the consumer once); used to verify handoff JWTs and proxy auth.

## Service pairing

1. Complete hub onboarding (`/onboarding`).
2. Hub admin: **Admin → Service pairing → New** — enter consumer public URL; share approve link with app owner.
3. App owner approves on the consumer (tracker: `/settings/auth/pair`, nexus: `POST /api/admin/auth/pair`, pckg: `POST /api/auth/hub/pair`).
4. Consumer stores `serviceToken` locally. Deploy with **`AUTH_HUB_PUBLIC_URL` only** on consumers.

## Health

`wget -q --spider http://127.0.0.1:8090/api/v1/health`

Map public domain to port **8090**.

## Related

- [Tracker](../../beskid_tracker/COOLIFY.md)
- [Nexus](../../beskid_nexus/COOLIFY.md)
- [Docs site](../COOLIFY.md)
