---
title: Verify Production Delivery
description: Verify Woodpecker publication, Watchtower reconciliation, and production health without giving build automation deployment authority.
pageKind: task
diagramPolicy: not-needed
diagramOmissionReason: The numbered promotion and rollback procedure is already linear.
audience:
  - service operator
  - release maintainer
authority:
  status: security-sensitive
  sourceLabel: Canonical staged-delivery and observability requirement
  sourceHref: https://beskid-lang.org/docs/standard/staged-delivery-observability/
  limits: This page does not deploy or roll back a production container. The production operator owns those external actions.
verified:
  revision: 1c48165332356625e6ce1e273ac8c84e46c8a195
  date: 2026-09-09
---

Keep registry and production credentials in their secret managers. Do not print,
commit, copy, or put a token on a command line. Woodpecker may publish platform
images, but it cannot start, replace, or roll back production containers.
Watchtower is the sole automated reconciliation authority.

## Prerequisites

Confirm the Woodpecker publication came from `main`, was not a pull request,
and consumed successful Linux, macOS, and Windows build evidence. Confirm the production host is authenticated
to `cr.beskid-lang.org` and Watchtower is healthy.

## Actions

1. Open the successful Woodpecker publication for the intended `main` commit.
2. Record its build URL, full source SHA, and three successful native build results.
3. Verify that its image manifest contains five immutable digest records matching the source SHA.
4. Confirm all five immutable tags exist as `cr.beskid-lang.org/beskid/<lane>:sha-<full-sha>`.
5. Confirm each controlled `production` tag resolves to the intended image.
6. Inspect Watchtower logs for a successful reconciliation of `website`, `learn`, `tracker`, `nexus`, and `pckg`.
7. Run the public health checks documented in [Health and monitoring](/docs/operations/health-and-monitoring/).
8. Record the immutable tag, reconciliation timestamp, and public result for each service.

## Expected result

The recorded Woodpecker source SHA matches every immutable image tag, Watchtower
reports the corresponding reconciliation, and each public service is healthy.
No CI job performed a production container action.

## Recovery

If publication or health verification fails, preserve the Woodpecker URL, source
SHA, finalized image manifest when present, Watchtower window, and failed
endpoint status. Promotion and promoter-cleanup failures occur after manifest
finalization, so use that artifact to identify any partially advanced tag set.
Pause Watchtower if continued reconciliation is unsafe. The production operator
can retag the last known-good immutable `sha-*` image as `production`; CI has no
authority to perform that recovery. Repeat the public health checks afterward.

## Next task

[Verify health and monitoring evidence](/docs/operations/health-and-monitoring/).
