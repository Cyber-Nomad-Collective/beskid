---
title: Diagnostics parity (CLI and LSP) - FAQ and troubleshooting
description: Troubleshooting mismatched diagnostics between command-line and
  editor surfaces.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

## Why do line labels differ between CLI and editor?
Different surfaces intentionally use different source labels; compare rule code, severity, and span semantics.

## Why does editor show fewer errors after edits?
Snapshot reuse may be active; trigger a fresh analysis cycle to confirm parity.

## Are parse and semantic diagnostics expected to be identical text?
No. Contract requires semantic parity and stable classification, not byte-identical messages.
