---
title: Verification and traceability
description: Control layout tests and module paths.
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

Document **verification and traceability** for the **Console Controls** feature: role-specific normative detail beyond the feature hub.

## Canonical references

- Feature hub: [Console Controls](/platform-spec/core-library/terminal-and-console/console-controls/)
- Sibling articles in this bundle (design model, contracts, flow, examples, verification)

## Detailed behavior

| Test | Coverage |
| --- | --- |
| `ControlsFrameTests.bd` | Frame save/restore wrapping |
| `ControlsPanelTests.bd` | Panel borders |
| `ControlsProgressBarTests.bd` | Ratio rendering |
| `ControlsLayoutTests.bd` | Stack measurement |

Sources under `compiler/corelib/packages/console/src/Console/Controls/`.

## Verification

See the verification and traceability article in this bundle and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/console/`.

## Related topics

- Parent [feature hub](/platform-spec/core-library/terminal-and-console/console-controls/) and [Terminal and console area](/platform-spec/core-library/terminal-and-console/)
