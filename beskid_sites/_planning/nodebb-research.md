# NodeBB + Authelia integration for community.beskid-lang.org

Research only — no code changes. Findings ground the addition of NodeBB as a
community forum at `community.beskid-lang.org`, integrated with the existing
Authelia OIDC provider, pckg (package registry), and platform-spec.

> All NodeBB facts below are sourced from the NodeBB v4 line (master branch at
> time of writing) and the official `ghcr.io/nodebb/nodebb` image. Beskid-side
> facts are grounded in `beskid_sites/apps/shell-template/docs/authelia.md`,
> `beskid_sites/apps/shell-template/compose/authelia/configuration.yml`, and
> `beskid_infra/compose/production/docker-compose.yml`.

## Beskid auth context (the contract NodeBB must fit)

- Authelia (4.38+) is the **sole OIDC provider** for Beskid apps. GitHub is the
  **sole identity provider** to Authelia (`authentication_backend.oauth2:
  provider: github`). No local password/email store exists
  (`configuration.yml:51-63`).
- Beskid apps register as OIDC clients of Authelia (authorization-code flow)
  and read identity from a signed session cookie (HS256, `SESSION_SECRET`)
  sealed after the Authelia ID token is verified with `jose`
  (`shell-template/docs/authelia.md:1-26`). **Forward-auth headers are NOT the
  chosen model** — that path was researched and abandoned
  (`_planning/auth/Plan.md:9-19`).
- Existing example OIDC clients are commented in `configuration.yml:93-154`
  (`website`, `platform-spec`, `tracker`, `pckg`, `learn`, `nexus`). NodeBB
  would be a new client in the same list.
- Admin status is an Authelia group membership (`beskid-admins`), delivered in
  the ID token `groups` claim — not a runtime bootstrap
  (`_planning/auth/Plan.md:262-273`, `shell-template/docs/authelia.md:33-43`).
- Per AGENTS.md, do **not** invent Coolify service UUIDs, GHCR Write grants, or
  secret values — fail closed and document the human admin step.

## 1. NodeBB + Authelia/OIDC

### Does NodeBB support OIDC?

Not in core. NodeBB ships local password/email auth plus a pluggable SSO layer
built on Passport.js. OIDC support is provided by **third-party plugins**, none
of them official or heavily maintained:

| Plugin | Repo | Stars | Last activity | Verdict |
|---|---|---|---|---|
| `nodebb-plugin-sso-oidc` | `Alexkin2609/nodebb-plugin-sso-oidc` | 3 | Dec 2022 | Generic OIDC RP; low confidence for NodeBB v4 |
| `nodebb-plugin-authentik-oidc` | `ShadowsOverWestgate/nodebb-plugin-authentik-oidc` | 0 | May 2025, **archived** | Authentik-flavoured but OIDC-generic underneath; archived |
| `nodebb-plugin-shadowauth-oidc` | `loversama/nodebb-plugin-shadowauth-oidc` | 0 | Nov 2024 | Most recent; untested adoption |

There is an official NodeBB-maintained **generic OAuth2** plugin
(`nodebb-plugin-sso-oauth`, NodeBB org) and an official **GitHub SSO** plugin
(`nodebb-plugin-sso-github`). The OAuth2 plugin is a configurable OAuth2 RP
that can be pointed at Authelia's OAuth2 endpoints; it does not do full OIDC
(ID token verification) unless extended.

### Architectural consequence (important)

NodeBB's SSO model **provisions a local NodeBB account on first login** and
links it to the external identity. NodeBB keeps its own user table, groups,
and session (`express.sid` cookie, configurable `sessionKey`/`session_store`
in `config.json`). This is **different from the shell-template OIDC model**
(no local user store, signed session cookie sealed from the ID token).

NodeBB therefore cannot adopt the shell-template "seal ID token claims into a
cookie" pattern without a custom plugin. The idiomatic NodeBB path is: NodeBB
becomes an **OIDC relying party** of Authelia via an SSO plugin; Authelia
remains the OP; GitHub remains the sole IdP. NodeBB local accounts are
auto-created/linked on first OIDC login and map `preferred_username`/`email`
from the Authelia ID token.

### Recommended Authelia OIDC client for NodeBB

Register NodeBB in `identity_providers.oidc.clients` alongside the other
examples (`configuration.yml:93-154`):

```yaml
- client_id: nodebb
  client_secret: ${NODEBB_OIDC_CLIENT_SECRET}
  authorization_policy: one_factor
  redirect_uris:
    - "https://community.beskid-lang.org/auth/oidc/callback"
    - "http://localhost:4567/auth/oidc/callback"   # local-dev
  scopes: ["openid", "profile", "email", "groups"]
  grant_types: ["authorization_code"]
  response_types: ["code"]
  userinfo_signing_algorithm: "none"
```

The exact callback path depends on the chosen plugin (the generic
`nodebb-plugin-sso-oidc` uses `/auth/oidc/callback` by convention; confirm
against the plugin's `library.js` routes before registering). Authelia
`groups` claim maps to NodeBB group memberships only if the SSO plugin
implements group provisioning — most do not; treat group mapping as a custom
extension (see Open questions).

### nodebb-plugin-sso-github

The official GitHub SSO plugin would bypass Authelia entirely (NodeBB talks
to GitHub directly). This **violates the Beskid single-IdP-via-Authelia
decision** and re-decentralizes GitHub OAuth. **Rejected** — keep Authelia as
the only GitHub consumer.

## 2. NodeBB API for auto-creating subforums

### Write API is in core (no plugin needed)

Since NodeBB v1.15.0 the Write API (v3) is **merged into core**; it supersedes
the old `nodebb-plugin-write-api` v2. Base path: `/api/v3`. OpenAPI spec lives
at `public/openapi/write.yaml`. Auth: **session cookie OR Bearer token**
(`public/openapi/write.yaml` Authentication section).

### Category (subforum) creation

`POST /api/v3/categories/` — admin-only. Body (`write/categories.yaml`):
`name` (required), `description`, `parentCid` (number — for nesting under a
"Packages" parent), `icon`, `bgColor`, `color`, `class`, `backgroundImage`,
`cloneFromCid`, `cloneChildren`. Returns the created `CategoryObject`
including the new `cid`. Implemented in `src/categories/create.js`
(`Categories.create`) and `src/controllers/write/categories.js`
(`Categories.create`).

`PUT /api/v3/categories/{cid}` — update (e.g. rename, disable). Free-form body.
`DELETE /api/v3/categories/{cid}` — delete + purge (no confirmation server-side).

### Permissions / locking a subforum

NodeBB has no "locked subforum" flag per se. Locking is enforced through
**category privileges** per group/user (`write/categories/cid/privileges/`):

- `PUT /api/v3/categories/{cid}/privileges/{privilege}/{member}` — grant
- `DELETE /api/v3/categories/{cid}/privileges/{privilege}/{member}` — rescind

`member` is a group name (e.g. `registered-users`, `guests`) or uid;
`privilege` is a `groups:`-prefixed key. The privilege set relevant for a
locked package subforum (from `src/categories/create.js` default privileges):

- `groups:topics:create` — who can open new threads
- `groups:topics:reply` — who can reply
- `groups:topics:read` / `groups:read` / `groups:find` — visibility

**Locked-subforum recipe**: create child category under "Packages"; rescind
`groups:topics:create` and `groups:topics:reply` from `registered-users` and
`guests`; grant them only to a per-package group (or the pckg service
account). Keep `groups:read`/`groups:topics:read` on `registered-users` so the
subforum is visible/readable but not writable by the public.

### Topic creation + locking

- `POST /api/v3/topics/` — create topic with first post (`cid`, `title`,
  `content`, `tags`). `POST /api/v3/categories/{cid}/topics` is the per-category
  alias.
- `PUT /api/v3/topics/{tid}/lock` — lock a topic (no new replies).
- `PUT /api/v3/topics/{tid}/pin` — pin (announcement).

For a per-package **announcement thread** (alternative to a locked
subforum): create one topic in the package's subforum, pin it, lock it if
only the package owner should post; leave a separate open thread for Q&A.

### API auth model for pckg

Two Bearer token kinds (`public/openapi/write/admin/tokens.yaml` and
`write/users/uid/tokens.yaml`):

- **Admin tokens** (`POST /api/v3/admin/tokens`, body `{ uid, description }`)
  — mint a token that acts as a given user. The token carries that user's
  privileges, so create a dedicated `pckg-bot` admin user in NodeBB and mint
  an admin token against its uid. This is the token pckg uses to create
  categories/topics and manage privileges.
- **User tokens** (`POST /api/v3/users/{uid}/tokens`) — per-user, lower
  privilege.

Tokens are sent as `Authorization: Bearer <token>`. Category/privilege
endpoints require administrator privileges, so the **admin token on a
`pckg-bot` admin user** is the correct choice.

## 3. NodeBB Docker deployment

### Official image & Postgres

- Official prebuilt image: `ghcr.io/nodebb/nodebb:latest` (the repo
  `docker-compose*.yml` comment it in; `build: .` is the alternative).
- Postgres is a **first-class** primary DB: `docker-compose-pgsql.yml` ships
  in the repo with a `postgres:18.4-alpine` service. `config.json` `database:
  "postgres"` with `host/port/database/username/password`
  (`install/docker/setup.json` defaults: host `postgres`, db `nodebb`).
- Redis is **required for clustering** and recommended for sessions; for a
  single-instance deploy Redis is optional but `session_store` can point at
  it (`config.json` `session_store`). For a forum at Beskid's scale, a single
  NodeBB instance + Postgres is sufficient; add Redis only if scaling or if
  socket.io session stickiness is needed.
- NodeBB supports MongoDB, Redis, **or** Postgres as the primary store
  (`README.md` Requirements: MongoDB ≥5 or Redis ≥7.2, plus Postgres per the
  pgsql compose).

### Minimum config

`config.json` (mounted at `/opt/config/config.json` in the image — see
`Dockerfile` `VOLUME ["/opt/config"]`):

```json
{
  "url": "https://community.beskid-lang.org",
  "secret": "<SESSION_SECRET from OpenBao>",
  "database": "postgres",
  "postgres": {
    "host": "postgres",
    "port": 5432,
    "database": "nodebb",
    "username": "nodebb",
    "password": "<NODEBB_POSTGRES_PASSWORD>"
  },
  "trust_proxy": true,
  "port": 4567
}
```

`trust_proxy: true` is required because NodeBB sits behind the Coolify proxy
/ Traefik (Express `trust proxy` for correct `req.ip`).

### Sessions

NodeBB uses an `express.sid` cookie (configurable via `sessionKey`) hashed
with `config.json` `secret`. Sessions live in the primary DB by default; a
separate `session_store` block can redirect them to Redis/Postgres. Rotating
`secret` invalidates all sessions. The cookie is **NodeBB's own** — it is
not the Authelia session cookie and not the shell-template
`beskid_shell_session`. OIDC SSO just authenticates into a NodeBB local
session.

### Volumes (from `Dockerfile` + compose)

`/usr/src/app/node_modules`, `/usr/src/app/build`, `/usr/src/app/public/uploads`,
`/opt/config`. Persist `build`, `uploads`, and `config`; `node_modules` can
be ephemeral if rebuilt on image upgrade.

## 4. NodeBB + pckg integration pattern

pckg is a TanStack Start app (.NET API + Vite SPA served on port 8082,
`_planning/pckg/Plan.md:48-56`) with a typed `PckgApiClient`. It will adopt
the shell-template Authelia OIDC client model in the future (it is listed as
an example OIDC client in `configuration.yml:125-134`).

### Communication model: REST (Write API) with admin Bearer token

- pckg publishes a package → calls NodeBB Write API to provision the
  package's discussion surface. There is **no inbound webhook from NodeBB to
  pckg** required for provisioning; the flow is pckg → NodeBB.
- Auth: a NodeBB **admin token** (minted via `POST /api/v3/admin/tokens`
  against a `pckg-bot` admin user) stored in pckg's env / OpenBao
  (`secret/beskid/production/pckg` or a new `secret/beskid/production/nodebb`).
  pckg sends `Authorization: Bearer <token>` on every call.
- The token must not be browser-exposed; calls are server-side only (Nitro
  server functions), matching pckg's existing server-side fetch pattern.

### Provisioning sequence (per package publish)

1. `POST /api/v3/categories/ { name: "<package slug>", parentCid: <Packages cid>, description: ... }`
   → capture `cid`. (Idempotency: first `GET /api/v3/categories` and match by
   name/handle to avoid duplicates on republish.)
2. Lock the subforum:
   `DELETE /api/v3/categories/{cid}/privileges/groups:topics:create/registered-users`
   and `.../guests`; same for `groups:topics:reply`.
3. (Optional) create an announcement topic:
   `POST /api/v3/topics/ { cid, title, content, tags: ["package","<slug>"] }`,
   then `PUT /api/v3/topics/{tid}/pin` and `PUT /api/v3/topics/{tid}/lock`.
4. Store the `{ packageSlug → cid }` mapping in pckg's DB so the package
   detail page can deep-link to the subforum.

### pckg → NodeBB link direction

The package detail page (`/packages/$packageName`) renders a "Discuss" link
to `https://community.beskid-lang.org/category/{cid}` (or the announcement
topic). This is a **redirect**, not an embed (see §6). pckg stores the `cid`
(or the NodeBB category `handle`) on the package record.

### Reverse direction (optional)

NodeBB → pckg is not required for v1. If desired later, NodeBB webhooks
(plugin) or the Write API event endpoints can notify pckg of new
posts/flags, but this is out of scope for the initial integration.

## 5. NodeBB theming

- NodeBB is built on **Bootstrap 5**; the default theme is **Harmony**
  (`nodebb-theme-harmony`). Theming is via **child themes** forked from
  `nodebb-theme-quickstart` (`docs.nodebb.org/development/themes/`).
- A theme is an npm package (`nodebb-theme-*`) with `theme.json` +
  `theme.scss` (SCSS, precompiled on demand). `baseTheme` points at Harmony;
  templates not overridden are inherited.
- **Custom CSS injection** is supported out of the box via the ACP
  (Appearance → Custom CSS / Custom Header), no theme package required for
  small adjustments.
- Matching Beskid design tokens: NodeBB SCSS variables + a custom CSS block
  can map to `@beskid/material-theme` tokens / the shadcn↔Material token
  bridge used by platform-spec (`_planning/platform-spec/Plan.md:29-31`).
  There is no shared CSS pipeline between NodeBB and the TanStack apps —
  tokens must be **re-declared** in the NodeBB theme/CSS as raw values (NodeBB
  cannot consume `@beskid/*` npm packages without a custom build).

### Iframe vs standalone

NodeBB is a **standalone app**. Iframing is technically possible but
problematic: cross-origin cookie/session isolation, socket.io iframe
restrictions, and X-Frame-Options. NodeBB does not officially support being
embedded as a component inside a React app. Treat `community.beskid-lang.org`
as a **separate page**, cross-linked from pckg/platform-spec (see §6).

## 6. NodeBB embedding / comment-section pattern

### Standalone-page model (recommended)

`community.beskid-lang.org` is its own origin. pckg and platform-spec link
out to it. This is the only model that cleanly preserves NodeBB sessions and
socket.io. The "comment section on package detail page" is a **deep link +
redirect**, not an inline widget.

### Blog-comments widget pattern (alternative, partial)

NodeBB historically provides `nodebb-plugin-blog-comments` (community
plugin; repo path unverified at time of writing — confirm before adopting).
The pattern: a small JS snippet on an external page creates a NodeBB topic
per article and renders the reply thread inline, posting back to NodeBB via
the Write API. This works for a "comments under a package page" UX but:
- Requires a published, article-style page with a stable identifier.
- The JS snippet is not React-native; it injects its own DOM.
- Authentication for inline posting still requires the user to have a NodeBB
  session (cookie on `community.beskid-lang.org`), so cross-origin SSO must
  be solved first (Authelia single-sign-on across origins helps, but NodeBB
  still issues its own `express.sid`).

For v1, **do not embed**; deep-link. Revisit the blog-comments widget only
if inline discussion under package pages becomes a real product requirement.

## 7. NodeBB + platform-spec integration

platform-spec (`_planning/platform-spec/Plan.md`) is the normative spec
reader at `spec.beskid-lang.org`, backed by OpenSpec + Memgraph. Integration
with NodeBB is **linkage, not data sync**:

- Each spec capability/ADR page can link to a **discussion category** in
  NodeBB (e.g. a "Spec discussion" parent category with one subforum per
  spec domain, or one thread per ADR). platform-spec stores the NodeBB `cid`
  / topic `tid` as metadata on the spec node (Memgraph draft context or the
  OpenSpec catalog `links` field).
- Direction is platform-spec → NodeBB (deep link to the discussion
  category). platform-spec does not need to auto-create NodeBB content; the
  spec moderator creates the discussion category manually (or a one-time
  seed script using the Write API admin token, mirroring the pckg pattern
  in §4).
- If bidirectional sync is later wanted (e.g. surface "latest 3 discussion
  posts" on the spec page), platform-spec reads NodeBB via the **Read API**
  (`/api/v3/...` or the read `/api/...` endpoints) with the admin token or a
  read-only user token. No webhook needed for read-only surfacing.

## Recommended integration architecture

```
                GitHub (sole IdP)
                      │
                Authelia (OIDC OP) ── Postgres (authelia db)
                      │ OIDC auth-code
        ┌─────────────┼──────────────┬─────────────┐
   shell-template   pckg   platform-spec   NodeBB (community.beskid-lang.org)
   (beskid_shell_   (OIDC     (OIDC         │ OIDC RP via nodebb-plugin-sso-oidc
    session cookie)  client)   client)      │ NodeBB local users + express.sid
                                          │
                              Postgres (nodebb db) + optional Redis (sessions)
                                          ▲
                          Write API /api/v3 (Bearer admin token on pckg-bot user)
                                          │
                          pckg (publish) ──┘  creates per-package locked subforum
                          platform-spec ──────── deep-links to spec discussion category
```

Key points:
- **One** Authelia OIDC client entry for `nodebb`.
- NodeBB runs its own Postgres database (separate from Authelia's `authelia`
  db and from the platform shared Postgres; or a separate schema/role in the
  shared Postgres — operator decision).
- pckg holds a NodeBB admin Bearer token (OpenBao) and provisions subforums
  server-side.
- Theming via a child theme + custom CSS matching Beskid tokens; no shared
  npm CSS pipeline.
- `community.beskid-lang.org` is a standalone origin, linked from pckg and
  platform-spec.

## Required NodeBB plugins

| Plugin | Purpose | Risk |
|---|---|---|
| `nodebb-plugin-sso-oidc` (Alexkin2609) **or** a fork of it | OIDC RP against Authelia | **High** — 3 stars, last touched Dec 2022; likely needs updating for NodeBB v4. Plan to fork + maintain in `Cyber-Nomad-Collective`. |
| (optional) `nodebb-plugin-sso-oauth` (NodeBB org) | Alternative: generic OAuth2 RP if OIDC ID-token verification is not required | Medium — official but OAuth2 not full OIDC |
| (optional) blog-comments plugin | Inline comments under package pages | Defer to v2 |

**No plugin is needed for the Write API** — it is core. **No plugin is
needed for Postgres** — it is core.

## Docker compose service definition (production lane)

To be added to `beskid_infra/compose/production/docker-compose.yml` (or a
dedicated Coolify service). Per AGENTS.md the Coolify service UUID and GHCR
grants are created by a human admin and recorded in
`beskid_infra/config/coolify-*.json` — not invented here.

```yaml
  nodebb:
    image: ghcr.io/nodebb/nodebb:latest   # pin to a digest in the real stack
    restart: unless-stopped
    expose:
      - "4567"
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      # NodeBB reads config from /opt/config/config.json (mounted below).
      # Secrets via env are NOT a NodeBB native pattern; config.json holds them.
      # For Beskid, generate config.json at deploy from OpenBao via a sidecar
      # or render it in sync-runtime-env.sh and mount the file.
      NODE_ENV: production
    volumes:
      - nodebb-config:/opt/config:ro          # config.json lives here
      - nodebb-build:/usr/src/app/build
      - nodebb-uploads:/usr/src/app/public/uploads
    healthcheck:
      test: ["CMD-SHELL", "wget -q --spider http://127.0.0.1:4567/api/health || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 30s

  nodebb-postgres:
    image: postgres:18-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: nodebb
      POSTGRES_PASSWORD: ${NODEBB_POSTGRES_PASSWORD:?set in OpenBao}
      POSTGRES_DB: nodebb
    volumes:
      - nodebb-pg-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nodebb -d nodebb"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 10s

  # (optional) Redis for sessions/socket.io scaling
  nodebb-redis:
    image: redis:8-alpine
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes", "--loglevel", "warning"]
    volumes:
      - nodebb-redis-data:/data

volumes:
  nodebb-config:
  nodebb-build:
  nodebb-uploads:
  nodebb-pg-data:
  nodebb-redis-data:
```

Notes:
- `config.json` is generated from OpenBao secrets by the existing
  `sync-runtime-env.sh` pattern (extend it), then mounted read-only. Do not
  bake secrets into the image.
- Whether NodeBB Postgres shares the platform Postgres instance (separate
  db/role) or runs its own is an operator decision; the compose above shows
  a dedicated instance for isolation.
- A human admin must: create the Coolify service for `community.beskid-lang.org`,
  grant the GHCR pull, and record the service UUID in
  `beskid_infra/config/coolify-*.json`.

## Authelia OIDC client config for NodeBB

Added to `configuration.yml` under `identity_providers.oidc.clients` (env
secret `NODEBB_OIDC_CLIENT_SECRET` from OpenBao
`secret/beskid/production/nodebb`):

```yaml
      - client_id: nodebb
        client_secret: ${NODEBB_OIDC_CLIENT_SECRET}
        authorization_policy: one_factor
        redirect_uris:
          - "https://community.beskid-lang.org/auth/oidc/callback"
          - "http://localhost:4567/auth/oidc/callback"
        scopes: ["openid", "profile", "email", "groups"]
        grant_types: ["authorization_code"]
        response_types: ["code"]
        userinfo_signing_algorithm: "none"
```

The OIDC SSO plugin on the NodeBB side is configured (via ACP plugin settings)
with:
- Discovery URL: `https://auth.beskid-lang.org` (Authelia issuer; the
  `AUTHELIA_OIDC_ISSUER` equivalent — confirm the production Authelia URL).
- Client ID: `nodebb`, Client Secret: from OpenBao.
- Requested scopes: `openid profile email groups`.
- Username/email claim mapping: `preferred_username`, `email`, `name`.

Confirm the exact callback path against the deployed plugin's route table
before registering the redirect URI in Authelia (mismatch = hard-fail).

## API integration plan: pckg → NodeBB subforum auto-creation

1. **Bootstrap (one-time, by admin)**: create a "Packages" parent category in
   NodeBB (ACP or `POST /api/v3/categories/`). Record its `cid` as
   `NODEBB_PACKAGES_PARENT_CID` in pckg env. Create a `pckg-bot` admin user;
   mint an admin token (`POST /api/v3/admin/tokens { uid: <pckg-bot uid>,
   description: "pckg publisher" }`). Store the token in OpenBao
   `secret/beskid/production/nodebb` (or `.../pckg`).
2. **On package publish** (pckg server action):
   1. `GET /api/v3/categories` → find existing child of
      `NODEBB_PACKAGES_PARENT_CID` whose `name`/`handle` matches the package
      slug. If found, reuse `cid`; else `POST /api/v3/categories/` with
      `parentCid: NODEBB_PACKAGES_PARENT_CID`, `name: <slug>`,
      `description: <package summary>`.
   2. Lock the subforum:
      `DELETE /api/v3/categories/{cid}/privileges/groups:topics:create/registered-users`,
      `DELETE .../groups:topics:create/guests`,
      `DELETE .../groups:topics:reply/registered-users`,
      `DELETE .../groups:topics:reply/guests`.
      (Keep `groups:read`/`groups:topics:read` so it is visible.)
   3. (Optional) `POST /api/v3/topics/` to create a pinned, locked
      announcement topic; `PUT /api/v3/topics/{tid}/pin`,
      `PUT /api/v3/topics/{tid}/lock`.
   4. Persist `{ packageSlug → nodebbCid, nodebbAnnouncementTid? }` on the
      package record in pckg's DB.
3. **On package detail page**: render a "Discuss" link to
   `https://community.beskid-lang.org/category/{cid}` (or the announcement
   topic slug). Server-side only — never expose the admin token to the
   browser.
4. **On package rename/transfer**: `PUT /api/v3/categories/{cid}` to rename;
   keep the `cid` stable so links don't break.
5. **On package delete (v2)**: `DELETE /api/v3/categories/{cid}` (purges
   topics — confirm intent; consider disabling instead via
   `PUT /api/v3/categories/{cid} { disabled: true }`).

Idempotency rule: provisioning must be **idempotent** on republish — always
look up by handle before creating.

## Open questions / blockers

1. **OIDC plugin maturity.** None of the three OIDC plugins is well-maintained
   against NodeBB v4. **Blocker for auth.** Decision needed: (a) fork
   `Alexkin2609/nodebb-plugin-sso-oidc` into `Cyber-Nomad-Collective` and
   maintain it, (b) extend the official `nodebb-plugin-sso-oauth` to do ID
   token verification, or (c) write a thin bespoke OIDC plugin against the
   NodeBB SSO hook system. Verify each candidate actually runs on NodeBB v4
   before committing.
2. **Group/role mapping.** The Authelia `groups` claim (e.g. `beskid-admins`)
   should map to NodeBB administrator/moderator groups. Most OIDC SSO plugins
   do not provision groups from claims. Confirm whether the chosen plugin
   does; if not, a small custom hook (`action:user.login` or equivalent) is
   needed to sync groups from the ID token. This is the second blocker after
   plugin maturity.
3. **Exact OIDC callback path.** Depends on the chosen plugin's routes.
   Must be confirmed before registering the redirect URI in Authelia.
4. **NodeBB Postgres topology.** Separate Postgres instance vs. a `nodebb`
   db/role in the shared platform Postgres. Operator decision; affects
   backup/upgrade story.
5. **Avatar sourcing.** NodeBB local users won't have GitHub avatars unless
   the OIDC plugin pulls `picture` from the ID token/Authelia userinfo.
   Authelia does not expose the GitHub avatar by default
   (`_planning/auth/Plan.md:286-290`). Decide: map `picture` claim if
   available, or fall back to NodeBB's auto-generated letter avatars.
6. **Coolify service + GHCR + OpenBao path** for NodeBB must be created by a
   human admin (per AGENTS.md — do not invent UUIDs/grants/secrets). Record
   in `beskid_infra/config/coolify-*.json`.
7. **config.json secret delivery.** NodeBB expects secrets in `config.json`,
   not env. Extend `sync-runtime-env.sh` to render `config.json` from OpenBao
   and mount it, rather than env injection.
8. **Spec discussion seeding.** Decide whether platform-spec discussion
   categories are created manually by moderators or auto-seeded via the Write
   API (mirroring pckg). Auto-seed couples platform-spec to NodeBB at boot.
9. **Normative spec.** Adding a community forum is an observable platform
   behavior. Per AGENTS.md, an OpenSpec change introducing a
   `community--forum` capability (SHALL requirements + scenarios) should
   precede deployment.
10. **Blog-comments / inline embedding** is explicitly deferred — confirm it
    stays out of v1 scope.

## References

- NodeBB docs home: https://docs.nodebb.org/
- Docker install: https://docs.nodebb.org/installing/cloud/docker/
- `config.json` reference: https://docs.nodebb.org/configuring/config/
- Themes: https://docs.nodebb.org/development/themes/
- Plugins: https://docs.nodebb.org/development/plugins/
- Write API (ReDoc): https://docs.nodebb.org/api/write
- Read API (ReDoc): https://docs.nodebb.org/api/read
- Write API OpenAPI source: `NodeBB/NodeBB` `public/openapi/write.yaml`
  (v3, in core since v1.15.0; supersedes `nodebb-plugin-write-api` v2)
- Category create impl: `NodeBB/NodeBB` `src/categories/create.js`,
  `src/controllers/write/categories.js`
- Docker compose (pgsql): `NodeBB/NodeBB` `docker-compose-pgsql.yml`
- NodeBB Dockerfile: `NodeBB/NodeBB` `Dockerfile` (image
  `ghcr.io/nodebb/nodebb`)
- OIDC plugin candidates:
  - `Alexkin2609/nodebb-plugin-sso-oidc`
  - `ShadowsOverWestgate/nodebb-plugin-authentik-oidc` (archived)
  - `loversama/nodebb-plugin-shadowauth-oidc`
- Beskid auth contract: `beskid_sites/apps/shell-template/docs/authelia.md`,
  `beskid_sites/apps/shell-template/compose/authelia/configuration.yml`,
  `beskid_sites/_planning/auth/Plan.md`
- Beskid production compose: `beskid_infra/compose/production/docker-compose.yml`
- pckg architecture: `beskid_sites/_planning/pckg/Plan.md`
- platform-spec architecture: `beskid_sites/_planning/platform-spec/Plan.md`
