---
title: Concurrency.NowMillis monotonic clock
description: Monotonic time API owned by concurrency package in v0.2.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-CONC-0013
adrStatus: Accepted
adrDate: 2025-08-01
lastReviewed: 2026-05-22
---

## Context

Legacy `rt_now_millis` and scattered clock builtins confuse package boundaries.

## Decision

`` `Concurrency.NowMillis() -> i64` `` in concurrency package replaces legacy `rt_now_millis`. Wall clock deferred to future `Core.Time`.

## Consequences

Wall-clock ADR required before exposing civil time in corelib.

## Verification anchors

Builtin spec table; corelib clock smoke tests.
