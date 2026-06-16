---
title: Dependency workspace and lockfile - Flow and algorithm
description: Workflow from compile-plan construction to workspace
  materialization and lockfile synchronization.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

1. Build compile plan from manifest graph.
2. Materialize dependency sources into workspace object directory.
3. Read and reconcile `Project.lock` against resolved dependencies.
4. Enforce `locked`/`frozen` policy.
5. Expose final materialized source root to compile commands.

This flow is implemented in project workflow services and reused by fetch/lock/tree command surfaces.
