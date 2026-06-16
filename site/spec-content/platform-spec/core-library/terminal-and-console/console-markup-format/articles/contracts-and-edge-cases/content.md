---
title: Contracts and edge cases
description: Markup parsing rules and rendering requirements.
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

Document **contracts and edge cases** for the **Console Markup Format** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Markup Format](/platform-spec/core-library/terminal-and-console/console-markup-format/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

### Normative requirements

| ID | Requirement |
| --- | --- |
| **FMT-001** | Unclosed `**` or `__` spans **must** fall through as literal text (no panic). |
| **FMT-002** | Unknown bracket tag names **must** render as literal `[name]` text. |
| **FMT-003** | Backslash before a recognized sigil **must** emit the sigil literally and continue parsing. |
| **FMT-004** | `Format` **must** delegate to styled render only when `ShouldStyle()` is true. |
| **FMT-005** | Each styled span **should** reset attributes after the span (`StyleChain` / SGR reset). |
| **FMT-006** | `[label](url)` **must** emit OSC hyperlink when styled; literal when plain. |

### Supported constructs (v1)

Per [ADR D-CORE-TEXT-0001](./adr/0032-canonical-markup-syntax-v1/):

| Construct | Effect when styled |
| --- | --- |
| `**text**` | Bold |
| `*text*` | Italic |
| `__text__` | Underline |
| `~~text~~` | Strikethrough |
| `[red]text[/]` | Foreground palette (name table in `Attributes.bd`) |
| `&[fg=red](text)` | Attribute span (named, `#hex`, `rgb()`) |
| `[label](url)` | OSC hyperlink |
| `\[` etc. | Escape sigil |

### Edge cases

- Nested styles apply inner chain then outer tail recursively.
- Empty source returns `""`.
- Markup does not interpret HTML or full Markdown block syntax (headings, lists).

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-markup-format/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
