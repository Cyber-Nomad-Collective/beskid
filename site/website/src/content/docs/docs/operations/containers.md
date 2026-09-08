---
title: Verify Service Containers
description: Verify image, port, profile, and persistent-volume boundaries before deployment.
audience:
  - self-hoster
  - service operator
authority:
  status: informative
  sourceLabel: Pinned production Compose contract
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_infra/blob/b9c0b9318f40d3cf34197dcf0a7f59059fea6d71/compose/production/docker-compose.yml
  limits: This page summarizes a pinned Compose revision. The rendered lane payload controls a deployment.
verified:
  revision: b9c0b9318f40d3cf34197dcf0a7f59059fea6d71
  date: 2026-09-08
---

The production template contains six application images. PostgreSQL and Memgraph are internal state services. Public origins use standard HTTPS. Coolify target URLs include the container port.

## Prerequisites

Use a supported container engine and the pinned Compose contract. Obtain the exact release manifest and the lane configuration without changing them.

## Actions

1. Render the configuration with `docker compose --env-file .env.example config` from the infrastructure production Compose directory.
2. Confirm that every application image resolves to an immutable digest from the release manifest.
3. Confirm that each service has all persistent volumes attached before it starts.

| Service | Container port | Persistent state |
| --- | ---: | --- |
| site | 80 | No service volume. |
| auth | 8090 | `auth-data`. |
| learn | 80 | No service volume in the pinned contract. |
| tracker | 3000 | `tracker-data`. |
| nexus | 8452 | `nexus-data`. |
| pckg | 8082 | `pckg_packages`; PostgreSQL uses `pckg_pg_data`. |

## Expected result

Compose validation succeeds. Every required container is healthy, has an immutable digest, and uses the correct persistent volume boundary.

## Recovery

If Compose validation fails, inspect the container logs, fix the lane input, and render it again. If a volume name differs from the recorded lane, stop and do not delete or recreate a persistent volume to make validation pass.

## Next task

[Verify production delivery](/docs/operations/deployment/) or hand off the verified container contract to the production operator.
