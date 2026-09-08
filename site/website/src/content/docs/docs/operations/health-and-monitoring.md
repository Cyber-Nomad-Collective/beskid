---
title: Check Health and Monitoring
description: Test each service boundary and collect safe evidence for recovery.
audience:
  - service operator
  - maintainer
authority:
  status: informative
  sourceLabel: Pinned platform deployment matrix
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_infra/blob/b9c0b9318f40d3cf34197dcf0a7f59059fea6d71/docs/deploy-matrix.md
  limits: Endpoint success proves availability only. It does not prove complete application correctness.
verified:
  revision: b9c0b9318f40d3cf34197dcf0a7f59059fea6d71
  date: 2026-09-08
---

Use the release manifest, health response, and monitoring timestamp as one evidence set. Do not include cookies, tokens, or private response bodies.

## Prerequisites

Record the release manifest SHA and deployment time. Obtain monitoring access for the selected lane.

## Actions

1. Check Auth at `/api/v1/health`, Learn at `/api/health`, Tracker at `/api/health`, and Nexus at `/api/health`.
2. Check pckg at `/health/ready` and the Website at `/`.
3. Compare the public checks with container health and the monitor at `monitor.beskid-lang.org`.

| Boundary | Healthy evidence | Next diagnostic |
| --- | --- | --- |
| Website | Successful HTTP status for `/`. | Site container and proxy logs. |
| Auth | Successful HTTP status for `/api/v1/health`. | Auth volume, session configuration, and OAuth callback. |
| Learn | Successful HTTP status for `/api/health`. | One safe lesson check and runtime-kit evidence. |
| Tracker | Successful HTTP status for `/api/health`. | SQLite volume and Auth hub configuration. |
| Nexus | Successful HTTP status for `/api/health`. | Proxy trust boundary and `nexus-data`. |
| pckg | Successful HTTP status for `/health/ready`. | PostgreSQL connectivity and artifact volume. |

## Expected result

Every required route returns a successful HTTP status. Container and public evidence identify the same release manifest and deployment window.

## Recovery

If one boundary fails, preserve its correlation evidence and inspect only that service. If several services fail, inspect the proxy and shared lane first. Perform rollback when the new manifest caused the failure, then repeat all checks.

## Next task

[Review the service-specific contract](/docs/services/).
