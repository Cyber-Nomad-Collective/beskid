---
title: Use your Beskid account
description: Sign in through the Hub and open the account page without performing service pairing.
pageKind: task
diagramPolicy: not-needed
diagramOmissionReason: The public sign-in and account procedure is a short linear sequence.
audience:
  - platform user
authority:
  status: informative
  sourceLabel: Pinned auth hub routes
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid/blob/3143396b796d86c1a70a0bfb1aa4761b593bbae5/site/auth/README.md
  limits: This task covers public account use. It does not pair a service, configure OAuth, or disclose a service token.
verified:
  revision: 3143396b796d86c1a70a0bfb1aa4761b593bbae5
  date: 2026-09-08
---

The Hub provides GitHub OAuth and a signed-in account page. This task does not pair a service and does not create a pairing code. It makes no claim about a specific service-auth topology.

## Prerequisites

Use a browser, an internet connection, and a GitHub account that you can sign in to. Do not enter a token or a pairing value into a public support request.

## Actions

1. Open [Hub sign-in](https://auth.beskid-lang.org/login?app=hub).
2. Complete GitHub OAuth in the GitHub browser page.
3. Open [your account](https://auth.beskid-lang.org/account).
4. Review the signed-in account details that the page displays.

## Expected result

GitHub OAuth returns you to the Hub. The account page shows a signed-in account without exposing a service token or a pairing value.

## Recovery

If sign-in does not return to the Hub, record the visible sign-in error and try the public sign-in route again. If the problem continues, use the [Authentication operator contract](/docs/services/authentication/) for service availability and authorized recovery. Do not ask an operator to disclose a secret.

## Next task

Open [Read Tracker](/docs/platform/tracker/) for public delivery status, or [Explore Nexus](/docs/platform/nexus/) for a public repository graph.
