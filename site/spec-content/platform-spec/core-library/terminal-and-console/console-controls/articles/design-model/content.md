---
title: Design model
description: Control tree, render context, and character-grid layout.
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

Document **design model** for the **Console Controls** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Controls](/platform-spec/core-library/terminal-and-console/console-controls/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

### Control graph

| Type | Role |
| --- | --- |
| `Panel` | Bordered region with title |
| `VerticalStack` / `HorizontalStack` | 1D child arrangement |
| `ProgressBar` | Ratio fill inside width budget |
| `Frame` | Root container tying size + children |
| `LiveTick` | Schedules periodic `Render` invocations |

`RenderContext` carries current column/row cursor, available `ConsoleSize`, and whether ANSI motion is allowed.

### Rendering model

Layout is **greedy character grid**: children receive max width/height from parent minus borders/padding. Output is a single string buffer flushed with cursor save/restore per frame (see [ANSI escape model](/platform-spec/core-library/terminal-and-console/ansi-escape-model/design-model/) DEC sequences).

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-controls/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
