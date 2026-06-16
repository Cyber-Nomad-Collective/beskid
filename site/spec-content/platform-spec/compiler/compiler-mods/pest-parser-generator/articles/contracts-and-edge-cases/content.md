---
title: Contracts and edge cases
description: MUST rules for grammar codegen.
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
| **GRAM-001** | Output **must** use `Core.Text.Parser` combinators only. |
| **GRAM-002** | Generated modules **must** land under `.beskid/obj/mods/<id>/generated/`. |
| **GRAM-003** | Host `beskid.pest` **must not** be modified by mod grammars. |
| **GRAM-004** | Unsupported Pest constructs **must** emit **E18xx** with actionable messages. |
| **GRAM-005** | Canonical grammars `regex.pest` and `console_markup.pest` **must** ship with corelib/console packages. |
