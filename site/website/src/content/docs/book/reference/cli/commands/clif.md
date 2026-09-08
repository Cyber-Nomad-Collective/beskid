---
title: "beskid clif"
description: "Lower a Beskid program to CLIF and print the IR."
---

Lowers a resolved Beskid source file into **CLIF** and prints the resulting IR to stdout.
This command is available as `beskid clif`.

## Arguments

| Argument | Description |
| --- | --- |
| `[INPUT]` | Optional `.bd` entry |
| `--project` | Project directory or `App.bproj` path |
| `--target` | Target name from the manifest |
| `--workspace-member` | Workspace member when resolving via `Workspace.bws` |
| `--frozen` | Require lockfile match; forbid updates |
| `--locked` | Require an existing lockfile |
| `--plain` | Disable animated resolve and lowering progress |

## Example

```bash
beskid clif --project path/to/App.bproj
```

For the executable check sequence and recovery steps, use [Build, run, and test](/docs/tooling/build-run-test/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)
