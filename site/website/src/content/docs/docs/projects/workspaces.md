---
title: Use a workspace
description: Group projects in a .bws manifest and select one member and target.
pageKind: task
diagramPolicy: not-needed
diagramOmissionReason: The Projects overview already shows the workspace and member relationships.
audience:
  - developer
authority:
  status: informative
  sourceLabel: Pinned workspace selection implementation
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_compiler/blob/252aa528ac7ee01a64e49e9b88b32393206fbd71/crates/beskid_analysis/src/projects/manifest_resolve.rs
  limits: This page explains discovery and selection. The Beskid Standard defines workspace fields.
verified:
  revision: 252aa528ac7ee01a64e49e9b88b32393206fbd71
  date: 2026-09-08
---

A workspace manifest lists project directories. Each member directory must contain exactly one `.bproj` manifest.

## Prerequisites

Create two project directories. Put one `.bproj` manifest in each directory. Keep the `.bws` file at their common root.

## Actions

1. Create `Workspace.bws`:

   ```text
   workspace {
     name = "Acme"
   }

   member "app" {
     path = "app"
   }

   member "core" {
     path = "core"
   }
   ```

2. Select the application member from a real source path:

   ```bash
   beskid analyze ./app/Src/Main.bd --project ./Workspace.bws --target App --plain
   ```

3. Source-path selection chooses the deepest matching member directory. Add `--workspace-member app` when you must override that result.
4. With no input path and no `--workspace-member`, selection uses `defaultTestMember` and then the first declared member.
5. Without `--target`, host target selection tries App, then Test, then Lib. It then uses the first remaining target.
6. Pass `--target` when the manifest has more than one target that could satisfy your task.

## Expected result

The source path selects the deepest matching member, which is `app` in this example. With no input path, selection uses `defaultTestMember` and then the first declared member. The selected target is the explicit `App` target.

## Recovery

If a directory contains multiple `.bws` files, keep only the intended workspace manifest or pass its path with `--project`. If selection is wrong, pass `--workspace-member` and `--target`. If a member directory contains zero or multiple `.bproj` files, fix that member directory before retrying.

## Next task

Resolve the selected member's [dependencies and lockfile](/docs/projects/dependencies-and-locks/).
