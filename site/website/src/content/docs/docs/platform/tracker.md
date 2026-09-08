---
title: Read Tracker delivery status
description: Read the public delivery timeline and bugs while keeping delivery, normative, and transport authorities separate.
pageKind: task
diagramPolicy: required
audience:
  - platform user
authority:
  status: informative
  sourceLabel: Pinned Tracker user contract
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/c7da5b60e70fe87b10b1b3cde7e91c39af32136a/README.md
  limits: Tracker is the delivery authority. OpenSpec remains the normative authority, and GitHub is the external bug-reporting surface only.
verified:
  revision: c7da5b60e70fe87b10b1b3cde7e91c39af32136a
  date: 2026-09-08
---

Tracker is the delivery authority for versions, roadmap tasks, and bugs. OpenSpec is the normative authority for language behavior. GitHub carries public bugs only; it does not own roadmap data.

## Prerequisites

Use a browser and identify the delivery version or public bug that you want to read. Public reading does not require a sign-in. You need sign-in for version and workstream maintenance. Sign-in does not grant all maintenance permissions. A signed-in collaborator can create and move issues. Only a repository owner or org admin can define new `roadmap/version/*` labels. Only a repository owner or org admin can approve `roadmap/spec-approval/*` links.

## Actions

1. Open the [Tracker delivery timeline](https://tracker.beskid-lang.org/).
2. Select the delivery version that you want to read.
3. Open the [public bug list](https://tracker.beskid-lang.org/bugs) when you need known bug status.
4. Open [Report a bug](/docs/platform/report-bug/) when the public list does not contain your problem.
5. Use the [Beskid Standard](/docs/standard/) when you need a normative behavior requirement.

```mermaid
flowchart TD
  accTitle: Tracker delivery and bug authority
  accDescr: A public reader reads Tracker delivery data and public bugs. OpenSpec defines normative behavior. GitHub transports eligible bug reports. Signed-in maintenance remains separate.
  R[Public reader] --> T[Tracker delivery data]
  R --> B[Public bugs]
  B --> G[GitHub bug transport]
  O[OpenSpec normative authority] --> S[Beskid Standard]
  M[Signed-in maintenance] --> T
```

### Diagram text

1. A public reader opens Tracker to read delivery data and public bugs.
2. Tracker remains the delivery authority for versions, workstreams, and roadmap tasks.
3. OpenSpec is the normative authority. The Beskid Standard publishes its accepted behavior requirements.
4. GitHub is bug transport for eligible public bugs. It does not replace Tracker delivery data.
5. Signed-in maintenance changes delivery records. It is separate from public reading and from the user procedure on this page.

## Expected result

You can read the delivery timeline and public bugs. You can distinguish Tracker delivery authority from OpenSpec normative authority and GitHub bug transport.

## Recovery

If a public route does not load, record the public route, time, and visible error. Do not change a version or workstream to recover a reading problem. Use the [Tracker operator contract](/docs/services/tracker/) for service recovery.

## Next task

Open [Report a bug](/docs/platform/report-bug/) when you have a reproducible problem, or open [Explore Nexus](/docs/platform/nexus/) to read repository relationships.
