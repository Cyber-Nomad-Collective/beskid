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

Resolution creates or checks `Project.lock`. It materializes each dependency under the selected project's `obj/beskid/deps/src/<materialized-id>` path.

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

2. Declare a requested registry version:

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

4. Inspect `Project.lock` after every registry resolution. Compare `resolved_version` with the requested version. Stop the workflow if `resolved_version` differs from the requested version.
5. Review each materialized leaf under `obj/beskid/deps/src/<materialized-id>`.
6. Require an existing lockfile that matches resolution:

   ```bash
   beskid fetch --project ./App.bproj --locked --plain
   ```

7. Forbid lockfile updates during resolution:

   ```bash
   beskid fetch --project ./App.bproj --frozen --plain
   ```

## Expected result

`Project.lock` records each resolved dependency and its materialized root. The resolver copies or extracts dependency sources under `obj/beskid/deps/src/<materialized-id>`. The project loader can load declared generated modules from the project-level `.generated` directory as `*.g.bd` files. That directory is not dependency storage.

The current resolver can fall back to the first active version when the requested registry version is absent. This behavior is an implementation limitation under reconciliation. A newly resolved lockfile does not prove that the resolver selected the requested version.

After you review the resolved version, `--locked` requires `Project.lock` to exist and match resolution. `--frozen` also forbids a lockfile update. These flags preserve reviewed lock behavior, but they do not make initial registry selection fail closed.

## Recovery

If the manifest changed intentionally, run `beskid lock --project ./App.bproj --plain`, review the diff, and commit it. Registry fallback is an implementation limitation under reconciliation. If registry resolution selects a different version, stop and do not build or publish. This workflow does not materialize Git dependencies. Replace `source = "git"` with a path or registry dependency before a strict build.

## Next task

[Consume a registry package](/docs/packages/consume/) or apply the same frozen policy in [CI](/docs/tooling/ci/).
