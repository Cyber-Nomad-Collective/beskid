# Authelia auth contract — shell-template

The shell-template authenticates via **Authelia acting as an OIDC
provider**, not a bespoke auth hub and not forward-auth headers. GitHub is
the **sole identity provider** (configured on the Authelia side). This
document is the contract the template implements.

## Auth model

```
browser ──(1)──> shell-template /api/auth/login
                  │
                  └─(2)──> Authelia /api/oidc/authorization
                            │
                            └─(3)──> GitHub OAuth (sole IdP)
                                      │
                            <──(4)── GitHub callback to Authelia
                  <──(5)── Authelia redirects to /api/auth/callback?code=…&state=…
                  │
                  └─(6) exchange code → Authelia /api/oidc/token
                  └─(7) verify ID token against Authelia JWKS (RS256, `jose`)
                  └─(8) seal claims into signed session cookie (HS256, SESSION_SECRET)
                  └─(9) redirect to "/"
browser ──(10)─> subsequent requests carry the session cookie; getShellUser unseals it
```

The app is an **OIDC client** of Authelia (authorization-code flow). It is
NOT behind forward-auth; it talks OIDC to Authelia directly. Authelia in
turn authenticates users with GitHub via its OAuth2 authentication backend
(Authelia 4.38+). There is no local password/email user store, no password
reset, no email-only registration — GitHub login is the only way in.

## `ShellUser` shape

```ts
interface ShellUser {
	username: string;   // ID token `preferred_username` (fallback `sub`)
	email?: string;     // ID token `email` claim
	name?: string;      // ID token `name` claim
	groups: string[];    // ID token `groups` claim
	avatarUrl?: string; // NOT from Authelia — sourced by the app
}
```

`avatarUrl` is **not** provided by Authelia. The template falls back to
`https://github.com/<username>.png` (works without a token). A consuming
app that needs the real GitHub avatar overrides the `UserMenu` trigger.

## Session cookie

After the ID token is verified, the claims are sealed into an HS256 JWT
cookie `beskid_shell_session` signed with `SESSION_SECRET` (7d TTL),
`HttpOnly`, `SameSite=Lax`, `Secure` in production. Pattern lifted from
`beskid_tracker/src/lib/session/cookie.ts` and `site/auth/src/server/session.ts`
(both `jose` HS256).

- `src/server/shell-session.ts` — `sealShellSession` / `unsealShellSession`
  + cookie header helpers.
- `src/server/oidc.ts` — discovery, authorization URL, code exchange, ID
  token verification (`jose` `jwtVerify` against Authelia's JWKS).

## Server middleware

`src/server/authelia-middleware.ts` exposes:

- `resolveShellUser(sessionToken)` — unseals the session cookie (or returns
  the mock user). Returns `null` when no valid session is present.
- `requireShellUser(user)` — guard for protected routes.
- `requireShellGroup(user, group)` — guard for group-gated routes
  (replaces the bespoke hub's `requireHubAdmin` via a `beskid-admins` group).

`src/server/shell-user.ts` wraps `resolveShellUser` in a TanStack Start
`createServerFn` (`getShellUser`) that reads the session cookie via
`getCookie(SESSION_COOKIE_NAME)` from `@tanstack/react-start/server`. The
root route's `beforeLoad` calls it and threads the result into the router
context (`context.user`), so client components render the avatar dropdown /
sidebar footer without a separate fetch.

## OIDC routes

- `GET /api/auth/login` — sets the CSRF state cookie and redirects to
  Authelia's authorization endpoint.
- `GET /api/auth/callback` — validates state, exchanges the code, verifies
  the ID token, seals the session cookie, redirects to `/`.
- `GET|POST /api/auth/logout` — clears the session cookie, redirects to `/`.

The sidebar "Sign in with GitHub" link points at `/api/auth/login`; the
user-menu sign-out points at `/api/auth/logout`.

## Mock mode

`SHELL_AUTH_MODE=mock` (the default outside production) makes
`resolveShellUser` return a fixed fake user (`beskid-dev`, groups
`["beskid-admins", "dev"]`) so local dev works without an Authelia
instance. Set `SHELL_AUTH_MODE=authelia` in production to read the signed
session cookie.

## Authelia configuration

`compose/authelia/configuration.yml` configures:

- `authentication_backend.oauth2` with `provider: github` — GitHub is the
  sole identity provider. Reuses the **existing** Beskid GitHub OAuth App
  (the one `site/auth` used) via `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`.
  No `authentication_backend.file` / password store.
- `identity_providers.oidc` — Authelia as OIDC provider, with per-app
  client registrations. The `shell-template` client is real; commented
  example entries exist for `website`, `platform-spec`, `tracker`, `pckg`,
  `learn`, `nexus` (each with its own `client_id` + redirect URI placeholder)
  to adopt when those apps migrate onto the shell.
- `access_control` — `beskid-admins` group gating; public health/metrics
  endpoints bypass auth at the proxy layer.

All secrets are `${VAR}` placeholders; nothing is hardcoded.

## Authelia group → admin mapping

Admin status is an Authelia group membership (`beskid-admins`), enforced by
Authelia ACL and read by the shell-template via the ID token `groups`
claim. The bespoke hub's first-sign-in bootstrap has no Authelia equivalent;
if the `beskid-admins` group is misconfigured, lockout recovery is a manual
Authelia admin action (edit the group membership in Authelia's store).
Document the recovery procedure for your deployment.

## Human / admin steps

1. **GitHub OAuth App** — reuse the existing Beskid GitHub OAuth App. Its
   callback for Authelia is `${AUTHELIA_OIDC_ISSUER}/api/oidc/callback`.
   Provide `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` via env (OpenBao in
   production). Do NOT commit the secret.
2. **Authelia OIDC secrets** — generate `AUTHELIA_OIDC_HMAC_SECRET` and
   `AUTHELIA_OIDC_JWKS_SECRET` (RS256 key material) and provide via env.
3. **Shell-template OIDC client** — set `SHELL_TEMPLATE_OIDC_CLIENT_ID`
   (default `shell-template`), `SHELL_TEMPLATE_OIDC_CLIENT_SECRET`, and
   `AUTHELIA_OIDC_ISSUER` on the app. The client secret must match the
   `client_secret` registered in Authelia's `identity_providers.oidc.clients`.
4. **Session secret** — set `SESSION_SECRET` (32+ chars) on the app for
   cookie signing.
5. **Redirect URIs** — register `http://localhost:8499/api/auth/callback`
   (dev) and the production callback on the Authelia client config.
6. **Other apps** — when `website`, `platform-spec`, `tracker`, `pckg`,
   `learn`, or `nexus` adopt the shell, uncomment their client block in
   `configuration.yml` and set their per-app OIDC client secret env.

## Why `jose`

ID token verification against Authelia's JWKS (RS256) requires JWK
parsing + RS256 signature verification that is error-prone to hand-roll.
`jose` is the established JWT library across the Beskid ecosystem
(`site/auth`, `beskid_tracker`, `beskid-auth-client` all use `^6.2.3`) —
lightweight, no native deps, maintained. It is the single new runtime
dependency added by this auth model.
