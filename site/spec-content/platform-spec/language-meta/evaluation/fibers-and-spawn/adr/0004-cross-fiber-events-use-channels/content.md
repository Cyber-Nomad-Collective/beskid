---
title: Cross-fiber notification uses Channel
description: Language events are single-fiber; another fiber must use Channel.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-FIBERS-0004
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

`event` multicast is defined for ownership within one fiber; UI/IO delivery across fibers needs a defined transport.

## Decision

Delivering notifications to **another** fiber **must** use `Channel<T>` (or coordination primitives), not language `event` delivery across fiber boundaries.

## Consequences

[Events](/platform-spec/language-meta/evaluation/events/) stays single-fiber; console and host specs reference channels for cross-fiber IO.

## Verification anchors

[Fibers and spawn](/platform-spec/language-meta/evaluation/fibers-and-spawn/); [Events](/platform-spec/language-meta/evaluation/events/).
