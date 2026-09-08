---
title: "beskid fetch"
description: "Resolve and materialize project dependencies."
---

Resolves the dependency graph for a project (using the same discovery flags as other project commands) and materializes dependency sources into the workspace.
This command is available as `beskid fetch`.

## Arguments

| Argument | Description |
| --- | --- |
| `--project` | Project directory or `App.bproj` path |
| `--target` | Target name from the manifest |
| `--workspace-member` | Workspace member when resolving via `Workspace.bws` |
| `--frozen` | Require lockfile match; forbid updates |
| `--locked` | Require an existing lockfile |

## Example

```bash
beskid fetch --project path/to/App.bproj
```

On success, prints a short confirmation message.

For lockfile behavior and recovery, use [Dependencies and locks](/docs/projects/dependencies-and-locks/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)
