---
title: Dependency workspace and lockfile - Examples
description: Concrete examples for frozen and locked workflows with project dependencies.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

- **Fresh install:** no lockfile, normal mode creates `Project.lock v1`.
- **CI locked mode:** `--locked` fails if dependency versions differ from lockfile.
- **Frozen release mode:** `--frozen` compiles only when current lockfile already matches graph.
- **Registry outage:** optional dependency fetch failure is surfaced according to unresolved policy.
