---
title: Contracts and edge cases
description: Non-negotiable parser contracts and common edge-case handling rules.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

Key front-end contracts:

- Parse failures must map to source spans users can act on.
- Syntax nodes must preserve declaration identity needed by item resolution.
- Optional syntax forms (attributes, docs, modifiers) must have explicit absent-state semantics, not implicit null behavior.

Frequent edge cases:

- Unterminated grouped constructs should produce one primary error and avoid noisy cascades.
- Unknown tokens after valid prefixes should preserve partial nodes for downstream reporting when safe.
- Ambiguous grammar expansions must be resolved in parser logic, not deferred into semantic phases.
