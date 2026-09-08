---
title: Get started
description: Follow the verified path from installation to a checked and executed Beskid program.
pageKind: guide
diagramPolicy: not-needed
diagramOmissionReason: This short route delegates decisions to the detailed task pages.
audience:
  - evaluator
  - newcomer
authority:
  status: informative
  sourceLabel: Pinned Beskid CLI command model
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_compiler/blob/252aa528ac7ee01a64e49e9b88b32393206fbd71/crates/beskid_cli/src/cli.rs
  limits: This page orders the first-day tasks. The linked task pages contain the commands and recovery details.
verified:
  revision: 252aa528ac7ee01a64e49e9b88b32393206fbd71
  date: 2026-09-08
---

Complete these tasks in order. The path uses a single source file, so you do not need a project manifest.

## Orientation

Use a supported host: Linux on AMD64, macOS on ARM64, or Windows on AMD64. You need a terminal and permission to install a user-local program.

## Choose the first task

1. [Install Beskid](/docs/getting-started/install/).
2. [Write and run a program](/docs/getting-started/first-program/).
3. [Connect an editor](/docs/getting-started/editor/).
4. Keep [first-day troubleshooting](/docs/getting-started/troubleshooting/) open until all checks pass.

## Limits

`beskid --version` succeeds, `beskid analyze Main.bd --plain` reports no error diagnostics, and `beskid run Main.bd --plain` exits with status `0`.

Stop at the first failed check. Use the recovery section on that task page before you continue. Do not bypass an analysis error with a build command.

## Next steps

Open [Install Beskid](/docs/getting-started/install/) to select a release channel and install the CLI.
