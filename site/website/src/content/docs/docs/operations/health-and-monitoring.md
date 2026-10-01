---
title: Check Health and Monitoring
description: Test each service boundary and collect safe evidence for recovery.
pageKind: task
diagramPolicy: not-needed
diagramOmissionReason: The endpoint and symptom matrix is clearer than a flow diagram.
audience:
  - service operator
  - maintainer
authority:
  status: informative
  sourceLabel: Pinned production Compose health and authentication contract
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid/blob/98ec5030dae564ed28ef34062726c2cc5d16b3c8/beskid_sites/deploy/docker-compose.yml
  limits: A public sign-in redirect does not prove backend health. Container checks prove availability only, not complete application correctness.
verified:
  revision: 98ec5030dae564ed28ef34062726c2cc5d16b3c8
  date: 2026-10-01
---

Use separate Woodpecker publication and Watchtower reconciliation evidence for
image identity. A health handler does not expose registry tag identity. Use the
health response and monitoring timestamp only for availability evidence. An
anonymous Tracker or Nexus request redirects through Caddy to Authentik and
cannot prove backend health. Do not include cookies, tokens, or
private response bodies.

## Prerequisites

Record the expected immutable image identity from Woodpecker. Record the
Watchtower reconciliation time from the production operator. Obtain monitoring
and production container health access.

## Actions

1. Check the Website at `/`.
2. Check Learn at `/api/health`.
3. Inspect Tracker's internal `/api/health` container healthcheck.
4. Inspect Nexus's internal `/api/health` container healthcheck.
5. Check pckg at `/health/ready`.
6. Verify the signed-in Tracker and Nexus routes through Authentik.
7. Compare the public and internal check times with Watchtower logs.
8. Inspect the same reconciliation window at `monitor.beskid-lang.org`.

| Boundary | Healthy evidence | Next diagnostic |
| --- | --- | --- |
| Website | Successful HTTP status for `/`. | Site container and proxy logs. |
| Learn | Successful HTTP status for `/api/health`. | One safe lesson check and runtime-kit evidence. |
| Tracker | Healthy internal `/api/health` container check and signed-in route. | SQLite volume and Authentik forward-auth configuration. |
| Nexus | Healthy internal `/api/health` container check and signed-in route. | Proxy trust boundary and `nexus-data`. |
| pckg | Successful HTTP status for `/health/ready`. | PostgreSQL connectivity and artifact volume. |

## Expected result

Public Website, Learn, and pckg routes respond. Tracker and Nexus report healthy internal checks and load after Authentik sign-in. Container and public evidence agree on the deployment window. Separate release and deployment evidence identifies the expected images.

## Recovery

If one boundary fails, preserve its correlation evidence and inspect only that service. If several services fail, inspect the proxy and shared lane first. Ask the production operator to restore the previous state when the deployment caused the failure. Repeat all checks after the operator completes recovery.

## Next task

[Review the service-specific contract](/docs/services/).
