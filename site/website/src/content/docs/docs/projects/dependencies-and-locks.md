---
title: Resolve dependencies and locks
description: Declare path and registry dependencies, materialize them, and enforce Project.lock.
audience:
  - developer
  - operator
authority:
  status: informative
  sourceLabel: Pinned dependency preparation implementation
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_compiler/blob/252aa528ac7ee01a64e49e9b88b32393206fbd71/crates/beskid_analysis/src/projects/workflow/prepare.rs
  limits: This procedure covers implemented path and registry materialization. Git dependency materialization is not implemented.
verified:
  revision: 252aa528ac7ee01a64e49e9b88b32393206fbd71
  date: 2026-09-08
---

Resolution creates or checks `Project.lock`. It materializes dependency sources under the selected project's `obj/beskid/deps` directory.

## Prerequisites

Select one project manifest. Ensure that each local dependency has one `.bproj` file. Confirm registry access before you resolve a registry dependency. Commit `Project.lock` for reproducible work.

## Actions

1. Declare a path dependency relative to the consuming project:

   ```text
   dependency "Core" {
     source = "path"
     path = "../core"
   }
   ```

2. Declare a registry dependency with an exact version:

   ```text
   dependency "Acme.Math" {
     source = "registry"
     version = "1.0.0"
   }
   ```

3. Resolve dependencies and allow a lockfile update:

   ```bash
   beskid fetch --project ./App.bproj --plain
   ```

4. Review the changed `Project.lock` and the materialized paths under `obj/beskid/deps`.
5. Require an existing lockfile that matches resolution:

   ```bash
   beskid fetch --project ./App.bproj --locked --plain
   ```

6. Forbid lockfile updates during resolution:

   ```bash
   beskid fetch --project ./App.bproj --frozen --plain
   ```

## Expected result

`Project.lock` records each resolved dependency and its materialized root. Dependency sources are copied or extracted under `obj/beskid/deps`. Declared generated modules can be loaded from the project-level `.generated` directory as `*.g.bd` files; they are not dependency storage.

`--locked` requires `Project.lock` to exist and match resolution. `--frozen` also forbids a lockfile update. Neither option silently repairs drift.

## Recovery

If the manifest changed intentionally, run `beskid lock --project ./App.bproj --plain`, review the diff, and commit it. If a registry version is absent or yanked, select an active exact version. Git dependencies are not materialized by this workflow. Replace `source = "git"` with a path or registry dependency before a strict build.

## Next task

[Consume a registry package](/docs/packages/consume/) or apply the same frozen policy in [CI](/docs/tooling/ci/).
