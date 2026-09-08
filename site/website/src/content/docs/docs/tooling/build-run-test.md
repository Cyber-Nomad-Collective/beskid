---
title: Build, run, and test
description: Analyze source, create an AOT artifact, execute it, and run declared test items.
audience:
  - developer
authority:
  status: informative
  sourceLabel: Pinned Beskid CLI build command
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_compiler/blob/252aa528ac7ee01a64e49e9b88b32393206fbd71/crates/beskid_cli/src/commands/build.rs
  limits: Output names depend on the selected host and target. This page does not define project target semantics.
verified:
  revision: 252aa528ac7ee01a64e49e9b88b32393206fbd71
  date: 2026-09-08
---

Build and run use ahead-of-time compilation. `run` creates a temporary executable and starts it. `build` preserves the requested output.

## Prerequisites

Start with source that passes `beskid analyze`. To run test items, select a project with a valid `.bproj` manifest and a Test or Lib target.

## Actions

1. Analyze one source file:

   ```bash
   beskid analyze Main.bd --plain
   ```

2. Build a debug executable:

   ```bash
   beskid build Main.bd --kind exe --plain
   ```

3. Build an optimized executable when you need a release artifact:

   ```bash
   beskid build Main.bd --kind exe --release --plain
   ```

4. Compile and execute the same entrypoint in a subprocess:

   ```bash
   beskid run Main.bd --entrypoint Main --plain
   ```

5. Run test items for a selected project target:

   ```bash
   beskid test --project App.bproj --target AppTests --plain
   ```

6. Use `--include-tag`, `--exclude-tag`, or `--group` to narrow tests. Use `--all-targets` to run every Test target in one project process.

## Expected result

The build command prints the object path and final output path. The run command returns the subprocess status. The test command reports passed, failed, skipped, and filtered items; it fails when a selected test fails.

## Recovery

Treat the first error as the active failure. Fix analysis errors before code generation. A target-selection error requires a valid `.bproj` target name. A runtime-kit error requires a kit whose target and debug or release profile match the build. Do not select both `--prefer-static` and `--prefer-dynamic`.

## Next task

[Run the same gates in CI](/docs/tooling/ci/) or read [Projects](/docs/projects/) before you add targets and dependencies.
