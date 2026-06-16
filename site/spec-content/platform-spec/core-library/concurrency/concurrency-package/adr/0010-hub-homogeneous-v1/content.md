---
title: Homogeneous Hub in v1
description: Hub type parameter, limits, and heterogeneous deferral.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-CONC-0010
adrStatus: Accepted
adrDate: 2025-08-01
lastReviewed: 2026-05-22
---

## Context

Heterogeneous select requires tagged unions or multiple hubs in v1.

## Decision

| Rule | Detail |
| --- | --- |
| Fairness | Round-robin (see D-CORE-CONC-0003) |
| Max registrations | **256** per hub (`HubError::Limit` possible) |
| Element type | **Homogeneous** — one `` `Hub<T>` `` wraps only `` `Channel<T>` `` with same ``T`` |
| Heterogeneous | **Not v1** — use multiple hubs or `` `Channel<HubMessage>` `` |
| Result | ``HubReceiveResult { index: i64, value: T }`` |

## Consequences

UI/console hubs should stay well below 256 registrations.

## Verification anchors

Hub builtin tests; examples article.
