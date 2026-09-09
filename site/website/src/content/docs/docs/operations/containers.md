---
title: Verify Service Containers
description: Verify image, port, profile, and persistent-volume boundaries before deployment.
pageKind: task
diagramPolicy: not-needed
diagramOmissionReason: The container matrix gives a more precise comparison than a diagram.
audience:
  - self-hoster
  - service operator
authority:
  status: informative
  sourceLabel: Pinned production Compose contract
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid/blob/main/beskid_sites/deploy/docker-compose.yml
  limits: This page summarizes the standalone production Compose contract. Watchtower controls labelled application updates.
verified:
  revision: 1c48165332356625e6ce1e273ac8c84e46c8a195
  date: 2026-09-09
---

The production template contains five Beskid application images, Authentik,
two PostgreSQL services, the private registry, and Watchtower. Public origins
use standard HTTPS through the shared host edge.

## Prerequisites

Use a supported container engine and the pinned Compose contract. Obtain the
exact AppVeyor source SHA and matching immutable image tags without changing
them.

## Actions

1. Render the configuration with `docker compose --env-file .env.example config` from `beskid_sites/deploy`.
2. Confirm every application image uses `cr.beskid-lang.org/beskid/*:production` and has a matching immutable `sha-*` audit tag.
3. Confirm that each service has all persistent volumes attached before it starts.

| Service | Container port | Persistent state |
| --- | ---: | --- |
| website | 80 | No service volume. |
| learn | 80 | No service volume in the pinned contract. |
| tracker | 3000 | `tracker-data`. |
| nexus | 8452 | `nexus-data`. |
| pckg | 8082 | `pckg-packages`; PostgreSQL uses its dedicated database volume. |

## Expected result

Compose validation succeeds. Every required container is healthy, every Beskid
application uses the controlled private-registry tag, and persistent volume
boundaries match the production contract.

## Recovery

If Compose validation fails, inspect the container logs, fix the lane input, and render it again. If a volume name differs from the recorded lane, stop and do not delete or recreate a persistent volume to make validation pass.

## Next task

[Verify production delivery](/docs/operations/deployment/) or hand off the verified container contract to the production operator.
