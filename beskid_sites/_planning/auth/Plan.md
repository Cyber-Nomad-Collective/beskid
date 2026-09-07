# Service: site/auth (being retired)

> `site/auth` is being **retired**. Authelia replaces it as the OIDC
> provider for all Beskid apps, with GitHub as the sole identity provider.
> The GitHub-token proxy companion described in the original research is
> **DROPPED** (zero references in the implemented shell-template). See
> Current Status.

## Current Status

**`site/auth`: being retired (master Plan Phase 1).** The bespoke TanStack
Start auth hub at `site/auth` is fully replaced by Authelia acting as an
OIDC provider. The shell-template app (`apps/shell-template`) is an OIDC
client of Authelia; all five deployed service apps consume that contract.

- **Deployed:** `site/auth` is still live at `auth.beskid-lang.org:8090`
  (legacy) while the Authelia cutover is in progress. It will be removed
  once all five services are switched from `SHELL_AUTH_MODE=mock` to
  `SHELL_AUTH_MODE=authelia`.
- **What's working:**
  - Authelia contract implemented in `apps/shell-template/docs/authelia.md`
    and `apps/shell-template/compose/authelia/configuration.yml`.
    Authelia is the OIDC provider; GitHub is the sole identity provider
    (`authentication_backend.oauth2: provider: github`), reusing the
    **existing** Beskid GitHub OAuth App (the one `site/auth` used). No
    local password/email store.
  - Shell-template OIDC client: authorization-code flow, ID token
    verification against Authelia's JWKS (RS256, `jose`), claims sealed
    into an HS256 session cookie `beskid_shell_session` signed with
    `SESSION_SECRET` (7d TTL). `src/server/oidc.ts` +
    `src/server/shell-session.ts` + `src/server/authelia-middleware.ts`
    (`resolveShellUser` / `requireShellUser` / `requireShellGroup`).
  - Per-app OIDC client registrations for all 5 deployed apps
    (`website`, `platform-spec`, `tracker`, `pckg`, `nexus`) exist as
    commented example entries in `configuration.yml`; uncomment + set
    per-app `*_OIDC_CLIENT_SECRET` from OpenBao during Phase 1 cutover.
    `learn` is also pre-listed for its future migration (master Plan
    Phase 7).
  - `ShellUser` shape: `{ username, email?, name?, groups, avatarUrl? }`.
    `avatarUrl` is **not** from Authelia; the template falls back to
    `https://github.com/<username>.png` (works without a token). Consuming
    apps that need the real GitHub avatar override the `UserMenu` trigger.
  - Admin status is an Authelia group membership (`beskid-admins`),
    delivered in the ID token `groups` claim — not a runtime bootstrap.
  - Mock mode (`SHELL_AUTH_MODE=mock`, default outside production) returns
    a fixed fake user so local dev works without an Authelia instance.
- **What's dropped (confirmed — zero references):**
  - **The GitHub-token proxy companion is DROPPED.** The original research
    proposed a thin Authelia-authenticated `/api/v1/github/*` proxy
    companion backed by a Postgres `github_tokens` table (AES-256-GCM),
    preserving the "tokens never leave the hub" property. This is
    **abandoned**: no code, no references in the implemented
    shell-template, no Postgres `github_tokens` table. Consumer apps that
    need GitHub access use a **service-level** token (e.g.
    `GITHUB_SYNC_TOKEN`) rather than per-user tokens. The historical
    vault/proxy research below is retained as context only and is **not**
    to be built.
  - `@beskid/auth-client` (handoff JWT, `verifyHandoffToken`,
    `issueHandoffToken`, `buildLoginUrl`, `githubProxyBaseUrl`,
    `BeskidAuthClient`) becomes dead code; it will be deprecated on
    GitHub Packages as part of Phase 1 cutover. The shell-template auth
    module lives in `apps/shell-template/src/server/*`, not in a
    republished `@beskid/*` package.
- **Pending:**
  - Authelia production deployment (master Plan Phase 1). All five
    services still run with `SHELL_AUTH_MODE=mock`.
  - GitHub OAuth App callback URL registration for Authelia
    (`${AUTHELIA_OIDC_ISSUER}/api/oidc/callback`) — human step.
  - OpenBao seeding of Authelia secrets (`AUTHELIA_SESSION_SECRET`,
    `AUTHELIA_STORAGE_ENCRYPTION_KEY`, `AUTHELIA_OIDC_HMAC_SECRET`,
    `AUTHELIA_OIDC_JWKS_SECRET`) + per-app `*_OIDC_CLIENT_SECRET` —
    human, fail closed.
  - OpenSpec change retiring `tooling--auth-hub--design-model` and
    `tooling--auth-hub--contracts-and-edge-cases` and introducing an
    Authelia-based auth capability with SHALL requirements (per AGENTS.md:
    update spec before observable behavior changes).
  - Document the Authelia group lockout recovery procedure (no
    first-sign-in bootstrap under Authelia — if `beskid-admins` is
    misconfigured, recovery is a manual Authelia admin action).
  - Retire `site/auth`: remove the `auth` Coolify service, the `auth-data`
    volume, the `beskid-auth` GHCR image, OpenBao path
    `secret/beskid/production/auth` (after the new Authelia secrets are in
    their own paths). Update `COOLIFY.md`, `beskid_infra/docs/deploy-matrix.md`,
    and regenerate `openspec/catalog.json` (platform-spec reads it at
    build time).
- **Human steps needed:**
  - GitHub OAuth App callback URL registration (above).
  - OpenBao seeding (above).
  - Per-app OIDC client secret generation + registration in
    `configuration.yml` (one `openssl rand -hex 32` per app, stored in
    OpenBao per-service paths).
  - Authelia group lockout recovery documentation.

The "What Authelia replaces" mapping and the historical vault/proxy
research below are retained as the planning basis; the vault/proxy section
is **superseded** by the drop decision.

---

Research-only plan for retiring `site/auth` in favor of Authelia (GitHub login).
All claims are grounded in files under `site/auth/`, `beskid_web_common/packages/beskid-auth-client/`,
`beskid_tracker/src/`, and `openspec/specs/tooling--auth-hub--*`.

> **Decision (2026-08):** The GitHub-token proxy companion described below
> is **abandoned**. Authelia + the existing GitHub OAuth App is the **sole**
> auth path. There is no centralized GitHub-access-token vault, no
> `/api/v1/github/*` proxy companion, no AES-256-GCM token porting, and no
> "future companion service". The shell-template app is an **OIDC client** of
> Authelia (authorization-code flow); GitHub is the only identity provider
> (configured on the Authelia side via `authentication_backend.oauth2`).
> Identity is delivered via a signed session cookie (HS256, `SESSION_SECRET`)
> sealed after the Authelia ID token is verified with `jose` — **not** via
> forward-auth headers. See `apps/shell-template/docs/authelia.md` for the
> implemented contract. The sections below are retained as historical
> research; the "What survives / must be reimplemented" GitHub-proxy-vault
> section is **superseded** by this decision.

## Current architecture

`site/auth` is a standalone TanStack Start (React 19 + Nitro `node-server`) app, `package.json:1`,
deployed as the Coolify `auth` service on `https://auth.beskid-lang.org:8090` (`COOLIFY.md:1`,
`docker-compose.yml:1`). It is the **single GitHub OAuth app** for the whole Beskid platform
(`README.md:1`): tracker, nexus, pckg, platform-spec, and learn never register their own GitHub
OAuth apps; they point at `AUTH_HUB_PUBLIC_URL` and consume handoff tokens issued here.

Surface inventory (all paths under `site/auth/`):

- **GitHub OAuth** — `src/server/github-oauth.ts:14` (`buildGitHubAuthorizeUrl`, scope `read:user repo`),
  `:26` (`exchangeGitHubCode`), `:63` (`fetchGitHubUser`). One OAuth app, configured via
  `/onboarding` or env (`GITHUB_CLIENT_*`, `.env.example:10`).
- **OAuth flow** — `src/server/oauth.server.ts:30` (`handleLoginGet`) and `:63`
  (`handleCallbackGet`): state cookie `beskid_auth_oauth_state` (`src/server/oauth-cookies.ts:3`),
  GitHub code exchange, then either a hub browser session (for `app=hub`) or a handoff JWT
  redirect to `{publicUrl}/api/auth/hub-finish?handoff=…` for consumers.
- **Hub browser session** — `src/server/session.ts:9` cookie `beskid_auth_session`, HS256 JWT signed
  with `SESSION_SECRET`, 7d TTL, claims just `{ sid }`; the session row lives in SQLite
  (`user_sessions`, `src/server/db/schema.ts:38`). `getSessionFromRequest` (`session.ts:50`) returns
  `{ sessionId, login, avatarUrl, name }`.
- **Handoff JWT (hubUserToken)** — issued at `oauth.server.ts:117` via
  `@beskid/auth-client` `issueHandoffToken` (`beskid_web_common/packages/beskid-auth-client/src/handoff.ts:30`),
  signed with the consumer's per-app **service token**, `iss: beskid-auth-hub`, 7d TTL, claims
  `{ app, sid, login, avatar_url, name?, sub? }`. Consumers verify with `verifyHandoffToken`
  (`handoff.ts:59`) and store the JWT in their own session cookie
  (see `beskid_tracker/src/lib/session/cookie.ts:14` — `hubUserToken` field).
- **GitHub API proxy** — `src/server/github-proxy.ts:60` (`proxyGitHubApi`) at
  `src/routes/api/v1/github/$.ts:1`. Consumers call `GET/POST/... /api/v1/github/*` with
  `Authorization: Bearer <hubUserToken>`; the hub resolves the session, pulls the encrypted GitHub
  access token (`src/server/repositories/user-sessions.ts:53` `getGithubTokenForSession`),
  decrypts it (`src/server/crypto.ts:34` AES-256-GCM, master key scrypt'd from `SESSION_SECRET`),
  and forwards the request to `api.github.com` with that token. **GitHub access tokens never leave
  the hub.**
- **Service pairing** — `src/server/repositories/pairing.ts:51` (`createPairingRequest`) and
  `:108` (`approvePairing`). Hub admin creates a 24h-TTL pairing code; the consumer approves at
  `{publicUrl}/settings/auth/pair?code=…` (or app-specific pair endpoint, `app-server.server.ts:98`
  `repairPaths`). On approval a 32-byte `service_token` is issued (`crypto.ts:55`), stored hashed in
  `paired_apps` and encrypted in `hub_settings` (`repositories/paired-apps.ts:42`). This token is
  the HS256 key for handoff JWTs.
- **Hub admin bootstrap & management** — `src/server/hub-admin-bootstrap.server.ts:31`
  (`promoteBootstrapAdminIfNeeded`): first successful GitHub sign-in becomes admin if none configured.
  `src/routes/api/v1/admin/admins.ts:1` (GET/POST/DELETE) and `src/server/hub-admin.ts:7`
  (`requireHubAdmin`). Admin list stored as JSON in `hub_settings.admin_github_logins`
  (`config-store.ts:29`).
- **Onboarding** — `src/routes/onboarding.tsx` + `src/routes/api/v1/admin/setup.ts:1`: first-run UI
  to register the GitHub OAuth app and seed admins; protected by `AUTH_SETUP_TOKEN` when re-run
  (`setup.ts:52`).
- **User-facing routes** — `/` service picker (`src/routes/index.tsx:1`), `/login` (`login.tsx:1`),
  `/callback` (`callback.tsx:1`), `/profile` (`profile.tsx:1`), `/account`, `/admin`
  (`admin/index.tsx:1`), `/admin/pairing`, `/api/v1/me` (`routes/api/v1/me.ts:1`),
  `/api/v1/apps`, `/api/v1/health`, `/api/auth/logout` (`routes/api/auth/logout.ts:1`).
- **Storage** — SQLite (`better-sqlite3`, `package.json:34`) at `data/runtime` (volume `auth-data`,
  `COOLIFY.md:34`). Schema v2 in `src/server/db/schema.ts:1`: `hub_settings`, `paired_apps`,
  `pairing_requests`, `pairing_audit`, `user_sessions` (encrypted GitHub tokens).
- **Shared packages consumed** — `@beskid/auth-client` (handoff JWT, app registry, issuer constant,
  `package.json:25`), `@beskid/ui-react` (ServicePicker, AuthPageShell, ProfileCard, Button, Card,
  `routes/index.tsx:1`, `profile.tsx:1`), `@beskid/beskid-ui` (Material theme CSS, `vite.config.ts:38`),
  `@beskid/server-observability` (`src/server/observability-middleware.ts:1`, service label
  `beskid-auth`).
- **Deploy** — GHCR image `ghcr.io/cyber-nomad-collective/beskid-auth` via `Dockerfile:1`,
  Nitro runtime `node .output/server/index.mjs` (`Dockerfile:60`), OpenBao path
  `secret/beskid/production/auth` (`COOLIFY.md:11`). Health check on `/api/v1/health` and `/`
  (`Dockerfile:56`).
- **Normative contract** — `openspec/specs/tooling--auth-hub--design-model/spec.md` and
  `openspec/specs/tooling--auth-hub--contracts-and-edge-cases/spec.md` define the issuer
  (`beskid-auth-hub`), handoff JWT claims, pairing lifecycle, hub admin rules, and the env contract.

## What Authelia replaces (itemize)

Authelia is a full identity/access-management reverse proxy with a GitHub OAuth identity provider
and forward-auth. The following `site/auth` surfaces are **directly redundant** once Authelia fronts
all beskid apps:

| site/auth surface | File | Replaced by Authelia how |
|---|---|---|
| GitHub OAuth app + authorize/token exchange | `src/server/github-oauth.ts:14,26` | Authelia's GitHub identity provider (`identity_providers.oauth2` + GitHub backend); one OAuth app registered with Authelia, not the hub. |
| `/login?app=…` start + `/callback` code exchange | `src/server/oauth.server.ts:30,63`, `routes/login.tsx`, `routes/callback.tsx` | Authelia's `/login` portal and OAuth callback; consumers redirect to Authelia via forward-auth, not to `/login?app=`. |
| OAuth state cookie | `src/server/oauth-cookies.ts:3` | Authelia manages its own CSRF/state internally. |
| Hub browser session cookie `beskid_auth_session` | `src/server/session.ts:9` | Authelia session cookie (default `authelia_session`) + forward-auth validation per request. |
| `user_sessions` table (encrypted GitHub tokens, hub-side sessions) | `src/server/db/schema.ts:38`, `repositories/user-sessions.ts:1` | Authelia manages sessions in its own store (Postgres). The GitHub access token, if still needed, moves to a Postgres table owned by the surviving proxy companion (see next section), not by Authelia. |
| Hub admin bootstrap (first sign-in becomes admin) | `hub-admin-bootstrap.server.ts:31` | Authelia access control via groups/ACL; admins defined in Authelia user store, not bootstrapped at runtime. |
| Hub admin management UI + `/api/v1/admin/admins` | `routes/admin/index.tsx:1`, `routes/api/v1/admin/admins.ts:1`, `hub-admin.ts:7` | Authelia admin users configured declaratively (file/DB); no runtime add/remove UI needed in a beskid app. |
| `/onboarding` first-run OAuth app registration | `routes/onboarding.tsx`, `routes/api/v1/admin/setup.ts:1` | Authelia config is declarative (`configuration.yml`); the GitHub OAuth client id/secret and admin list are set at deploy time, not via a first-run wizard. |
| `/profile`, `/account`, `/` service picker, `/api/v1/me` | `routes/profile.tsx:1`, `routes/index.tsx:1`, `routes/api/v1/me.ts:1` | Authelia provides user profile in its portal; the shell-template reads user data from Authelia headers (see contract below). The service picker is redundant under SSO. |
| `/api/v1/apps` (registered consumer apps) | `routes/api/v1/apps.ts:1` | Replaced by Authelia ACL config listing which apps exist; not a runtime concern of an auth app. |
| `/api/auth/logout` | `routes/api/auth/logout.ts:1` | Authelia `/logout` endpoint; the shell-template just links to it. |
| Pairing flow (pairing requests, approve, audit) | `repositories/pairing.ts:1`, `routes/api/v1/pairing/*`, `admin/pairing/` | Pairing's purpose was to authorize a consumer app to trust the hub's handoff JWTs and to mint a per-app `service_token`. Under Authelia, trust between consumer apps and the auth layer is enforced by Authelia's forward-auth (the consumer accepts any request Authelia has validated). Per-app service tokens and pairing codes have no role. |
| `paired_apps` table + `service_token` store | `db/schema.ts:62`, `repositories/paired-apps.ts:42` | Obsolete: no per-app HS256 signing keys needed when there is no handoff JWT. |
| Handoff JWT issuance | `oauth.server.ts:117` via `@beskid/auth-client` `issueHandoffToken` (`handoff.ts:30`) | Obsolete: Authelia delivers identity via headers, not a signed JWT the consumer must verify with a shared secret. |
| `@beskid/auth-client` `verifyHandoffToken`, `issueHandoffToken`, `buildHandoffFinishUrl`, `AUTH_HUB_ISSUER`, `HUB_USER_TOKEN_TTL_SECONDS` | `beskid_web_common/packages/beskid-auth-client/src/handoff.ts`, `constants.ts` | All handoff-specific exports become dead code. Only `AUTH_APP_IDS`/`AUTH_APP_META` (service registry labels) have any reuse value; even those should migrate to the shell-template's service config. |
| Consumer-side `hub-finish` + `hubUserToken` session | `beskid_tracker/src/routes/api/auth/hub-finish.ts:1`, `beskid_tracker/src/lib/session/cookie.ts:14` | Replaced by the shell-template Authelia middleware (header-based user context); no handoff JWT to verify, no `hubUserToken` field in the session. |
| `@beskid/server-observability` middleware | `src/server/observability-middleware.ts:1` | Survives conceptually but is a per-app concern of the shell template, not of an auth hub; the `beskid-auth` service label disappears. |
| Coolify `auth` service + GHCR image + `auth-data` volume | `COOLIFY.md:1`, `docker-compose.yml:1`, `Dockerfile:1` | Removed; replaced by an Authelia Coolify service (new) + shared Postgres. |
| Normative specs `tooling--auth-hub--design-model`, `tooling--auth-hub--contracts-and-edge-cases`, `taxonomy--tooling--auth-hub` | `openspec/specs/tooling--auth-hub--*/spec.md` | Retired via an OpenSpec change (per AGENTS.md: provisional capabilities must move through real SHALL requirements, not stub fills). A new Authelia-based auth capability replaces them. |

## What survives / must be reimplemented

The bespoke `site/auth` app is fully retired. **Decision (2026-08): the
centralized GitHub-access-token vault + `/api/v1/github/*` proxy companion
is abandoned.** Authelia + the existing GitHub OAuth App is the sole auth
path; the shell-template is an OIDC client of Authelia with a signed
session cookie. The vault/proxy section below is retained as historical
context only and is **not** to be built.

### 1. Centralized GitHub access-token vault + `/api/v1/github/*` proxy — ABANDONED

Today, GitHub access tokens live only in the hub's SQLite (`user_sessions.github_token_encrypted`,
encrypted with `SESSION_SECRET`). Consumer apps never hold a GitHub token; they hold a `hubUserToken`
and call `/api/v1/github/*` which proxies to `api.github.com` (`github-proxy.ts:60`). This means a
compromised consumer app cannot exfiltrate GitHub tokens.

Authelia does not provide an equivalent. If this property is to survive, a **thin Authelia-
authenticated GitHub-proxy companion** must be built (in the new `beskid_sites` workspace, reusing
the shell-template) that:

- Accepts requests only from Authelia-validated users (forward-auth headers or a server-side
  `/api/verify` call against Authelia).
- Looks up the caller's encrypted GitHub access token in **Postgres** (shared with Authelia),
  keyed by GitHub login or Authelia user id. The token is written to Postgres at Authelia login
  time by a small post-login hook (or by the companion itself on first proxy miss, using the
  Authelia-provided identity to re-fetch a token — but Authelia does not expose the upstream OAuth
  token by default, so the most robust path is a dedicated token-acquire step).
- Proxies to `api.github.com` with the decrypted token, stripping hop-by-hop headers, exactly as
  `github-proxy.ts:60` does today.

Reimplemented pieces (port from `site/auth`):
- `src/server/github-proxy.ts:60` — proxy logic (header blocklists, Bearer swap). The auth source
  changes from `resolveHubUserSession` (handoff JWT) to Authelia headers.
- `src/server/crypto.ts:22` — AES-256-GCM encrypt/decrypt for GitHub tokens at rest in Postgres.
  The master key derivation from `SESSION_SECRET` is reusable; `SESSION_SECRET` becomes a
  companion-service secret in OpenBao.
- `src/server/repositories/user-sessions.ts:15` — token store, but backed by Postgres, not SQLite,
  and keyed by Authelia user (not by an internal `sessionId`).

If the team decides **not** to preserve the centralized vault, each consumer app must register its
own GitHub OAuth app (re-decentralizing) or call GitHub with per-user tokens obtained some other
way — this loses the "tokens never leave the hub" property and reverses a stated platform goal
(`README.md:11`). The plan assumes the vault survives.

### 2. Session validation in the shell template

`beskid_tracker/src/lib/session/cookie.ts:69` (`getSessionFromRequest`) and
`beskid_tracker/src/server/auth-guard.server.ts:12` are consumer-side helpers that read the
`hubUserToken`-bearing session cookie. Under Authelia these become a shell-template concern:

- A server middleware that reads Authelia forward-auth headers (or calls Authelia `/api/verify`
  for defense-in-depth) and populates a typed user context.
- A `requireAuth` route guard equivalent to `auth-guard.server.ts:12`.
- A replacement for the `hubUserToken` session field: the shell-template session no longer carries
  a handoff JWT; it carries whatever the shell needs to call the surviving GitHub proxy (e.g. the
  Authelia session id, or just the user identity since the proxy re-validates via Authelia).

### 3. User profile shape

The bespoke hub provided `{ login, avatarUrl, name }` (`session.ts:15`, `routes/api/v1/me.ts:15`).
The shell template must reconstruct this from Authelia. Authelia forward-auth headers expose
`Remote-User`, `Remote-Groups`, `Remote-Email`, `Remote-Name` (configurable). **Avatar URL is not
provided by Authelia by default** — see Risks. The user profile type in the shell template becomes
approximately `{ login, email?, name?, groups: string[], avatarUrl? }` (note `groups` is new and
useful for per-app authorization the hub never had).

### 4. Service registry (minor)

`@beskid/auth-client` `AUTH_APP_IDS` / `AUTH_APP_META` (`constants.ts:9,17`) are a static list of
service labels used by the hub's service picker and pairing UI. With the picker gone, this is at
most a shell-template nav config (sidebar items per the target architecture). It should not survive
as an "auth" package; it migrates to shell-template service config.

### 5. Observability

`src/server/observability-middleware.ts:1` (`@beskid/server-observability`, service `beskid-auth`)
is a per-app HTTP metrics middleware. It belongs in the shell template (and the surviving proxy
companion) with a per-app service label — not in a retired auth hub.

## Authelia integration contract for the shell template

This is the contract the shell-template (`beskid_sites/apps/shell-template`) and the GitHub-proxy
companion must implement against Authelia.

### Topology

- Authelia runs as a Coolify service in `beskid_infra` compose, fronted by the same reverse proxy
  (Traefik/Coolify proxy) as all beskid apps. Shared Postgres backs Authelia (`storage.postgres`)
  and the website, per the target architecture.
- Each beskid app (shell-template instance) sits behind Authelia's **forward-auth** middleware:
  every request hits the app only after Authelia has validated the session. Authelia either
  returns 401/302 to its login portal or forwards the request to the app with identity headers.

### Headers Authelia injects (after forward-auth succeeds)

Configured in Authelia's `server` + `session` + per-app ACL. Default Authelia forward-auth headers:

| Header | Source | Maps to bespoke hub field |
|---|---|---|
| `Remote-User` | Authelia username (GitHub login if GitHub provider maps it) | `session.login` |
| `Remote-Groups` | Comma-separated group list | (new — replaces `isAdminLogin` via a `beskid-admins` group) |
| `Remote-Email` | GitHub email (if `user:email` scope) | (new) |
| `Remote-Name` | Display name (if profile scope) | `session.name` |

Authelia must be configured with the GitHub identity provider requesting scopes `read:user repo`
(to match `github-oauth.ts:22`) so the access token is available for the proxy companion.

### Shell-template middleware (server-side)

1. Read `Remote-User` (required), `Remote-Groups`, `Remote-Email`, `Remote-Name` from the request.
2. Optionally call Authelia `/api/verify` (with the session cookie forwarded) for defense-in-depth
   if the deployment cannot trust the proxy header path alone.
3. Populate a typed `AuthContext` on the TanStack Start server context, equivalent to today's
   `getSessionFromRequest` return (`session.ts:51`) plus `groups`.
4. Provide `requireAuth` and `requireGroup('beskid-admins')` helpers (replacing `hub-admin.ts:7`
   `requireHubAdmin` and `auth-guard.server.ts:12`).

### User data shape (shell-template)

```ts
interface AuthUser {
  login: string;        // from Remote-User (GitHub login)
  email?: string;       // from Remote-Email
  name?: string;        // from Remote-Name
  groups: string[];     // from Remote-Groups; replaces isAdminLogin
  avatarUrl?: string;   // see Risks — not from Authelia by default
}
```

### GitHub proxy companion contract

If the centralized token vault survives (recommended), the companion exposes:

- `GET/POST/PATCH/PUT/DELETE /api/github/*` (path mirror of today's `/api/v1/github/*`).
- Auth: Authelia forward-auth (no `Authorization: Bearer <hubUserToken>` header — that mechanism
  is dead). The companion trusts `Remote-User` as the caller identity.
- The companion looks up the caller's encrypted GitHub access token in Postgres, decrypts with its
  own `SESSION_SECRET` (OpenBao `secret/beskid/production/github-proxy`), and forwards to
  `api.github.com` as today (`github-proxy.ts:60`).
- Consumer apps (shell-template instances) call the companion with a server-side fetch, forwarding
  the Authelia session cookie (or relying on the same forward-auth protecting the companion). The
  shell-template replaces `beskid_tracker/src/lib/github/hub-octokit.server.ts:8`
  (`createHubOctokit(hubUserToken)`) with a companion client that uses the caller's Authelia
  identity, not a handoff token.

### Postgres role for Authelia

- Authelia `storage.postgres`: a `authelia` database (or schema) for sessions, OIDC, Webauthn, TOTP,
  user attributes. Owned by Authelia; not shared with beskid apps.
- Beskid shared Postgres (website + Authelia per target architecture) additionally hosts a
  `github_tokens` table (or similar) owned by the proxy companion: `{ authelia_user TEXT PRIMARY KEY,
  github_login TEXT, github_token_encrypted BYTEA/TEXT, github_user_id INT, avatar_url TEXT,
  expires_at TIMESTAMPTZ }`. Encryption key from the companion's OpenBao secret, not from Authelia's.
- The hub admin list (`hub_settings.admin_github_logins`) is retired; admin status is an Authelia
  group membership (`beskid-admins`), enforced by Authelia ACL and read by the shell-template via
  `Remote-Groups`.

## Risks & unknowns

1. **GitHub access token acquisition under Authelia.** Authelia's GitHub identity provider exchanges
   the GitHub code for a token and uses it for Authelia's own profile fetch, but does not expose the
   upstream OAuth access token to protected applications by default. The surviving GitHub proxy
   needs that token in Postgres. Options: (a) Authelia custom `userinfo` claims mapping (if Authelia
   version supports exposing the upstream access token — needs verification against the pinned
   Authelia version), (b) a separate small OAuth callback app that acquires the GitHub token and
   stores it, keyed by the Authelia user, (c) re-acquire on demand via the proxy companion using
   the user's identity (requires a GitHub OAuth app the companion owns). **This is the biggest
   unknown and must be resolved before Phase 2.**
2. **Avatar URL.** Authelia headers do not include the GitHub avatar. The hub today provides it via
   `fetchGitHubUser` (`github-oauth.ts:63`) and stores it in `user_sessions.avatar_url`
   (`user-sessions.ts:13`). The shell-template must either (a) store it in Postgres at first
   proxy call (companion fetches `/user` once and caches), or (b) fetch on demand, or (c) render
   avatars from `github.com/<login>.png` (works without a token but leaks the login to the
   client). Decision needed.
3. **Backward compatibility / coexistence.** Every consumer (`beskid_tracker`, `beskid_nexus`,
   `pckg`, `site/platform-spec`, `site/learn`) currently imports
   `@beskid/auth-client` `verifyHandoffToken` / `buildLoginUrl` and stores a `hubUserToken`
   (`beskid_tracker/src/lib/session/cookie.ts:14`, `routes/api/auth/hub-finish.ts:25`). They cannot
   be migrated one at a time to Authelia while the hub still issues handoff JWTs, because the hub
   would need to issue both kinds. A parallel-run window is possible only if Authelia and the hub
   both front the same consumers with different routes — fragile. Cleanest is a flag-day cutover
   per consumer, with the hub kept alive only as the GitHub proxy companion during transition.
4. **Normative spec rupture.** `openspec/specs/tooling--auth-hub--design-model/spec.md` and
   `tooling--auth-hub--contracts-and-edge-cases/spec.md` normatively require the handoff JWT
   (`iss: beskid-auth-hub`), pairing, and the env contract. Per AGENTS.md these must move through a
   real OpenSpec change with SHALL requirements and scenarios, not a stub fill. The change must
   retire both specs and introduce an Authelia-based auth capability before observable behavior
   changes (AGENTS.md: "update spec before observable behavior changes").
5. **Authelia group → admin mapping.** The bespoke hub's first-sign-in bootstrap
   (`hub-admin-bootstrap.server.ts:31`) is a recovery mechanism with no Authelia equivalent. If the
   `beskid-admins` group is misconfigured, lockout recovery is a manual Authelia admin action
   (edit the user store / group file). Document the recovery procedure or keep a break-glass
   bootstrap admin.
6. **Postgres migration of encrypted tokens.** Moving `user_sessions.github_token_encrypted` from
   SQLite to Postgres is a schema + data migration. Existing sessions must be re-encrypted under a
   new key (the companion's `SESSION_SECRET`, distinct from the hub's) or decrypted with the old
   hub key and re-encrypted — a one-time migration script. Token TTL (7d, `user-sessions.ts:4`)
   must be preserved or re-issued.
7. **`AUTH_HUB_SECRET` legacy.** `repositories/paired-apps.ts:89` still falls back to the
   deprecated `AUTH_HUB_SECRET` for service tokens. During the transition the companion must not
   inherit this fallback; it should fail closed (per AGENTS.md: "fail closed instead of
   compatibility fallbacks").
8. **`@beskid/auth-client` fate.** `beskid_web_common/packages/beskid-auth-client/src/handoff.ts` is
   dead code post-migration. It is published to GitHub Packages as `@beskid/auth-client` (per
   AGENTS.md package conventions). Retiring it is a published-package deprecation, not just a
   source deletion. The new shell-template auth module should live in
   `@cyber-nomad-collective/beskid-ui-react` or a new `@cyber-nomad-collective/beskid-auth-react`
   package in `beskid_sites/packages/`, not in the legacy `beskid_web_common`.
9. **pckg handoff subject requirement.** `handoff.ts:34` enforces that `pckg` handoffs carry a
   canonical `github:<id>` subject, and `verifyHandoffToken:77` rejects pckg tokens without it.
   If pckg's publishing flow depends on the stable GitHub user id, the Authelia-based replacement
   must still surface `github:<id>` — likely via a Postgres lookup keyed by `Remote-User`, since
   Authelia headers do not include the numeric GitHub id by default.
10. **Deploy topology change.** `COOLIFY.md` and `beskid_infra/docs/deploy-matrix.md:65` reference
    the `auth` service and its OpenBao path. The cutover adds an Authelia service (new OpenBao
    path), changes the proxy graph (forward-auth in front of every app), and removes the `auth`
    service and `auth-data` volume. Per AGENTS.md, do not invent Coolify service UUIDs or GHCR
    grants — the Authelia Coolify service UUID and any new GHCR image must be created by a human
    admin and recorded in `beskid_infra/config/coolify-*.json`.

## Recommended phased approach

- **Phase 0 — Decision & spec.** Resolve Risk #1 (Authelia GitHub token exposure). Open an
  OpenSpec change retiring `tooling--auth-hub--design-model` and `tooling--auth-hub--contracts-and-edge-cases`
  and introducing an Authelia-based auth capability with SHALL requirements for: forward-auth
  header contract, `beskid-admins` group, Postgres-backed GitHub token vault (if kept), and the
  shell-template `AuthUser` shape. No code changes.
- **Phase 1 — Authelia deployment.** Add Authelia to `beskid_infra` compose (shared Postgres
  storage, GitHub identity provider with `read:user repo` scope). Configure forward-auth for all
  beskid app routes. Define `beskid-admins` group and per-app ACL. Keep `site/auth` running; do
  not yet route consumers through Authelia.
- **Phase 2 — Shell-template Authelia integration.** Build the Authelia middleware in
  `beskid_sites/apps/shell-template` (header reader, optional `/api/verify` fallback, `AuthUser`
  context, `requireAuth`/`requireGroup`). Avatar strategy decided here (likely companion-cached).
  Tests cover header parsing, group gating, and unauthenticated redirect.
- **Phase 3 — GitHub proxy companion.** If the vault is kept, build a thin Authelia-authenticated
  app in `beskid_sites/apps/` (reusing the shell template) exposing `/api/github/*`, backed by
  Postgres `github_tokens` table, AES-256-GCM encryption ported from `src/server/crypto.ts:22`.
  Build a one-time migration script to move existing `user_sessions` rows from the hub SQLite to
  Postgres with re-encryption. Consumer shell-template instances get a companion client replacing
  `hub-octokit.server.ts:8`.
- **Phase 4 — Migrate consumers one at a time.** tracker → nexus → pckg → platform-spec → learn,
  each rebuilt on the shell template + Authelia. Each drops `@beskid/auth-client` handoff imports
  and the `hubUserToken` session field. The hub stays up only as the GitHub proxy companion during
  this window.
- **Phase 5 — Retire site/auth.** Remove `site/auth/`, the `auth` Coolify service, the
  `auth-data` volume, GHCR image `beskid-auth`, OpenBao path `secret/beskid/production/auth`
  (after companion secrets are in their own path). Deprecate `@beskid/auth-client` on GitHub
  Packages. Update `COOLIFY.md`, `beskid_infra/docs/deploy-matrix.md`, and the platform-spec site
  (which reads `openspec/catalog.json` at build time — regenerate the catalog per AGENTS.md).

## Verdict

**Full retirement, OIDC model — in progress (master Plan Phase 1).**
Authelia fully replaces the bespoke OAuth, session, admin, onboarding,
pairing, and handoff-JWT surfaces of `site/auth`; the TanStack Start app at
`site/auth` is being retired entirely. The centralized GitHub-access-token
vault + `/api/v1/github/*` proxy companion is **dropped** (decision
2026-08, zero references in the implemented shell-template): Authelia + the
existing GitHub OAuth App is the sole auth path. The shell-template app is
an OIDC client of Authelia (authorization-code flow); GitHub is the only
identity provider (configured on the Authelia side). Identity is delivered
via a signed session cookie (HS256, `SESSION_SECRET`) sealed after the
Authelia ID token is verified with `jose` — not via forward-auth headers.
Consumer apps that need GitHub access use a service-level token (e.g.
`GITHUB_SYNC_TOKEN`) rather than per-user tokens. Remaining work: Authelia
production deploy, per-app OIDC client activation, OpenSpec change retiring
`tooling--auth-hub--*`, and `site/auth` decommission — all tracked in the
master `Plan.md` Phase 1.
