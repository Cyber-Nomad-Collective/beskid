---
title: Channel default capacity is unbounded
description: Factory defaults and explicit bounded/unbounded options for Channel
  construction.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-CONC-0001
adrStatus: Accepted
adrDate: 2025-08-01
lastReviewed: 2026-05-22
---

## Context

Authors need predictable queue semantics without implicit blocking on the default channel.

## Decision

| Rule | Detail |
| --- | --- |
| Default | **Unbounded** when `ChannelOptions` is omitted or no bounded capacity is set |
| Bounded | `ChannelOptions.Bounded(n)` with `` `n > 0` `` |
| Unbounded | `ChannelOptions.Unbounded` (equivalent to default) |
| Factory | `` `Channel<T>.Create(options: ChannelOptions = default)` `` |

## Consequences

Documentation **must** warn about memory growth on unbounded channels. Bounded queues park senders when full.

## Verification anchors

Corelib concurrency tests; runtime channel builtins.
