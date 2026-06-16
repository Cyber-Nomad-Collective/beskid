---
title: Workspace resolution contract - FAQ and troubleshooting
description: Common newcomer questions for project graph resolution, manifests,
  and lock behavior.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

## Why does the compiler ignore my workspace target?
Explicit file input overrides target inference; remove the explicit path to use manifest target resolution.

## Why did a dependency warning not fail the command?
The command may be using a warning-oriented unresolved dependency policy. Use a strict mode command or policy where available.

## Why does lockfile behavior differ between commands?
`--frozen` and `--locked` are command-level options propagated into workspace preparation options.
