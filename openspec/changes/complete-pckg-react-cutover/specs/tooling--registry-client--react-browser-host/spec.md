## ADDED Requirements

### Requirement: pckg has one React browser host

The pckg registry SHALL serve its browser application from the built React/Vite
client. The production root document MUST load the Vite entrypoint and MUST
NOT load Blazor framework scripts or require a Blazor circuit. The image MUST
contain exactly one served copy of the React distribution.

#### Scenario: A visitor opens the registry root

- **GIVEN** the immutable pckg image is running
- **WHEN** a visitor requests `/`
- **THEN** it receives the React `index.html` and its declared Vite assets, and
  the response contains no `/_framework/blazor.web.js` reference

### Requirement: SPA fallback preserves server route ownership

The React fallback SHALL apply only to extensionless browser routes outside
server-owned namespaces. It MUST NOT serve HTML for `/api`, `/health`,
`/metrics`, `/hubs`, authentication or onboarding actions, artifact/download
routes, OpenAPI routes, or a request for a missing concrete static asset.

#### Scenario: A nested React route is requested directly

- **GIVEN** a valid React route such as `/packages/example` or
  `/dashboard/packages/my`
- **WHEN** it is requested directly from the server
- **THEN** the server returns the React index document

#### Scenario: A server-owned request is made

- **GIVEN** the pckg server is running
- **WHEN** a client requests an API, health, hub-negotiation, authentication,
  onboarding, artifact, or missing static-asset route
- **THEN** that route retains its server semantics and never receives the SPA
  fallback document

### Requirement: React cutover preserves required registry behavior

Before the Blazor host is removed, every supported browser route SHALL have a
React implementation or an explicit documented redirect/retirement. The
server's cookie, API-key, and Bearer authentication behavior, API contracts,
and websocket endpoints MUST remain unchanged.

#### Scenario: A supported legacy browser route is inventoried

- **GIVEN** a route previously mapped by the Blazor host
- **WHEN** the React cutover is verified
- **THEN** the route is covered by React, an explicit compatible redirect, or
  an approved retirement, with no implicit Blazor fallback

#### Scenario: Authenticated client traffic reaches server APIs

- **GIVEN** a request authenticated by a session cookie, API key, or Bearer
  token
- **WHEN** it reaches a protected registry API after the cutover
- **THEN** authorization outcomes match the pre-cutover API contract

### Requirement: pckg image promotion verifies React delivery

An immutable pckg image SHALL prove before promotion that its React entrypoint,
one nested browser route, and one concrete Vite asset are served successfully;
it SHALL also prove that a server-owned health or API route is not rewritten to
the React document.

#### Scenario: An image has a broken static handoff

- **GIVEN** an image omits its Vite output or serves it from an unmounted path
- **WHEN** the image delivery smoke test runs
- **THEN** the image lane fails before a digest can be promoted
