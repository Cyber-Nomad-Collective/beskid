---
title: Flow and algorithm
description: PollResize and RunTick integration.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-21
---

## Purpose

Document **flow and algorithm** for the **Console Terminal Events** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Terminal Events](/platform-spec/core-library/terminal-and-console/console-terminal-events/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

### `PollResize` algorithm

1. `now ← QuerySize()` (platform winsize chain → env fallback)
2. If `now.columns != lastSize.columns` OR `now.rows != lastSize.rows`:
   - `lastSize ← now`
   - `messages.Send(ConsoleMessage::Resize(now))` (ignore send errors)
3. Return

### `PollResizeHub` (same fiber)

Compare `hub.lastSize` to `QuerySize()`; on change update cache and invoke `hub.OnResize(now)` synchronously.

### `RunTick`

Delegates to `Platform.Terminal.PollResize` then optional tick messages for controls—pairs with [Console controls](/platform-spec/core-library/terminal-and-console/console-controls/flow-and-algorithm/).

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-terminal-events/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
