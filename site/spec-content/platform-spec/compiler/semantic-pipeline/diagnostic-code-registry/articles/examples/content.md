---
title: Examples
description: Representative registry update scenarios and expected outcomes.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

Example A: adding a new semantic issue

1. Add a new issue kind and code in `diagnostic_kinds.rs`.
2. Emit it from the relevant staged rule.
3. Add/update docs and sync checks.
4. Verify CLI and LSP both expose the new code.

Example B: deprecating an old code

1. Keep legacy code mapping documented.
2. Route rule output to a replacement code behind an explicit migration step.
3. Update troubleshooting notes for users with code-based alerting.
