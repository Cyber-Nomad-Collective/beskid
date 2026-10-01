---
title: Report a public bug
description: Report a reproducible problem after signing in to Tracker through Authentik.
pageKind: task
diagramPolicy: not-needed
diagramOmissionReason: The public bug-report form is a short linear procedure.
audience:
  - platform user
authority:
  status: informative
  sourceLabel: Pinned Tracker bug-report contract
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/c7da5b60e70fe87b10b1b3cde7e91c39af32136a/README.md
  limits: This task reports bugs through Tracker. It does not create or maintain roadmap tasks, versions, workstreams, labels, or synchronization settings.
verified:
  revision: c7da5b60e70fe87b10b1b3cde7e91c39af32136a
  date: 2026-09-08
---

Tracker requires an Authentik session before you can read the [bug list](https://tracker.beskid-lang.org/bugs) or report a bug. Tracker synchronizes eligible `bug` issues with GitHub; it does not use GitHub for roadmap maintenance.

## Prerequisites

Use a browser and prepare a reproducible problem with its observed result, expected result, and safe steps. Remove secrets, access tokens, private URLs, and personal data from the report.

## Actions

1. Open the [Tracker bug list](https://tracker.beskid-lang.org/bugs).
2. Select **Sign in** through Authentik before reading the list.
3. Search the bug list for the reproducible problem.
4. Select an area in the Tracker report form.
5. Select a sub-area for the selected area.
6. Enter a required Summary that identifies the problem.
7. Enter the Expected behavior that you need.
8. Enter the Actual behavior that you observed.
9. Enter Reproduction steps that another user can follow.
10. Submit the bug report after you verify that it contains no secret.

## Expected result

Tracker shows a bug report for the reproducible problem in the signed-in bug list. The report contains a Summary, Expected behavior, Actual behavior, and Reproduction steps without a secret.

## Recovery

If Tracker shows no signed-in account, complete Authentik sign-in and return to the bug list. If the report form does not load, record the visible error and use the [Tracker operator contract](/docs/services/tracker/) for service recovery. Do not create a version or workstream to report a bug.

## Next task

Open [Read Tracker](/docs/platform/tracker/) to follow delivery status, or open [Use your account](/docs/platform/account/) for the Authentik sign-in procedure.
