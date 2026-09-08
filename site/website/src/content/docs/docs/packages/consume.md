---
title: Consume a package
description: Inspect an active package version, declare it, and resolve it into a project lockfile.
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

Inspect a package before you add it. Declare an exact active version in the consuming `.bproj` manifest.

## Prerequisites

Know the package name and exact version. Select the consuming project. Ensure that the registry is reachable.

## Actions

1. Inspect the package and its active versions:

   ```bash
   beskid pckg details Acme.Math
   beskid pckg versions Acme.Math
   ```

2. Optionally download the exact artifact for offline inspection:

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

4. Resolve once to update the lockfile, then review its diff:

   ```bash
   beskid fetch --project ./App.bproj --plain
   ```

5. Repeat with the reviewed lockfile enforced:

   ```bash
   beskid fetch --project ./App.bproj --locked --plain
   ```

## Expected result

`Project.lock` records `Acme.Math` at version `1.0.0`. The verified archive is extracted under `obj/beskid/deps`. Later locked resolution selects the same coordinate.

## Recovery

If resolution cannot find the version, run `beskid pckg versions Acme.Math` and choose an active exact version. A yanked version is not available for a new download. If `--locked` reports drift, review the manifest change and regenerate the lockfile outside CI.

## Next task

Apply [credential and failure recovery](/docs/packages/credentials-and-recovery/) or enforce the lock in [CI](/docs/tooling/ci/).
