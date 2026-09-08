---
title: Operate the Platform
description: Select the safe container, deployment, health, or recovery procedure.
audience:
  - self-hoster
  - service operator
authority:
  status: security-sensitive
  sourceLabel: Pinned platform deployment matrix
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_infra/blob/b9c0b9318f40d3cf34197dcf0a7f59059fea6d71/docs/deploy-matrix.md
  limits: This page does not identify a Coolify service or contain a credential. The configured lane remains authoritative.
verified:
  revision: b9c0b9318f40d3cf34197dcf0a7f59059fea6d71
  date: 2026-09-08
---

Store runtime and deployment credentials in OpenBao or the protected GitHub environment. Do not print, commit, copy, or reuse a lane secret.

## Prerequisites

Select the exact Coolify lane. Obtain a lane-scoped OpenBao token and a separate Coolify token through the approved operator process.

## Actions

1. Review [Containers](/docs/operations/containers/) and identify the required images and volumes.
2. Follow [Deploy and roll back](/docs/operations/deployment/) with one immutable release manifest.
3. Verify [Health and monitoring](/docs/operations/health-and-monitoring/) before you promote the release.

## Expected result

All application services run from immutable image digests. The selected lane reports healthy services, and persistent volumes remain attached.

## Recovery

If a required check fails, stop promotion. Preserve the failed release manifest and logs. Let the delivery path restore the previous Compose payload, then verify health again.

## Next task

[Inspect the container contract](/docs/operations/containers/).
