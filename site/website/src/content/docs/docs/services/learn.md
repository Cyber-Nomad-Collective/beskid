---
title: Operate Beskid Learn
description: Run and verify the interactive Beskid learning service.
audience:
  - learner
  - service operator
authority:
  status: informative
  sourceLabel: Pinned Learn service contract
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid/blob/90c40a91fefa8150134663de120afcb1ef582f2a/site/learn/README.md
  limits: This page describes the service boundary. It does not define language behavior.
verified:
  revision: 90c40a91fefa8150134663de120afcb1ef582f2a
  date: 2026-09-08
---

Beskid Learn provides interactive learning and runs real CLI checks against temporary learner source.

## Service contract

| Field | Verified value |
| --- | --- |
| Purpose | Interactive learning with `analyze`, `parse`, `tree`, and `run` checks. |
| Audience | Learners use lessons. Service operators verify the CLI-backed runtime. |
| Public boundary | `https://learn.beskid-lang.org`. |
| Local boundary | `pnpm run dev --port 4173` starts the frontend. The production container uses port `80`. |
| Authentication | The platform Compose contract accepts auth-hub and Learn session settings. Do not assume sign-in when these settings are absent. |
| Persistent state | Learner checks use a temporary workspace. The production Compose contract declares no durable Learn volume. |
| Container image | `ghcr.io/cyber-nomad-collective/beskid-learn`. |
| Health check | `GET /api/health` on the service port. |
| Deployment owner | The root platform delivery publishes and promotes the Learn image. |
| Secret source | Current required operation has no Learn OpenBao path. Optional auth values come from deployment configuration. |
| Monitoring | Container health and an API check show whether the web and CLI paths work. |
| Recovery | Revert to the previous verified image when either the health check or lesson smoke check fails. |

## Prerequisites

Use the interactive learning service for a verified lesson. This safe procedure requires an explicit, known `BESKID_BINARY` for a local full loop. The service can fall back to `cargo run`, but do not use that fallback in this procedure.

## Actions

1. Verify the service contract at `https://learn.beskid-lang.org/api/health`.
2. Record the health response.
3. Open `https://learn.beskid-lang.org`.
4. Select one seeded exercise.
5. Run the exercise check.
6. Inspect the real diagnostic or successful result.

## Expected result

The `/api/health` request succeeds. The service writes the submitted source to a temporary workspace, invokes the selected command, and returns its result.

## Recovery

If the page works but a check fails, verify the deployed CLI and runtime-kit evidence. If all checks fail after a release, restore the prior image digest and redeploy. Do not preserve learner source from the temporary workspace as service state.

## Next task

[Check all service health endpoints](/docs/operations/health-and-monitoring/).
