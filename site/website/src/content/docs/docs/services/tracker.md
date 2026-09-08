---
title: Operate Tracker
description: Run the Beskid delivery authority and preserve its SQLite source of truth.
audience:
  - platform user
  - service operator
  - maintainer
authority:
  status: informative
  sourceLabel: Pinned Tracker service contract
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/c7da5b60e70fe87b10b1b3cde7e91c39af32136a/README.md
  limits: This page describes delivery data operation. OpenSpec remains the normative behavior authority.
verified:
  revision: c7da5b60e70fe87b10b1b3cde7e91c39af32136a
  date: 2026-09-08
---

Tracker is the delivery authority for versions, roadmap tasks, and bugs. Its SQLite database is the source of truth. GitHub Issues is only the external bug surface.

## Service contract

| Field | Verified value |
| --- | --- |
| Purpose | Versioned roadmap, kanban, delivery status, and public bug synchronization. |
| Audience | Platform users read status. Maintainers manage delivery records. Operators preserve the database. |
| Public boundary | `https://tracker.beskid-lang.org`. |
| Local boundary | The service listens on `http://localhost:3000` in the reference container. |
| Authentication | Tracker uses the central Auth hub for GitHub sign-in and pairing. |
| Persistent state | SQLite persists below `TRACKER_DATA_DIR` in the `tracker-data` volume. |
| Container image | `ghcr.io/cyber-nomad-collective/beskid-tracker`. |
| Health check | `GET /api/health` on port `3000`. |
| Deployment owner | Root platform delivery publishes the image. The Tracker service owns delivery data. |
| Secret source | OpenBao path `secret/beskid/<lane>/tracker`. |
| Monitoring | Health status, webhook results, and reconciliation output cover runtime and synchronization. |
| Recovery | Restore the SQLite volume before replaying external bug events. Never replace roadmap state with GitHub data. |

## Prerequisites

Confirm the selected delivery version and the configured `TRACKER_DATA_DIR`. Treat Tracker as the delivery authority. Obtain a consistent SQLite backup before data maintenance.

## Actions

1. Verify the service contract at `https://tracker.beskid-lang.org/api/health` and record its status.
2. Verify that the configured volume contains the active SQLite database.
3. Run the read-only reconciliation plan before an import or bug synchronization change.

## Expected result

The `/api/health` request succeeds. SQLite remains the delivery authority, and GitHub synchronization affects only eligible bugs.

## Recovery

If the health request fails, inspect the volume mount and session configuration. If reconciliation differs from the expected plan, stop the mutation. Then restore the SQLite backup, redeploy the prior image, and replay only verified bug events.

## Next task

[Change the Standard without changing delivery ownership](/docs/contributing/standard-changes/).
