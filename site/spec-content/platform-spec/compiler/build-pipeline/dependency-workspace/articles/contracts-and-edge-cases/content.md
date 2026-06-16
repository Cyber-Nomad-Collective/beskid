---
title: Dependency workspace and lockfile - Contracts and edge cases
description: Normative behavior for lock mismatch, missing registry artifacts,
  and policy flags.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

- `--locked` must reject missing or out-of-date lockfiles.
- `--frozen` must reject changes that require writing lockfile updates.
- Registry dependency materialization failures must report stable project errors.
- Workspace prep must not silently change selected compile target.
