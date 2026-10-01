---
title: Use your Beskid account
description: Sign in to a protected Beskid service through Authentik.
pageKind: task
diagramPolicy: not-needed
diagramOmissionReason: The public sign-in and account procedure is a short linear sequence.
audience:
  - platform user
authority:
  status: informative
  sourceLabel: Pinned production Compose authentication contract
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid/blob/98ec5030dae564ed28ef34062726c2cc5d16b3c8/beskid_sites/deploy/docker-compose.yml
  limits: This task covers browser sign-in only. It does not configure Authentik or change service access.
verified:
  revision: 98ec5030dae564ed28ef34062726c2cc5d16b3c8
  date: 2026-10-01
---

Authentik handles browser sign-in for protected Beskid services through the shared Caddy edge. Tracker and Nexus require a session. Learn and pckg keep their public catalogues available without one.

## Prerequisites

Use a browser, an internet connection, and a GitHub account that you can sign in to. Do not send cookies, tokens, or private responses in a public support request.

## Actions

1. Open [Tracker](https://tracker.beskid-lang.org/) or another protected Beskid service.
2. Verify that the redirect reaches Authentik at `https://auth.beskid-lang.org`.
3. Complete GitHub OAuth when Authentik offers that sign-in method.
4. Return to the selected service after authentication.

## Expected result

GitHub OAuth returns you to the selected service with a signed-in account. Access remains subject to that service's authorization rules.

## Recovery

If sign-in does not return to the service, record the visible sign-in error and the public route. If the problem continues, use the [Authentication operator contract](/docs/services/authentication/) for service availability and authorized recovery. Do not ask an operator to disclose a secret.

## Next task

Open [Read Tracker](/docs/platform/tracker/) for public delivery status, or [Explore Nexus](/docs/platform/nexus/) for a public repository graph.
