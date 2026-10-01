---
title: Operate Authentication
description: Verify the production Authentik and Caddy sign-in boundary.
pageKind: task
diagramPolicy: not-needed
diagramOmissionReason: The service contract table is clearer than a diagram for one service.
audience:
  - service operator
  - maintainer
authority:
  status: security-sensitive
  sourceLabel: Pinned production Compose authentication contract
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid/blob/98ec5030dae564ed28ef34062726c2cc5d16b3c8/beskid_sites/deploy/docker-compose.yml
  limits: This page contains no credentials. The production Compose definition controls the deployed sign-in path.
verified:
  revision: 98ec5030dae564ed28ef34062726c2cc5d16b3c8
  date: 2026-10-01
---

Store every credential in OpenBao or another approved secret manager. Do not print, commit, or copy a secret into this page, a command argument, or an issue.

## Service contract

| Field | Verified value |
| --- | --- |
| Purpose | Authentik provides GitHub OAuth and browser sessions through Caddy forward-auth. |
| Audience | Users sign in. Production operators maintain the identity boundary. |
| Public boundary | `https://auth.beskid-lang.org` reaches Authentik through the shared Caddy edge. |
| Local boundary | The `authentik-server` container exposes port `9000` only to the Compose networks. |
| Authentication | Caddy checks Authentik before forwarding Tracker and Nexus requests. Learn and pckg forward requests only when an Authentik session exists. |
| Persistent state | PostgreSQL stores identity data in the `authentik-postgres-data` volume. |
| Container image | `ghcr.io/goauthentik/server:2025.10.4` runs the server and worker. |
| Health check | `ak healthcheck` runs in the server and worker containers; PostgreSQL uses `pg_isready`. |
| Deployment owner | The production operator applies the standalone `beskid_sites/deploy` Compose definition. |
| Secret source | OpenBao or the ignored production deployment `.env` provides Authentik and GitHub OAuth values. |
| Monitoring | Server, worker, PostgreSQL, and Caddy route health identify separate failure boundaries. |
| Recovery | Restore the known-good Compose definition and identity database backup through the production operator. |

## Prerequisites

Confirm the selected production deployment revision and authorized access to its secret manager. The secret source must provide `AUTHENTIK_SECRET_KEY`; initial bootstrap also requires a one-time `AUTHENTIK_BOOTSTRAP_TOKEN`. The GitHub OAuth callback is `https://auth.beskid-lang.org/source/oauth/callback/github/`.

## Actions

1. Confirm that `AUTHENTIK_POSTGRES_PASSWORD`, `AUTHENTIK_SECRET_KEY`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET` are available in the production secret source without displaying their values.
2. Inspect the Compose health status of `authentik-postgresql`, `authentik-server`, and `authentik-worker`.
3. Open `https://auth.beskid-lang.org` to verify the public Authentik route.
4. Verify that the GitHub OAuth callback matches the configured public Authentik origin.
5. Inspect the Caddy forward-auth routes for Tracker and Nexus in the pinned service contract.
6. Record only the health states, route status, revision, and time.

## Expected result

The server and worker pass `ak healthcheck`, and PostgreSQL reports healthy. The public origin reaches Authentik, and Caddy forward-auth protects Tracker and Nexus. Identity data remains on the `authentik-postgres-data` volume across a redeploy.

## Recovery

If sign-in fails, preserve the public status and time without copying cookies or private responses. Inspect server, worker, PostgreSQL, and Caddy health separately. Ask the production operator to restore the known-good Compose definition or the `authentik-postgres-data` backup and redeploy when the identified failure requires recovery.

## Next task

For browser sign-in, see [Use your account](/docs/platform/account/). For controlled service recovery, [verify production delivery](/docs/operations/deployment/).
