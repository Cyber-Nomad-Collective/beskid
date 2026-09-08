---
title: Consume a package
description: Request a package version, inspect the resolved lock entry, and stop on a mismatch.
audience:
  - developer
authority:
  status: informative
  sourceLabel: Pinned registry dependency materializer
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_compiler/blob/252aa528ac7ee01a64e49e9b88b32393206fbd71/crates/beskid_analysis/src/projects/workflow/registry.rs
  limits: This procedure uses exact versions. It does not define registry version-selection policy.
verified:
  revision: 252aa528ac7ee01a64e49e9b88b32393206fbd71
  date: 2026-09-08
---

Inspect a package before you add it. Declare the requested version in the consuming `.bproj` manifest.

## Prerequisites

Know the package name and requested version. Select the consuming project. Ensure that the registry is reachable.

## Actions

1. Inspect the package and its active versions. Confirm that the requested version is listed:

   ```bash
   beskid pckg details Acme.Math
   beskid pckg versions Acme.Math
   ```

2. Optionally download that coordinate for offline inspection:

   ```bash
   beskid pckg download Acme.Math --version 1.0.0 --output ./vendor/Acme.Math-1.0.0.bpk
   ```

3. Add the dependency to `App.bproj`:

   ```text
   dependency "Acme.Math" {
     source = "registry"
     version = "1.0.0"
   }
   ```

4. Resolve once to update the lockfile:

   ```bash
   beskid fetch --project ./App.bproj --plain
   ```

5. Inspect `Project.lock` after every registry resolution. Find the `Acme.Math` entry and compare `resolved_version` with `1.0.0`.
6. You must stop the workflow if `resolved_version` differs from the requested version. Do not analyze, build, test, or publish with that lockfile.
7. Commit the lockfile only after the values match. Then repeat with the reviewed lockfile enforced:

   ```bash
   beskid fetch --project ./App.bproj --locked --plain
   ```

## Expected result

`Project.lock` records the resolver's selected `resolved_version`. After review, the archive is extracted under `obj/beskid/deps/src/<materialized-id>`. `--locked` and `--frozen` preserve reviewed lock behavior on later runs.

The current resolver can fall back to the first active version when the requested version is absent. This behavior is an implementation limitation under reconciliation. Initial registry resolution is not an exact-version guarantee.

## Recovery

If the requested version is absent, run `beskid pckg versions Acme.Math` and select an active coordinate. If the resolver falls back, stop the workflow and remove the unreviewed lockfile change. A yanked version is not available for a new download. If `--locked` reports drift, review the manifest change and regenerate the lockfile outside CI.

## Next task

Apply [credential and failure recovery](/docs/packages/credentials-and-recovery/) or enforce the lock in [CI](/docs/tooling/ci/).
