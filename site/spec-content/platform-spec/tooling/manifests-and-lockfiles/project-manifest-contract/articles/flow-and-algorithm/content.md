---
title: Flow and algorithm
description: Manifest validation and Mod package discovery flow.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-20
---

## Validation flow

1. Parse `Project.proj` into `ProjectManifest`.
2. Classify project type. If **`Mod`**, validate optional `project.mod` keys (`maxGeneratorRounds`, `capabilities`, `artifactPolicy`).
3. Insert node into workspace/project graph; reject invalid Mod dependency topology.
4. For host builds, resolve transitive `Mod` dependencies and ensure AOT artifacts are available (build or cache hit).

## Host compilation flow

1. Build `CompilePlan` for App/Lib/Test host target.
2. Resolve transitive `Mod` packages from dependency graph.
3. Load/build mod AOT artifacts (`mod.load`).
4. Run `Collector` → `Generator` → semantic → `Analyzer` → optional `Rewriter` per **[Stage ordering](/platform-spec/compiler/build-pipeline/stage-ordering/)**.

Lockfile and materialized dependency roots for mod packages use the same workspace materialization path as ordinary projects.
