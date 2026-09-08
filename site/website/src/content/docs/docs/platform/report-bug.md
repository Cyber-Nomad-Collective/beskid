---
title: Report a public bug
description: Report a reproducible problem from the public Tracker bug list after you sign in.
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

The [public bug list](https://tracker.beskid-lang.org/bugs) is visible without sign-in. You must sign in to report a bug. Tracker synchronizes eligible `bug` issues with GitHub; it does not use GitHub for roadmap maintenance.

## Prerequisites

Use a browser and prepare a reproducible problem with its observed result, expected result, and safe steps. Remove secrets, access tokens, private URLs, and personal data from the report.

## Actions

1. Open the [public bug list](https://tracker.beskid-lang.org/bugs).
2. Search the public bug list for the reproducible problem.
3. Select **Sign in** when you need to create a report.
4. Enter the observed result in the Tracker report form.
5. Enter the expected result in the Tracker report form.
6. Submit the bug report after you verify that it contains no secret.

## Expected result

Tracker shows a bug report for the reproducible problem in the public bug list. The report contains the observed result and expected result without a secret.

## Recovery

If Tracker shows no signed-in account, complete the public sign-in flow and return to the public bug list. If the report form does not load, record the visible error and use the [Tracker operator contract](/docs/services/tracker/) for service recovery. Do not create a version or workstream to report a bug.

## Next task

Open [Read Tracker](/docs/platform/tracker/) to follow delivery status, or open [Use your account](/docs/platform/account/) to review the Hub account page.
