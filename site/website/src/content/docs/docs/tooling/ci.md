---
title: Run Beskid in CI
description: Use lockfile, plain-output, format, analysis, test, and build gates in a reproducible pipeline.
audience:
  - developer
  - operator
authority:
  status: informative
  sourceLabel: Pinned Beskid CLI lockfile policy
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_compiler/blob/252aa528ac7ee01a64e49e9b88b32393206fbd71/crates/beskid_cli/src/project_args.rs
  limits: This procedure defines CLI use in automation. Your CI system still owns checkout, caching, credentials, and artifact retention.
verified:
  revision: 252aa528ac7ee01a64e49e9b88b32393206fbd71
  date: 2026-09-08
---

Use one pinned toolchain release and a committed lockfile. `--frozen` requires current resolution and forbids a lockfile update. `--plain` disables animated output.

## Prerequisites

Commit the project `.bproj` manifest and `Project.lock`. Pin the same immutable Beskid release on every runner. Store package credentials in the CI secret store, not in the repository or command log.

## Actions

1. Install the pinned toolchain release.
2. Verify the selected version and target:

   ```bash
   beskid --version
   beskid up host-target
   ```

3. Check the case-sensitive `Src` source root without changing files. Substitute the path when the manifest declares a different source root:

   ```bash
   beskid format Src --check
   ```

4. Analyze with frozen resolution:

   ```bash
   beskid analyze --project App.bproj --frozen --plain
   ```

5. Run tests with frozen resolution and a machine-readable summary:

   ```bash
   beskid test --project App.bproj --all-targets --frozen --plain --json
   ```

6. Build the release target with the same resolution policy:

   ```bash
   beskid build --project App.bproj --target App --release --frozen --plain
   ```

7. Publish only the output from a job in which all prior commands succeeded.

```mermaid
flowchart LR
  accTitle: Reproducible CI
  accDescr: A pinned toolchain checks format, resolves a frozen lockfile, analyzes, tests, and AOT-builds before CI publishes an artifact.
  A[Pinned toolchain] --> B[Format check]
  B --> C[Frozen analyze]
  C --> D[Frozen tests]
  D --> E[Frozen release build]
  E --> F[Publish artifact]
```

### Diagram text

1. Install and verify one immutable toolchain release.
2. Check formatting before compilation.
3. Use `--frozen` for analysis, tests, and the release build.
4. Publish only after every gate succeeds.

## Expected result

Every gate uses the same toolchain and lockfile. Logs contain stable, non-animated output. The final job retains the native release artifact only after format, analysis, and tests succeed.

## Recovery

If `--frozen` rejects the project, update and review `Project.lock` outside CI, then commit it. If the host target differs, select the matching runner or release artifact. If a test fails, retain its JSON summary and do not publish the build.

## Next task

Read [Projects](/docs/projects/) for manifest and lockfile tasks, or [Packages](/docs/packages/) before you publish a package.
