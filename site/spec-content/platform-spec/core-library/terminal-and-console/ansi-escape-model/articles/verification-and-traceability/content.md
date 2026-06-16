---
title: Verification and traceability
description: Golden tests and source anchors for ANSI escape framing.
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

Document **verification and traceability** for the **Ansi Escape Model** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Ansi Escape Model](/platform-spec/core-library/terminal-and-console/ansi-escape-model/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

### Source anchors

| Path | Coverage |
| --- | --- |
| `compiler/corelib/packages/console/src/Ansi/Escape.bd` | ESC, CSI, private mode, DEC, OSC, gating |
| `compiler/corelib/packages/console/src/Ansi/Cursor.bd` | Movement CSI |
| `compiler/corelib/packages/console/src/Ansi/Erase.bd` | Display/line erase |
| `compiler/corelib/packages/console/src/Ansi/Sgr.bd` | SGR builder and downgrade |
| `compiler/corelib/packages/console/src/Ansi/Screen.bd` | Scroll region / alt screen |
| Repository `ANSI.md` | Informative full sequence catalog |

### Corelib tests

| Test file | Asserts |
| --- | --- |
| `AnsiEscapeTests.bd` | CSI bold red, reset, `?1049h`, DEC save, cursor home, erase display |
| `AnsiSgrGoldenTests.bd` | SGR chains and reset suffix |
| `AnsiStyleChainTests.bd` | Markup attribute chain → escapes |
| `AnsiBuildersTests.bd` | Screen scroll region framing |
| `CapabilitiesTests.bd` | Gated vs empty output when ANSI disabled |

Tests live under `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/` and run as part of the `corelib_tests` project.

### Traceability rule

Any change to **ANSI-001** through **ANSI-008** in [contracts and edge cases](./contracts-and-edge-cases/) **must** update or add a golden test in the same change. Informative `ANSI.md` updates are recommended but not CI-gated.

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/ansi-escape-model/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
