---
title: Contracts and edge cases
description: Layout and redraw requirements for console controls.
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

Document **contracts and edge cases** for the **Console Controls** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Controls](/platform-spec/core-library/terminal-and-console/console-controls/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

### Normative requirements

| ID | Requirement |
| --- | --- |
| **CTL-001** | `Frame.Render` **must** clamp child layout to `columns` × `rows` from `ConsoleSize`. |
| **CTL-002** | Progress ratio **must** be in `0..=1`; out-of-range **should** clamp. |
| **CTL-003** | Full-screen controls **should** emit `Erase.DisplayAll` before draw when ANSI enabled. |
| **CTL-004** | `LiveTick` **must not** block the scheduler indefinitely; one tick == one render pass. |

### Edge cases

- Terminal shrink: controls **should** truncate lines rather than panic.
- Zero-size terminal: render **may** produce empty buffer.
- Resize mid-frame: next tick or `ConsoleMessage::Resize` **should** trigger relayout ([Console terminal events](/platform-spec/core-library/terminal-and-console/console-terminal-events/)).

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-controls/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
