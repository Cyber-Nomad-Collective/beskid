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
  sourceLabel: Standalone production deployment checks
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid/blob/1c48165332356625e6ce1e273ac8c84e46c8a195/beskid_sites/deploy/deploy.sh
  limits: Endpoint success proves availability only. It does not prove complete application correctness.
verified:
  revision: 1c48165332356625e6ce1e273ac8c84e46c8a195
  date: 2026-09-08
---

Use separate AppVeyor publication and Watchtower reconciliation evidence for
image identity. A health handler does not expose registry tag identity. Use the
health response and monitoring timestamp only for availability evidence. Do
not include cookies, tokens, or private response bodies.

## Prerequisites

Record the expected immutable image identity from AppVeyor. Record the
Watchtower reconciliation time from the production operator. Obtain monitoring
access for production.

## Actions

1. Check the Website at `/`.
2. Check Learn at `/api/health`.
3. Check Tracker at `/api/health`.
4. Check Nexus at `/api/health`.
5. Check pckg at `/health/ready`.
6. Compare the public check times with container and Watchtower logs.
7. Inspect the same reconciliation window at `monitor.beskid-lang.org`.

| Boundary | Healthy evidence | Next diagnostic |
| --- | --- | --- |
| Website | Successful HTTP status for `/`. | Site container and proxy logs. |
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
