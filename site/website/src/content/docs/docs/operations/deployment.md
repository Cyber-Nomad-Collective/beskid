---
title: Deploy and Roll Back the Platform
description: Synchronize a lane, deploy one immutable manifest, and recover on failure.
audience:
  - service operator
  - release maintainer
authority:
  status: security-sensitive
  sourceLabel: Pinned manifest-driven deployment contract
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_infra/blob/b9c0b9318f40d3cf34197dcf0a7f59059fea6d71/docs/deploy-compose.md
  limits: This page does not authorize production access or name a service UUID. Protected environment policy controls promotion.
verified:
  revision: b9c0b9318f40d3cf34197dcf0a7f59059fea6d71
  date: 2026-09-08
---

Keep the lane-scoped OpenBao and Coolify tokens in their secret manager. Do not print, commit, copy, or put a token on a command line. Never invent `COOLIFY_SERVICE_UUID`; use the configured lane value.

## Prerequisites

Use a protected GitHub environment with required reviewers for production. Confirm that each credential is lane-scoped and that pull requests cannot read it.

## Actions

1. From `beskid_infra`, run `just seed-openbao-check` to verify required key names without printing their values.
2. Run `just sync-env-prod` only for the authorized production lane. Use `just sync-env-staging` for staging.
3. Select the signed release manifest from the successful delivery run. Verify its checksum and source commit.
4. Start the existing promotion workflow. Do not rebuild or replace an image during promotion.
5. Record the manifest SHA and `traceparent`, then wait for deployment, health, and smoke checks.

## Expected result

The release manifest contains exact image digests. Coolify runs the rendered payload, all smoke checks succeed, and the same `traceparent` connects workflow and runtime evidence.

## Recovery

If synchronization, deployment, or smoke verification fails, stop promotion. The deployment path must restore the previous Compose payload and poll the rollback. Verify the previous manifest after rollback. Escalate missing access or a missing service identifier to the environment administrator.

## Next task

[Verify health and monitoring evidence](/docs/operations/health-and-monitoring/).
