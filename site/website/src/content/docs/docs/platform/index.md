---
title: Use the Beskid platform
description: Select a public platform task for your account, delivery status, bug report, or repository graph.
pageKind: guide
diagramPolicy: required
audience:
  - platform user
authority:
  status: informative
  sourceLabel: Pinned Beskid project overview
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid/blob/3143396b796d86c1a70a0bfb1aa4761b593bbae5/README.md
  limits: This guide routes public tasks. It does not define service operation or settle service-specific authentication contracts.
verified:
  revision: 3143396b796d86c1a70a0bfb1aa4761b593bbae5
  date: 2026-09-08
---

Use this guide to select a public platform task. Read public information before you sign in. Use an operator contract only for service operation, not ordinary product use.

## Orientation

Use a browser and an internet connection. Identify the platform task that you need to complete. Record a public route and visible error when a service does not respond.

## Choose a platform task

1. Open [Use your account](/docs/platform/account/) when you need the Hub sign-in or account page.
2. Open [Read Tracker](/docs/platform/tracker/) when you need delivery status or public bugs.
3. Open [Report a bug](/docs/platform/report-bug/) when you have a reproducible problem.
4. Open [Explore Nexus](/docs/platform/nexus/) when you need a repository graph.
5. Open the linked operator contract only when the public route needs service recovery.

The task map keeps public product use separate from service recovery.

```mermaid
flowchart TD
  accTitle: Platform user task routing
  accDescr: A platform user selects a public task. Account use, delivery reading, bug reporting, and graph reading stay separate from an operator contract.
  A[Need an account?] --> B[Use account task]
  C[Read delivery status] --> D[Read Tracker task]
  E[Report a bug] --> F[Bug report task]
  G[Explore a repository graph] --> H[Explore Nexus task]
  I[Public route fails] --> J[Operator contract]
```

### Diagram text

1. Use the account task for an account sign-in or account page.
2. Use the Tracker task to read delivery status. This public task does not maintain a version or workstream.
3. Use the bug task to report a reproducible problem after you sign in.
4. Use the Nexus task to select an indexed repository graph and inspect it.
5. Use an operator contract only when a public route fails. It preserves service recovery actions outside ordinary product use.

## Limits

You have a selected task for the account, delivery status, bug, or repository graph. You know that service recovery belongs in the linked operator contract.

If a public route fails, record its URL, time, and visible error. Give that record to the service operator. Do not provide a secret, pairing value, or private response body.

## Next steps

Open [Use your account](/docs/platform/account/) to begin with the Hub, or open [Read Tracker](/docs/platform/tracker/) to read delivery status.
