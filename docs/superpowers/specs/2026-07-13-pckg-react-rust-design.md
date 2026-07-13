# pckg React and Rust Migration Design

## Goal

Replace pckg's interactive Blazor UI and .NET host with a React frontend and a Rust service while preserving the published registry HTTP contract. Authentication moves completely to the central Auth Hub and supports GitHub application login only.

## Decisions

- Restore `beskid_web_common/packages/beskid-ui` and `beskid-ui-react`; they are the canonical UI and styling source for all Beskid web applications.
- Build the pckg browser application with React, TanStack Start/Router, React Query, Tailwind 4, and `@beskid/ui-react` / `@beskid/beskid-ui`. Do not copy component primitives or tokens into pckg.
- Make Auth Hub the sole identity authority. pckg redirects to Auth Hub with `app=pckg`, verifies the paired handoff on `/api/auth/hub-finish`, and creates only a pckg session referencing the Auth Hub GitHub identity. pckg local passwords, registration, onboarding, Identity cookies, and bearer tokens are removed.
- Retain pckg-owned profile, authorization, moderation, publisher, package visibility, and API-key records keyed by a stable Auth Hub subject. API keys remain pckg credentials for automated CLI/CI use.
- Introduce a Rust Axum/Tower server as a compatibility-first service. It preserves `/api` routes, multipart field names, response shapes, status codes, package URLs, port `8082`, Postgres, filesystem artifact layout, health, metrics, OpenAPI, and rate limits. Existing Rust CLI and CI clients are the black-box contract suite.
- Migrate in stages. First establish contract fixtures and read-only endpoints, then authenticated browser flows and mutation endpoints, then package/workspace publishing. Remove Blazor/.NET only after the compatibility suite covers every retained surface.

## Frontend architecture

`pckg/web` owns pckg routes, feature components, typed API client, and tests. The shared package owns primitives, theme tokens, and hub chrome. Every browser data action uses the typed pckg API client; no React component reaches Postgres or replicates server DTOs.

Initial vertical slices are public browse/detail, Auth Hub sign-in/finish/logout, the authenticated dashboard, and package publish management. Legacy malformed dashboard links redirect to `/dashboard/packages/my`; placeholder upload and metadata routes redirect to the working dashboard flows.

## Server architecture

The Rust server is split into `beskid_pckg_contract` (routes and DTOs), `beskid_pckg_artifact` (ZIP/document/workspace validation), `beskid_pckg_domain` (use cases), `beskid_pckg_store` (Postgres and artifact storage), `beskid_pckg_auth` (Auth Hub handoff and API keys), and `beskid_pckg_server` (Axum composition). The existing `beskid_pckg` crate remains the client.

The service accepts the Auth Hub handoff once, derives the GitHub login and hub session id, persists/updates a pckg user mapping, and sets a pckg HttpOnly session cookie. The service never receives GitHub access tokens or stores passwords. Authorization reads pckg roles and permissions from the registry database.

## Error handling and testing

All retained API paths receive black-box contract tests before porting. Tests cover anonymous, Auth Hub session, and API-key access; error status/body; redirect location; package artifact checksum and download; and yanked/private visibility. React uses route-level error and not-found boundaries, and tests high-value user actions with Vitest.

## Non-goals for the first delivery

- Changing package artifact formats, URLs, or CLI commands.
- Reworking pckg's business rules while porting them.
- Introducing a second shared UI library or a new authentication provider.
