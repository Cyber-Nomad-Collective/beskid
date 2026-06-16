---
title: Console terminal events
description: Terminal resize detection and ConsoleMessage delivery over channels and events.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-21
---

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
How the corelib observes **terminal size changes** and notifies UI code: `Platform.Terminal.QuerySize`, `PollResize` → `Channel<ConsoleMessage>`, and same-fiber `OnResize` event hubs. No new runtime builtins—only existing environment, ioctl externs, and fiber/channel primitives.
</SpecSection>

<SpecSection title="Contract statement" id="contract-statement">
- `Console.ConsoleSize` uses **character cells** (`columns`, `rows` as `i32`).
- `QuerySize` **must** try platform `Winsize` (Linux, macOS, Windows) then fall back to `COLUMNS` / `LINES` parsing.
- `PollResize` **must** `Send` `ConsoleMessage::Resize(now)` only when dimensions change.
- `SubscribeOnResize` **must** invoke the handler synchronously once with the current size after subscription.
- Resize delivery **must not** use a separate OS-thread callback API in v1.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/corelib/packages/console/src/Platform/Terminal.bd`
- `compiler/corelib/packages/console/src/Console.bd`
- `compiler/corelib/packages/console/src/Console/ConsoleMessage.bd`
- Tests: `ConsoleMessageChannelTests.bd`
</SpecSection>

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-CORE-TERM-0050` … `D-CORE-TERM-0052`); use the reader **ADRs** tab for expandable detail.
