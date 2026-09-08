---
title: Verify Production Delivery
description: Verify one release manifest and hand production recovery to the owning operator.
audience:
  - service operator
  - release maintainer
authority:
  status: security-sensitive
  sourceLabel: Pinned production Watchtower verification workflow
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid/blob/90c40a91fefa8150134663de120afcb1ef582f2a/.github/workflows/reusable-promote.yml
  limits: This page does not deploy or roll back a production container. The production operator owns those external actions.
verified:
  revision: 90c40a91fefa8150134663de120afcb1ef582f2a
  date: 2026-09-08
---

Keep the lane-scoped OpenBao and production credentials in their secret manager. Do not print, commit, copy, or put a token on a command line. Never invent `COOLIFY_SERVICE_UUID`; ask the owning operator for the configured external identifier.

The root workflow and the pinned infrastructure guide conflict. The infrastructure guide describes CI-driven Coolify deployment and rollback. The current root `reusable-promote.yml` workflow says that CI cannot start, replace, or roll back production containers. It only waits for Watchtower and runs production smoke checks. This ownership conflict is under reconciliation. Follow the current root workflow for verification, and stop when a production container action is necessary.

A checksummed release manifest records image digests and source identity. The images are signed separately. Do not call the manifest itself signed.

## Prerequisites

Use a protected GitHub environment for production verification. Confirm that each credential is lane-scoped. Confirm that pull requests cannot read it.

## Actions

1. From `beskid_infra`, run `just seed-openbao-check` to verify required key names without printing their values.
2. Open the successful root `platform-delivery.yml` run.
3. Select its checksummed release manifest.
4. Verify the manifest checksum.
5. Run `./scripts/ci/validate-promotion-source.sh release/workflow-run.json release/release-manifest.json`.
6. Inspect the separate image-signature evidence for each listed digest.
7. Observe the `reusable-promote.yml` production verification job.
8. Wait for Watchtower during the configured smoke retry window.
9. Record the verification status and deployment window.

## Expected result

The checksummed release manifest contains exact image digests and the verified source run. Separate records prove the image signatures. The production job reports successful smoke checks after its Watchtower wait window.

## Recovery

If manifest or smoke verification fails, stop the release workflow. Preserve the run URL, manifest checksum, deployment window, and failed endpoint status. Escalate container replacement or rollback to the production operator. CI has no authority to perform that recovery. After the operator restores the previously recorded production state, repeat the public smoke checks.

## Next task

[Verify health and monitoring evidence](/docs/operations/health-and-monitoring/).
