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
  sourceLabel: Pinned platform deployment matrix
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_infra/blob/b9c0b9318f40d3cf34197dcf0a7f59059fea6d71/docs/deploy-matrix.md
  limits: Endpoint success proves availability only. It does not prove complete application correctness.
verified:
  revision: b9c0b9318f40d3cf34197dcf0a7f59059fea6d71
  date: 2026-09-08
---

Use separate release and deployment evidence for image identity. A health handler does not expose release manifest identity. Use the health response and monitoring timestamp only for availability evidence. Do not include cookies, tokens, or private response bodies.

## Prerequisites

Record the expected image identity from the release workflow. Record the deployment time from the production operator. Obtain monitoring access for the selected lane.

## Actions

1. Check Auth at `/api/v1/health`.
2. Check Learn at `/api/health`.
3. Check Tracker at `/api/health`.
4. Check Nexus at `/api/health`.
5. Check pckg at `/health/ready`.
6. Check the Website at `/`.
7. Compare the public check times with container health.
8. Inspect the same deployment window at `monitor.beskid-lang.org`.

| Boundary | Healthy evidence | Next diagnostic |
| --- | --- | --- |
| Website | Successful HTTP status for `/`. | Site container and proxy logs. |
| Auth | Successful HTTP status for `/api/v1/health`. | Auth volume, session configuration, and OAuth callback. |
| Learn | Successful HTTP status for `/api/health`. | One safe lesson check and runtime-kit evidence. |
| Tracker | Successful HTTP status for `/api/health`. | SQLite volume and Auth hub configuration. |
| Nexus | Successful HTTP status for `/api/health`. | Proxy trust boundary and `nexus-data`. |
| pckg | Successful HTTP status for `/health/ready`. | PostgreSQL connectivity and artifact volume. |

## Expected result

Every required route returns a successful HTTP status. Container and public evidence agree on the deployment window. Separate release and deployment evidence identifies the expected images.

## Recovery

If one boundary fails, preserve its correlation evidence and inspect only that service. If several services fail, inspect the proxy and shared lane first. Ask the production operator to restore the previous state when the deployment caused the failure. Repeat all checks after the operator completes recovery.

## Next task

[Review the service-specific contract](/docs/services/).
