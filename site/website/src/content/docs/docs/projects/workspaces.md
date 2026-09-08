---
title: Use a workspace
description: Group projects in a .bws manifest and select one member and target.
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

2. Select the application member explicitly:

   ```bash
   beskid analyze --project ./Workspace.bws --workspace-member app --target App --plain
   ```

3. Run the same command from a source path under `app` without `--workspace-member`. Confirm that source-path discovery selects the deepest matching member.
4. Keep `--workspace-member app` in automation so directory layout changes cannot change the selected member.

## Expected result

The command reports the selected member as `app`. The selected target is `App` from the member's project manifest. Without an explicit member, selection uses the input path, then `defaultTestMember`, then the first declared member.

## Recovery

If a directory contains multiple `.bws` files, keep only the intended workspace manifest or pass its path with `--project`. If selection is wrong, pass `--workspace-member` and `--target`. If a member directory contains zero or multiple `.bproj` files, fix that member directory before retrying.

## Next task

Resolve the selected member's [dependencies and lockfile](/docs/projects/dependencies-and-locks/).
