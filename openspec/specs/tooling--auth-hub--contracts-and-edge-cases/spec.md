<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Contracts and edge cases Specification

## Purpose

AUTH_HUB_* and shared auth environment variables, OpenBao paths, pairing edge cases, and legacy AUTH_HUB_SECRET migration.

## Requirements

### Requirement: Auth hub and consumer environment contract
Auth hub deployments SHALL set `AUTH_HUB_PUBLIC_URL` (public origin, no trailing slash) and `SESSION_SECRET` (≥32 chars). Consumer apps (tracker, nexus, pckg) SHALL set the same `AUTH_HUB_PUBLIC_URL` value pointing at the hub, a per-service `SESSION_SECRET` distinct from the hub secret, and a per-app service token from pairing. Consumers MUST NOT receive hub `GITHUB_CLIENT_*` secrets. New deployments MUST NOT use legacy `AUTH_HUB_SECRET` as the shared handoff secret.

#### Scenario: Consumer env excludes hub GitHub secrets
- **GIVEN** a paired tracker, nexus, or pckg consumer deployment
- **WHEN** runtime environment variables are inspected
- **THEN** `AUTH_HUB_PUBLIC_URL` matches the hub origin, `SESSION_SECRET` is a per-service secret ≥32 characters, and hub `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` are absent

### Requirement: Handoff JWT claim verification
Handoff JWTs SHALL include `iss` equal to `beskid-auth-hub`, `app` equal to `tracker`, `nexus`, or `pckg`, plus `sid`, `login`, `avatar_url`, optional `name`, and `exp`. Verification MUST reject tokens when `expectedApp` does not match the `app` claim.

#### Scenario: App claim mismatch rejected
- **GIVEN** a handoff JWT whose `app` claim is `tracker`
- **WHEN** a nexus consumer verifies the token with `expectedApp` set to `nexus`
- **THEN** verification rejects the token

### Requirement: Pairing and handoff edge cases
`AUTH_HUB_PUBLIC_URL` on the hub MUST match the Coolify TLS domain used for OAuth redirects. Expired pairing codes SHALL expire after 24 hours and require a new admin request. Unpaired consumers SHALL fail hub-finish sign-in with 401 until pairing completes. Consumers MUST set a pre-login redirect cookie and hub-finish MUST restore it. Calls to `/api/v1/github/*` MUST include `Authorization: Bearer <hubUserToken>`.

#### Scenario: Unpaired consumer cannot finish sign-in
- **GIVEN** a consumer app that has not completed hub pairing
- **WHEN** a user completes OAuth and the hub attempts hub-finish
- **THEN** the finish step fails with 401 until pairing completes

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/auth-hub/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/tooling/auth-hub/contracts-and-edge-cases/content.md`  
**SHA-256:** `ddf209c4bcff321114bcef8101d10b492b17ab4e568e78a4d2110590ca0c1b01`

<details>
<summary>Migrated source text</summary>

``````markdown
## Environment contract (`AUTH_HUB_*` and shared auth)

### Auth hub (`site/auth`)

| Variable | Required | Notes |
| --- | --- | --- |
| `AUTH_HUB_PUBLIC_URL` | yes | Public origin, no trailing slash (e.g. `https://auth.beskid-lang.org`) |
| `SESSION_SECRET` | yes | ≥32 chars; hub session cookie signing |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | yes* | Set after `/onboarding` (stored in hub SQLite) |
| `GITHUB_OAUTH_CALLBACK_URL` | no | Defaults to `{AUTH_HUB_PUBLIC_URL}/callback` |
| `AUTH_SETUP_TOKEN` | no | Protects re-onboarding when already configured |
| `AUTH_HUB_SECRET` | deprecated | Legacy shared handoff secret; **must not** be used for new deployments |
| `TRACKER_PUBLIC_URL`, `NEXUS_PUBLIC_URL`, `PCKG_PUBLIC_URL` | no | Informative defaults for pairing UI |

OpenBao path: `secret/beskid/production/auth`. See [openbao-layout.md](https://github.com/Cyber-Nomad-Collective/beskid_infra/blob/main/docs/openbao-layout.md).

### Consumer apps (tracker, nexus, pckg)

| Variable | Required | Notes |
| --- | --- | --- |
| `AUTH_HUB_PUBLIC_URL` | yes | **Same value on every consumer** — points at the hub |
| `SESSION_SECRET` | yes | ≥32 chars; **per-service** session cookie signing (distinct from hub `SESSION_SECRET`) |
| Service token | yes | Per-app secret from pairing; stored in app runtime config — **not** a shared `AUTH_HUB_SECRET` |

Consumers **must not** receive hub `GITHUB_CLIENT_*` secrets.

### Tracker-specific

| Variable | Required | Notes |
| --- | --- | --- |
| `TRACKER_PUBLIC_URL` | recommended | Webhooks, pairing `publicUrl`, autopair |
| `GITHUB_SYNC_TOKEN` | recommended | Autopair via GitHub API; background issue sync |
| `TRACKER_PAIRING_APPROVER_LOGIN` | recommended | Autopair without sync token |
| `GITHUB_WEBHOOK_SECRET` | optional | Verifies `POST /api/webhooks/github` |

OpenBao path: `secret/beskid/production/tracker`.

### Nexus-specific

| Variable | Required | Notes |
| --- | --- | --- |
| `GITNEXUS_HOME` | yes | `/data/gitnexus` volume |
| `NEXUS_SETUP_TOKEN` | recommended | Protects setup before hub pairing |
| `GITHUB_WEBHOOK_SECRET` | optional | Push webhook HMAC for re-index |

OpenBao path: `secret/beskid/production/nexus`.

### pckg-specific

| Variable | Required | Notes |
| --- | --- | --- |
| `PCKG_PUBLIC_URL` | recommended | Pairing and public registry origin |
| `POSTGRES_PASSWORD` | yes | Database credential |
| `GITHUB_SYNC_TOKEN` | recommended | Pairing approver via GitHub API |
| `PCKG_PAIRING_APPROVER_LOGIN` | recommended | Autopair without sync token |

OpenBao path: `secret/beskid/production/pckg`.

## Handoff JWT claims

| Claim | Type | Rule |
| --- | --- | --- |
| `iss` | string | **Must** equal `beskid-auth-hub` |
| `app` | string | **Must** be `tracker`, `nexus`, or `pckg` |
| `sid` | string | Consumer session id |
| `login` | string | GitHub login |
| `avatar_url` | string | Profile image URL |
| `name` | string | Optional display name |
| `exp` | number | Default TTL: 7 days (`HUB_USER_TOKEN_TTL_SECONDS`) |

Verification **must** reject tokens when `expectedApp` does not match `app`.

## Edge cases

| Case | Policy |
| --- | --- |
| OAuth redirect mismatch | `AUTH_HUB_PUBLIC_URL` on the hub **must** match the Coolify TLS domain |
| Expired pairing code | Codes expire after 24h; admin issues a new request |
| Consumer not paired | Sign-in redirects fail at hub-finish with 401 until pairing completes |
| Legacy `AUTH_HUB_SECRET` | Hub may read for migration; consumers should use per-app service tokens only |
| Return path loss | Consumer **must** set pre-login redirect cookie; hub-finish **must** restore it |
| GitHub proxy | Calls to `/api/v1/github/*` **must** include `Authorization: Bearer <hubUserToken>` |

## Production URLs (reference)

Coolify proxy URLs include explicit ports. App-facing env origins omit the port suffix.

| Service | Coolify URL | `*_PUBLIC_URL` |
| --- | --- | --- |
| auth | `https://auth.beskid-lang.org:8090` | `AUTH_HUB_PUBLIC_URL` |
| tracker | `https://tracker.beskid-lang.org:3000` | `TRACKER_PUBLIC_URL` |
| nexus | `https://nexus.beskid-lang.org:8452` | (pairing `publicUrl`) |
| pckg | `https://pckg.beskid-lang.org:8082` | `PCKG_PUBLIC_URL` |

Canonical matrix: [beskid_infra/docs/deploy-matrix.md](https://github.com/Cyber-Nomad-Collective/beskid_infra/blob/main/docs/deploy-matrix.md).

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->
``````

</details>
