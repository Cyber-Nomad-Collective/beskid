---
title: "beskid dev syntax clif"
description: "Lower a Beskid program to CLIF and print the IR."
---

Lowers a resolved Beskid source file into **CLIF** and prints the resulting IR to stdout.
This command is available as `beskid dev syntax clif`.

## Arguments

| Argument | Description |
| --- | --- |
| `[INPUT]` | Optional `.bd` entry |
| `--project` | Project directory or `Project.proj` path |
| `--target` | Target name from the manifest |
| `--workspace-member` | Workspace member when resolving via `Workspace.proj` |
| `--frozen` | Require lockfile match; forbid updates |
| `--locked` | Require an existing lockfile |

## Example

```bash
beskid dev syntax clif --project path/to/Project.proj
```

[← Back to CLI command reference](/book/reference/cli/command-reference/)
