## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Contracts and edge cases conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
