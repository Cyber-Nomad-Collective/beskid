---
title: Dependency workspace and lockfile - Design model
description: Data model for compile plans, prepared workspaces, lock records,
  and dependency source roots.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

The model separates planning from materialization:

- `CompilePlan` describes target graph and dependency intent.
- `PreparedProjectWorkspace` records concrete source roots under `obj/beskid/deps/src`; these paths are **authoritative** for **[Program assembly](/platform-spec/compiler/build-pipeline/program-assembly/)** when present.
- `WorkspacePrepareOptions` carries lock policy (`frozen`, `locked`).
- `Project.lock` is the persisted snapshot used for repeatable resolution.
