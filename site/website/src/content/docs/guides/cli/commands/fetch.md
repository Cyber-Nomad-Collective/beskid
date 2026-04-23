---
title: "beskid fetch"
description: "Resolve and materialize project dependencies."
---

Resolves the dependency graph for a project (using the same discovery flags as other project commands) and materializes dependency sources into the workspace.

## Arguments

| Argument | Description |
| --- | --- |
| `--project` | Project directory or `Project.proj` path |
| `--target` | Target name from the manifest |
| `--workspace-member` | Workspace member when resolving via `Workspace.proj` |
| `--frozen` | Require lockfile match; forbid updates |
| `--locked` | Require an existing lockfile |

## Example

```bash
beskid fetch --project path/to/Project.proj
```

On success, prints a short confirmation message.

[← Back to CLI command reference](/guides/cli/command-reference/)
