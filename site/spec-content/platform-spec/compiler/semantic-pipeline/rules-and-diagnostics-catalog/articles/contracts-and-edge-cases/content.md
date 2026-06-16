---
title: Contracts and edge cases
description: Rule-level guarantees and high-risk semantic edge cases.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

Contracts enforced by semantic rules:

- Rules must report through canonical issue kinds, not ad-hoc string identifiers.
- Rules should not mutate resolver state while validating semantic constraints.
- Rule failures must preserve source spans that point to user-owned code.

Edge cases to monitor:

- Forward references across modules with cyclical dependencies.
- Generic-like type usage that resolves in parser form but fails in semantic type passes.
- Method and contract member collisions discovered only after full symbol table assembly.
