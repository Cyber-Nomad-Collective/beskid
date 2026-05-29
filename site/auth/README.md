# Beskid auth hub (TanStack Start)

Central **GitHub OAuth** and account UI for [Tracker](../../beskid_tracker/), [Nexus](../../beskid_nexus/), and [pckg](../../pckg/).

Consumers do **not** register their own GitHub OAuth apps. They only need:

1. **`AUTH_HUB_PUBLIC_URL`** — this service’s public URL  
2. **Pairing** — hub admin issues a code per app; the consumer stores the returned **service token**  
3. **Sign-in** — redirect users to `/login?app=…` → hub OAuth → consumer `/api/auth/hub-finish`

GitHub access tokens stay on the hub. TypeScript apps call GitHub through **`/api/v1/github/*`** using the handoff JWT (`hubUserToken`).

## Packages

| Package | Role |
| --- | --- |
| [`@beskid/auth-client`](../../beskid_web_common/packages/beskid-auth-client/) | Handoff JWT, login URL, GitHub proxy base URL |
| [`@beskid/ui-react`](../../beskid_web_common/packages/beskid-ui-react/) | Shared auth/account UI (shadcn + Material tokens) |

## Hub admins

- **Bootstrap:** If no admins are configured, the **first successful GitHub OAuth sign-in** (any app) becomes hub admin.
- **Onboarding:** Admin GitHub logins are optional on `/onboarding`; leave empty to rely on bootstrap.
- **Management:** Signed-in admins use **Administration → Hub admins** (`/admin`) or `GET/POST/DELETE /api/v1/admin/admins`.
- **Recovery:** If you are locked out, an existing admin can add you, or re-run `POST /api/v1/admin/setup` with `AUTH_SETUP_TOKEN`, or clear `admin_github_logins` in the hub SQLite volume and sign in again (bootstrap runs).

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Service picker |
| `/login?app=tracker\|nexus\|pckg\|hub` | Start GitHub OAuth |
| `/callback` | OAuth callback → handoff or hub session |
| `/profile`, `/account` | Signed-in GitHub profile |
| `/onboarding` | First-run hub setup (GitHub OAuth app) |
| `/admin` | Hub administration (admins, pairing link) |
| `/admin/pairing` | Service pairing codes |
| `/api/v1/github/*` | GitHub API proxy for paired apps |
| `/api/v1/pairing/*` | Pairing approve/status |

## Local run

```bash
cd site/auth
cp .env.example .env   # GITHUB_* + SESSION_SECRET + AUTH_HUB_PUBLIC_URL
bun install
bun run dev
```

Open `http://localhost:8090`. Complete `/onboarding` on first boot (admin logins optional — first GitHub sign-in becomes admin if empty).

## Build verification

```bash
bun run build              # runs sync-root-stylesheet.sh after Vite/Nitro
bun run verify:client-bundle
bun run test
```

## Consumer checklist

| App | Sign-in entry | Hub finish URL | Pairing (admin) |
| --- | --- | --- | --- |
| Tracker | `/api/auth/github` | `/api/auth/hub-finish` | `/settings/auth/pair` |
| Nexus | `/api/auth/github` | `/api/auth/hub-finish` | `POST /api/admin/auth/pair` or setup wizard |
| pckg | `/api/auth/github` | `/api/auth/hub-finish` | `POST /api/auth/hub/pair` |

Pairing `publicUrl` is the app origin (e.g. `https://tracker.example.com`); handoff redirects to `{publicUrl}/api/auth/hub-finish?handoff=…`.

Deploy: [COOLIFY.md](COOLIFY.md)
