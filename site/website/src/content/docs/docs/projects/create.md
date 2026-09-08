---
title: Create a project
description: Instantiate a project template and verify its manifest, target, and source tree.
pageKind: task
diagramPolicy: not-needed
diagramOmissionReason: The project creation procedure is a short linear scaffold-and-check sequence.
audience:
  - developer
authority:
  status: informative
  sourceLabel: Pinned Beskid new command
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_compiler/blob/252aa528ac7ee01a64e49e9b88b32393206fbd71/crates/beskid_cli/src/commands/new.rs
  limits: This procedure uses an installed template. Template authors can define additional symbols and post-actions.
verified:
  revision: 252aa528ac7ee01a64e49e9b88b32393206fbd71
  date: 2026-09-08
---

Use `beskid new` to instantiate a template. The example creates a console project without an interactive prompt.

## Prerequisites

Install Beskid. Confirm that you have an installed `console` template. Choose an empty output directory. The noninteractive command fails if a required template symbol is missing.

## Actions

1. List the installed templates:

   ```bash
   beskid new list
   ```

2. Create the project:

   ```bash
   beskid new console -n MyApp -o ./MyApp --no-interactive
   ```

3. Confirm that the command reports `Created template output at ./MyApp`. The installed template controls the emitted file names.
4. Inspect the single `.bproj` manifest for its target name and source entry.
5. Analyze the target with those exact values:

   ```bash
   project_manifest=./MyApp/MyApp.bproj
   target_name=App
   beskid analyze --project "$project_manifest" --target "$target_name" --plain
   ```

## Expected result

The create command reports `Created template output at` followed by the output path. The output directory contains exactly one `.bproj` manifest. Analysis selects the target that you read from that manifest and reports no error diagnostics.

## Recovery

If `console` is absent, run `beskid new list --online`, then install the required template. If the output directory is not empty, choose another directory. Use `--force` only after you inspect the existing files because it permits writes into a non-empty directory.

## Next task

Add the project to a [workspace](/docs/projects/workspaces/) or configure its [dependencies and lockfile](/docs/projects/dependencies-and-locks/).
