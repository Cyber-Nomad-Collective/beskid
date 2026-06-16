---
title: Contracts and edge cases
description: MUST rules for Core.Text.Cursor.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-08
---

## Normative requirements

| ID | Requirement |
| --- | --- |
| **CURSOR-001** | `Cursor` **must** track `{ source: string, pos: i64 }`. |
| **CURSOR-002** | `Slice`, `Drop`, `Peek`, `Advance` **must** be bounds-safe. |
| **CURSOR-003** | `Position` **must** return current byte offset. |
| **CURSOR-004** | Hot paths **must not** allocate except `Slice`/`Drop` views. |
