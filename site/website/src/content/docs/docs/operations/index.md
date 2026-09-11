---
title: Operate the Platform
description: Select the safe container, deployment, health, or recovery procedure.
pageKind: guide
diagramPolicy: not-needed
diagramOmissionReason: The ordered operator checklist is clearer than a second platform diagram.
audience:
  - self-hoster
  - service operator
authority:
  status: security-sensitive
  sourceLabel: Standalone production deployment contract
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid/blob/main/beskid_sites/deploy/README.md
  limits: This page contains no credential and cannot authorize Woodpecker or Watchtower account changes.
verified:
  revision: 1c48165332356625e6ce1e273ac8c84e46c8a195
  date: 2026-09-09
---

Store runtime credentials in OpenBao and registry publication credentials in
protected Woodpecker secrets. Do not print, commit, copy, or reuse either secret.

## Orientation

Identify the Woodpecker source commit and the standalone production Compose host.
Obtain production access only through the approved operator process.

## Choose an operating procedure

1. Review [Containers](/docs/operations/containers/).
2. Identify the required images and volumes.
3. Follow [Verify production delivery](/docs/operations/deployment/) with the immutable `sha-*` image identities from Woodpecker.
4. Verify [Health and monitoring](/docs/operations/health-and-monitoring/) after Watchtower reconciles the controlled tags.

## Limits

Application services run from controlled `production` tags while matching
immutable `sha-*` tags provide audit and rollback identity. Persistent volumes
remain attached across Watchtower reconciliation.

If a required build or publish check fails, Woodpecker stops and reports the
failure. Preserve its URL, commit, status, and image evidence. The production
operator owns restore or rollback by registry retagging and Watchtower control.
After recovery, repeat production verification.

## Next steps

[Inspect the container contract](/docs/operations/containers/).
